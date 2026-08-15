let wishlistPageItems = [];

const wishlistLoading =
    document.getElementById("wishlist-loading");

const wishlistError =
    document.getElementById("wishlist-error");

const wishlistErrorMessage =
    document.getElementById("wishlist-error-message");

const wishlistEmpty =
    document.getElementById("wishlist-empty");

const wishlistGrid =
    document.getElementById("wishlist-grid");

const wishlistTotalCount =
    document.getElementById("wishlist-total-count");


function showWishlistSection(section) {
    wishlistLoading?.classList.add("hidden");
    wishlistError?.classList.add("hidden");
    wishlistEmpty?.classList.add("hidden");
    wishlistGrid?.classList.add("hidden");

    section?.classList.remove("hidden");
}


function updateWishlistPageCount() {
    if (wishlistTotalCount) {
        wishlistTotalCount.textContent =
            String(wishlistPageItems.length);
    }
}


function formatWishlistPrice(value) {
    const price = Number(value);

    if (!Number.isFinite(price)) {
        return "₹0.00";
    }

    return `₹${price.toFixed(2)}`;
}


function escapeWishlistHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function createWishlistCard(entry) {
    const item = entry.menu_item || {};

    const safeName =
        escapeWishlistHTML(
            item.name || "Unnamed Item"
        );

    const safeDescription =
        escapeWishlistHTML(
            item.description ||
            "No description available."
        );

    const safeImage =
        escapeWishlistHTML(
            item.image ||
            "images/logo chai.jpeg"
        );

    const price =
        formatWishlistPrice(item.price);

    const stock =
        Number(item.stock || 0);

    const cartButton =
        stock > 0
            ? `
                <button
                    type="button"
                    onclick="moveWishlistItemToCart(${JSON.stringify(item.id)})"
                    class="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-semibold hover:bg-[#bd992e] transition"
                >
                    <i class="fa-solid fa-cart-plus mr-2"></i>
                    Add to Cart
                </button>
            `
            : `
                <button
                    type="button"
                    disabled
                    class="flex-1 bg-gray-700 text-gray-400 py-3 rounded-xl cursor-not-allowed"
                >
                    Out of Stock
                </button>
            `;

    return `
        <article
            id="wishlist-item-${entry.id}"
            class="group bg-[#171412] border border-[#D4AF37]/20 rounded-3xl overflow-hidden hover:border-[#D4AF37] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(212,175,55,0.25)] transition-all duration-500"
        >

            <div class="relative overflow-hidden">

                <img
                    src="${safeImage}"
                    alt="${safeName}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='images/logo chai.jpeg';"
                    class="w-full h-64 object-cover group-hover:scale-110 transition-all duration-700"
                >

                <button
                    type="button"
                    onclick="removeWishlistPageItem(${entry.id})"
                    aria-label="Remove from wishlist"
                    class="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/75 backdrop-blur-md border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 transition"
                >
                    <i class="fa-solid fa-heart"></i>
                </button>

            </div>

            <div class="p-6">

                <h3
                    class="brand-font text-2xl font-bold group-hover:text-[#D4AF37] transition"
                >
                    ${safeName}
                </h3>

                <p
                    class="text-gray-400 mt-3 leading-7 min-h-[56px]"
                >
                    ${safeDescription}
                </p>

                <div
                    class="flex items-center justify-between mt-6"
                >
                    <div>
                        <p
                            class="text-2xl font-bold text-[#D4AF37]"
                        >
                            ${price}
                        </p>

                        <p
                            class="text-xs mt-1 ${
                                stock > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                            }"
                        >
                            ${
                                stock > 0
                                    ? `${stock} available`
                                    : "Currently unavailable"
                            }
                        </p>
                    </div>
                </div>

                <div class="flex gap-3 mt-6">

                    ${cartButton}

                    <button
                        type="button"
                        onclick="removeWishlistPageItem(${entry.id})"
                        class="w-12 h-12 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition"
                        aria-label="Remove item"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </div>

        </article>
    `;
}


function renderWishlistPage() {
    updateWishlistPageCount();

    if (!wishlistPageItems.length) {
        showWishlistSection(wishlistEmpty);
        return;
    }

    if (!wishlistGrid) {
        return;
    }

    wishlistGrid.innerHTML =
        wishlistPageItems
            .map(createWishlistCard)
            .join("");

    showWishlistSection(wishlistGrid);
}


async function loadWishlistPage() {
    const accessToken =
        localStorage.getItem("accessToken");

    if (!accessToken) {
        localStorage.setItem(
            "loginRedirect",
            "wishlist.html"
        );

        window.location.href =
            "login.html?next=wishlist.html";

        return;
    }

    showWishlistSection(wishlistLoading);

    try {
        const response =
            await getWishlist();

        wishlistPageItems =
            Array.isArray(response)
                ? response
                : [];

        renderWishlistPage();

    } catch (error) {
        console.error(
            "Wishlist loading failed:",
            error
        );

        if (error.status === 401) {
            window.location.href =
                "login.html?next=wishlist.html";

            return;
        }

        if (wishlistErrorMessage) {
            wishlistErrorMessage.textContent =
                error.message ||
                "Unable to load wishlist.";
        }

        showWishlistSection(wishlistError);
    }
}


async function removeWishlistPageItem(
    wishlistId
) {
    try {
        await removeWishlistItem(
            wishlistId
        );

        wishlistPageItems =
            wishlistPageItems.filter(
                entry =>
                    Number(entry.id) !==
                    Number(wishlistId)
            );

        renderWishlistPage();

    } catch (error) {
        console.error(
            "Wishlist remove failed:",
            error
        );

        alert(
            error.message ||
            "Unable to remove item."
        );
    }
}


function moveWishlistItemToCart(
    menuItemId
) {
    const entry =
        wishlistPageItems.find(
            item =>
                Number(item.menu_item?.id) ===
                Number(menuItemId)
        );

    if (!entry?.menu_item) {
        return;
    }

    if (typeof addToCart !== "function") {
        alert(
            "Cart system is not available on this page."
        );

        return;
    }

    addToCart(
        entry.menu_item.id
    );
}


document
    .getElementById(
        "wishlist-retry-button"
    )
    ?.addEventListener(
        "click",
        loadWishlistPage
    );


document.addEventListener(
    "DOMContentLoaded",
    loadWishlistPage
);