/*
MENU MODULE
*/

let menuItems = [];
let wishlistItems = [];
let wishlistMap = new Map();

let activeCategory = "all";
let currentSearchValue = "";
let isFullMenuVisible = false;

const menuContainer = getElement("menu-container");
const searchInput = getElement("searchInput");

const allButton = getElement("all-btn");
const chaiButton = getElement("chai-btn");
const coffeeButton = getElement("coffee-btn");
const snacksButton = getElement("snacks-btn");
const dessertsButton = getElement("desserts-btn");

const menuButtons = getElements(".menu-btn");

const menuWrapper = getElement("menu-wrapper");
const menuToggleButton = getElement("menu-toggle-button");
const menuToggleText = getElement("menu-toggle-text");
const menuToggleIcon = getElement("menu-toggle-icon");
const menuFade = getElement("menu-fade");

const DEFAULT_VISIBLE_ITEMS = 8;
const NEXT_ROW_PEEK = 110;
const MENU_IMAGE_FALLBACK = "images/logo chai.jpeg";


/*
LOAD MENU
*/

async function loadMenu() {
    if (!menuContainer) return;

    try {
        const response = await getMenuItems();

        if (!Array.isArray(response)) {
            throw new Error("Invalid menu response.");
        }

        menuItems = normalizeMenuItems(response);

        await loadUserWishlist();

        renderSpecialities();
        applyMenuFilters();

    } catch (error) {
        console.error("Menu loading failed:", error);

        renderRetryState(menuContainer, {
            title: "Menu Could Not Be Loaded",
            message:
                error.message ||
                "Unable to load menu items.",
            retryText: "Try Again",
            onRetry: loadMenu
        });

        showError(
            error.message ||
            "Unable to load menu."
        );
    }
}


/*
NORMALIZE MENU
*/

function normalizeMenuItems(items) {
    const categoryMap = {
        Tea: "chai",
        Coffee: "coffee",
        Burger: "snacks",
        Pizza: "snacks",
        Dessert: "desserts"
    };

    return items
        .map(item => {
            const rawCategory =
                String(item.category || "").trim();

            return {
                ...item,

                id: Number(item.id),

                name:
                    item.name ||
                    "Unnamed Item",

                description:
                    item.description ||
                    "No description available.",

                price:
                    Number(item.price || 0),

                rating:
                    Number(item.rating || 0),

                stock:
                    Number(item.stock || 0),

                available:
                    item.available !== false,

                image:
                    item.image ||
                    MENU_IMAGE_FALLBACK,

                badge:
                    item.badge ||
                    "Popular",

                badge_color:
                    item.badge_color ||
                    "yellow",

                category:
                    categoryMap[rawCategory] ||
                    rawCategory.toLowerCase()
            };
        })
        .filter(item => item.available);
}


/*
SPECIALITIES
*/

function renderSpecialities() {
    const container =
        getElement("specialities-container");

    if (!container) return;

    const featuredItems =
        menuItems
            .filter(item => item.featured)
            .slice(0, 4);

    if (!featuredItems.length) {
        renderEmptyState(container, {
            title: "No Featured Items",
            message:
                "Featured menu items will appear here.",
            icon: "fa-star"
        });

        return;
    }

    container.innerHTML =
        featuredItems
            .map(createSpecialityCard)
            .join("");
}


function createSpecialityCard(item) {
    const id = Number(item.id);

    const name =
        escapeHTML(item.name);

    const description =
        escapeHTML(item.description);

    const badge =
        escapeHTML(
            item.badge || "Popular"
        );

    const image =
        escapeHTML(
            item.image ||
            MENU_IMAGE_FALLBACK
        );

    const price =
        formatINR(item.price);

    const rating =
        getMenuRating(item.rating);

    const isWishlisted =
        wishlistMap.has(id);

    return `
        <article class="group bg-[#171412] border border-[#D4AF37]/30 rounded-[30px] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-[0_20px_50px_rgba(212,175,55,.20)] flex flex-col">

            <div class="relative overflow-hidden">

                <img
                    src="${image}"
                    alt="${name}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${MENU_IMAGE_FALLBACK}';"
                    class="w-full h-64 object-cover transition duration-700 group-hover:scale-110"
                >

                <span class="absolute top-5 left-5 bg-[#D4AF37] text-black text-sm font-semibold px-4 py-2 rounded-full">
                    ${badge}
                </span>

                ${createWishlistButton(
                    id,
                    isWishlisted
                )}

            </div>

            <div class="flex flex-col flex-1 p-7">

                <h3 class="font-['Cinzel'] text-[30px] leading-[1.15] text-white transition-colors duration-300 group-hover:text-[#D4AF37] min-h-[72px]">
                    ${name}
                </h3>

                <p class="text-gray-400 text-[17px] leading-8 mt-4 min-h-[78px]">
                    ${description}
                </p>

                <div class="flex items-center gap-2 mt-4">
                    <span class="text-[#D4AF37] text-lg">
                        ★★★★★
                    </span>

                    <span class="text-gray-400 text-lg">
                        (${rating})
                    </span>
                </div>

                <div class="border-t border-[#D4AF37]/20 mt-6 pt-6 flex items-center justify-between gap-6">

                    <span class="text-[#D4AF37] text-[20px] font-bold whitespace-nowrap">
                        ${price}
                    </span>

                    ${createCartButton(item)}

                </div>

            </div>

        </article>
    `;
}


/*
DISPLAY MENU
*/

function displayMenu(items) {
    if (!menuContainer) return;

    const safeItems =
        safeArray(items);

    if (!safeItems.length) {
        renderEmptyState(menuContainer, {
            title: "No Menu Items Found",
            message:
                "Try another category or search term.",
            icon: "fa-utensils"
        });

        updateMenuToggleButton(0);
        resetMenuWrapperHeight();

        menuFade?.classList.add("hidden");

        return;
    }

    menuContainer.innerHTML =
        safeItems
            .map(createMenuCard)
            .join("");

    requestAnimationFrame(() => {
        updateMenuDisplay(safeItems);
    });
}


/*
MENU CARD
*/

function createMenuCard(item) {
    const id = Number(item.id);

    const safeName =
        escapeHTML(item.name);

    const safeDescription =
        escapeHTML(item.description);

    const safeBadge =
        escapeHTML(
            item.badge || "Popular"
        );

    const safeImage =
        escapeHTML(
            item.image ||
            MENU_IMAGE_FALLBACK
        );

    const badgeClass =
        getBadgeColorClass(
            item.badge_color
        );

    const price =
        formatINR(item.price);

    const rating =
        getMenuRating(item.rating);

    const stock =
        Number(item.stock || 0);

    const isWishlisted =
        wishlistMap.has(id);

    return `
        <article class="group bg-[#171412] border border-[#D4AF37]/30 rounded-[30px] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-[0_20px_50px_rgba(212,175,55,.20)] flex flex-col">

            <div class="relative overflow-hidden">

                <img
                    src="${safeImage}"
                    alt="${safeName}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${MENU_IMAGE_FALLBACK}';"
                    class="w-full h-72 object-cover transition duration-700 group-hover:scale-110"
                >

                <span class="absolute top-5 left-5 ${badgeClass} text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                    ${safeBadge}
                </span>

                ${createWishlistButton(
                    id,
                    isWishlisted
                )}

            </div>

            <div class="flex flex-col flex-1 p-7">

                <h3
                    class="text-[36px] font-semibold leading-[1.1] tracking-normal text-white group-hover:text-[#D4AF37] transition-all duration-300 min-h-[72px]"
                    style="font-family:'Cormorant Garamond', serif;"
                >
                    ${safeName}
                </h3>

                <p class="text-gray-400 mt-1 leading-5 min-h-[56px]">
                    ${safeDescription}
                </p>

                <div class="flex items-center justify-between gap-1 mt-1">

                    <div class="flex items-center gap-2">

                        <span class="text-[#D4AF37] text-lg">
                            ★★★★★
                        </span>

                        <span class="text-gray-400 text-lg">
                            (${rating})
                        </span>

                    </div>

                    ${
                        stock <= 0
                            ? `
                                <span class="text-xs font-semibold text-red-400">
                                    Out of Stock
                                </span>
                            `
                            : ""
                    }

                </div>

                <div class="border-t border-[#D4AF37]/20 mt-6 pt-6 flex items-center justify-between gap-6">

                    <span class="text-[#D4AF37] text-[20px] font-bold whitespace-nowrap">
                        ${price}
                    </span>

                    ${createCartButton(item)}

                </div>

            </div>

        </article>
    `;
}


/*
WISHLIST BUTTON
*/

function createWishlistButton(
    itemId,
    isWishlisted
) {
    return `
        <button
            type="button"
            onclick="toggleWishlistItem(${JSON.stringify(itemId)})"
            aria-label="${
                isWishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
            }"
            class="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-black/75 backdrop-blur-md border border-[#D4AF37]/30 flex items-center justify-center transition-all duration-300 hover:border-[#D4AF37] hover:scale-110"
        >
            <i class="${
                isWishlisted
                    ? "fa-solid text-red-500"
                    : "fa-regular text-white"
            } fa-heart text-xl"></i>
        </button>
    `;
}


/*
CART BUTTON
*/

function createCartButton(item) {
    const id =
        Number(item.id);

    const stock =
        Number(item.stock || 0);

    if (stock <= 0) {
        return `
            <button
                type="button"
                disabled
                class="bg-gray-700 text-gray-400 w-[160px] h-[58px] rounded-full font-semibold cursor-not-allowed"
            >
                Out of Stock
            </button>
        `;
    }

    return `
        <button
            type="button"
            onclick="addToCart(${JSON.stringify(id)})"
            class="bg-[#D4AF37] text-black w-[160px] h-[58px] rounded-full font-semibold text-base transition-all duration-300 hover:bg-[#E7C456] hover:scale-105"
        >
            Add to Cart
        </button>
    `;
}


/*
FILTER MENU
*/

function applyMenuFilters() {
    let filteredItems =
        [...menuItems];

    if (
        activeCategory !== "all"
    ) {
        filteredItems =
            filteredItems.filter(
                item =>
                    String(
                        item.category
                    ).toLowerCase() ===
                    activeCategory
            );
    }

    if (currentSearchValue) {
        filteredItems =
            filteredItems.filter(
                item => {
                    const name =
                        String(
                            item.name || ""
                        ).toLowerCase();

                    const description =
                        String(
                            item.description || ""
                        ).toLowerCase();

                    const category =
                        String(
                            item.category || ""
                        ).toLowerCase();

                    return (
                        name.includes(
                            currentSearchValue
                        ) ||
                        description.includes(
                            currentSearchValue
                        ) ||
                        category.includes(
                            currentSearchValue
                        )
                    );
                }
            );
    }

    displayMenu(filteredItems);
}


/*
COLLAPSED MENU
*/

function isMenuFiltering() {
    return (
        activeCategory !== "all" ||
        currentSearchValue.length > 0
    );
}


function resetMenuWrapperHeight() {
    if (!menuWrapper) return;

    menuWrapper.style.maxHeight =
        "none";
}


function getCollapsedMenuHeight() {
    if (!menuContainer) {
        return null;
    }

    const cards =
        menuContainer.querySelectorAll(
            ":scope > article"
        );

    const nextCard =
        cards[
            DEFAULT_VISIBLE_ITEMS
        ];

    if (!nextCard) {
        return null;
    }

    return (
        nextCard.offsetTop +
        NEXT_ROW_PEEK
    );
}


function updateMenuDisplay(items) {
    if (!menuWrapper) return;

    const totalItems =
        safeArray(items).length;

    if (isMenuFiltering()) {
        resetMenuWrapperHeight();

        menuFade?.classList.add(
            "hidden"
        );

        updateMenuToggleButton(
            totalItems,
            true
        );

        return;
    }

    if (
        totalItems <=
        DEFAULT_VISIBLE_ITEMS
    ) {
        resetMenuWrapperHeight();

        menuFade?.classList.add(
            "hidden"
        );

        updateMenuToggleButton(
            totalItems
        );

        return;
    }

    if (isFullMenuVisible) {
        menuWrapper.style.maxHeight =
            `${menuContainer.scrollHeight}px`;

        menuFade?.classList.add(
            "hidden"
        );

    } else {
        const collapsedHeight =
            getCollapsedMenuHeight();

        if (collapsedHeight) {
            menuWrapper.style.maxHeight =
                `${collapsedHeight}px`;
        }

        menuFade?.classList.remove(
            "hidden"
        );
    }

    updateMenuToggleButton(
        totalItems
    );
}


function updateMenuToggleButton(
    totalItems,
    hideForFilter = false
) {
    if (
        !menuToggleButton ||
        !menuToggleText ||
        !menuToggleIcon
    ) {
        return;
    }

    if (
        totalItems <=
            DEFAULT_VISIBLE_ITEMS ||
        hideForFilter
    ) {
        menuToggleButton
            .classList
            .add("hidden");

        return;
    }

    menuToggleButton
        .classList
        .remove("hidden");

    if (isFullMenuVisible) {
        menuToggleText.textContent =
            "Show Less";

        menuToggleIcon
            .classList
            .remove("fa-arrow-right");

        menuToggleIcon
            .classList
            .add("fa-arrow-up");

    } else {
        menuToggleText.textContent =
            "View Full Menu";

        menuToggleIcon
            .classList
            .remove("fa-arrow-up");

        menuToggleIcon
            .classList
            .add("fa-arrow-right");
    }
}


function toggleFullMenu() {
    isFullMenuVisible =
        !isFullMenuVisible;

    applyMenuFilters();

    if (!isFullMenuVisible) {
        getElement("menu")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }
}



/*
ACTIVE CATEGORY
*/

function setActiveButton(
    activeButton
) {
    menuButtons.forEach(
        button => {
            button.classList.remove(
                "bg-[#D4AF37]",
                "text-black"
            );

            button.classList.add(
                "border",
                "border-[#D4AF37]",
                "text-[#D4AF37]"
            );
        }
    );

    if (!activeButton) return;

    activeButton.classList.remove(
        "border",
        "border-[#D4AF37]",
        "text-[#D4AF37]"
    );

    activeButton.classList.add(
        "bg-[#D4AF37]",
        "text-black"
    );
}


function handleCategoryChange(
    category,
    button
) {
    activeCategory = category;

    isFullMenuVisible =
        category !== "all";

    setActiveButton(button);
    applyMenuFilters();
}


/*
CATEGORY EVENTS
*/

allButton?.addEventListener(
    "click",
    event =>
        handleCategoryChange(
            "all",
            event.currentTarget
        )
);

chaiButton?.addEventListener(
    "click",
    event =>
        handleCategoryChange(
            "chai",
            event.currentTarget
        )
);

coffeeButton?.addEventListener(
    "click",
    event =>
        handleCategoryChange(
            "coffee",
            event.currentTarget
        )
);

snacksButton?.addEventListener(
    "click",
    event =>
        handleCategoryChange(
            "snacks",
            event.currentTarget
        )
);

dessertsButton?.addEventListener(
    "click",
    event =>
        handleCategoryChange(
            "desserts",
            event.currentTarget
        )
);


/*
SEARCH
*/

if (searchInput) {
    const handleMenuSearch =
        debounce(
            event => {
                currentSearchValue =
                    String(
                        event.target
                            .value || ""
                    )
                        .trim()
                        .toLowerCase();

                isFullMenuVisible =
                    currentSearchValue
                        .length > 0;

                applyMenuFilters();
            },
            150
        );

    searchInput.addEventListener(
        "input",
        handleMenuSearch
    );
}


/*
BADGE / RATING HELPERS
*/

function getBadgeColorClass(color) {
    const colorClasses = {
        yellow: "bg-yellow-500",
        green: "bg-green-500",
        blue: "bg-blue-500",
        purple: "bg-purple-600",
        orange: "bg-orange-500",
        red: "bg-red-500"
    };

    return (
        colorClasses[
            String(
                color || ""
            ).toLowerCase()
        ] ||
        "bg-yellow-500"
    );
}


function getMenuRating(value) {
    const rating =
        Number(value);

    return Number.isFinite(rating)
        ? rating.toFixed(1)
        : "0.0";
}


/*
WISHLIST LOAD
*/

async function loadUserWishlist() {
    const accessToken =
        localStorage.getItem(
            "accessToken"
        );

    wishlistItems = [];
    wishlistMap.clear();

    if (!accessToken) {
        updateWishlistCount();
        return;
    }

    try {
        const response =
            await getWishlist();

        wishlistItems =
            safeArray(response);

        wishlistItems.forEach(
            entry => {
                const menuItemId =
                    Number(
                        entry
                            .menu_item
                            ?.id
                    );

                if (!menuItemId) {
                    return;
                }

                wishlistMap.set(
                    menuItemId,
                    entry
                );
            }
        );

    } catch (error) {
        console.error(
            "Wishlist loading failed:",
            error
        );
    }

    updateWishlistCount();
}


/*
WISHLIST TOGGLE
*/

async function toggleWishlistItem(
    menuItemId
) {
    const accessToken =
        localStorage.getItem(
            "accessToken"
        );

    if (!accessToken) {
        localStorage.setItem(
            "loginRedirect",
            "index.html#menu"
        );

        window.location.href =
            "login.html?next=index.html";

        return;
    }

    const numericMenuItemId =
        Number(menuItemId);

    if (
        !Number.isFinite(
            numericMenuItemId
        )
    ) {
        showError(
            "Invalid menu item."
        );

        return;
    }

    const existingEntry =
        wishlistMap.get(
            numericMenuItemId
        );

    try {
        if (existingEntry) {
            await removeWishlistItem(
                existingEntry.id
            );

            wishlistMap.delete(
                numericMenuItemId
            );

            wishlistItems =
                wishlistItems.filter(
                    entry =>
                        entry.id !==
                        existingEntry.id
                );

            showSuccess(
                "Removed from wishlist."
            );

        } else {
            const createdEntry =
                await addToWishlist(
                    numericMenuItemId
                );

            wishlistMap.set(
                numericMenuItemId,
                createdEntry
            );

            wishlistItems.unshift(
                createdEntry
            );

            showSuccess(
                "Added to wishlist."
            );
        }

        updateWishlistCount();

        applyMenuFilters();
        renderSpecialities();

    } catch (error) {
        console.error(
            "Wishlist update failed:",
            error
        );

        if (
            error.status === 401
        ) {
            window.location.href =
                "login.html?next=index.html";

            return;
        }

        showError(
            error.message ||
            "Unable to update wishlist."
        );
    }
}


/*
WISHLIST COUNT
*/

function updateWishlistCount() {
    const count =
        wishlistMap.size;

    getElements(
        "[data-wishlist-count]"
    ).forEach(
        element => {
            element.textContent =
                String(count);

            element.classList.toggle(
                "hidden",
                count === 0
            );
        }
    );
}


/*
VIEW FULL MENU
*/

menuToggleButton
    ?.addEventListener(
        "click",
        toggleFullMenu
    );


/*
RESPONSIVE MENU
*/

const handleMenuResize =
    debounce(
        applyMenuFilters,
        150
    );

window.addEventListener(
    "resize",
    handleMenuResize
);


/*
SEARCH AUTOFILL FIX
*/

function clearMenuSearchInput() {
    if (!searchInput) return;

    searchInput.value = "";
    currentSearchValue = "";
}


window.addEventListener(
    "load",
    () => {
        clearMenuSearchInput();

        requestAnimationFrame(
            clearMenuSearchInput
        );

        setTimeout(
            clearMenuSearchInput,
            300
        );
    }
);


window.addEventListener(
    "pageshow",
    clearMenuSearchInput
);


loadMenu();