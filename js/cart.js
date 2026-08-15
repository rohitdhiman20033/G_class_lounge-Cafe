/*
CART MODULE
*/

const CART_STORAGE_KEY = "cart";
const CART_IMAGE_FALLBACK = "images/logo chai.jpeg";

let cart = loadStoredCart();

const cartCounter = getElement("cart-count");
const cartItems = getElement("cart-items");
const cartTotal = getElement("cart-total");
const cartSidebar = getElement("cart-sidebar");
const closeCartButton = getElement("close-cart");

const cartButton =
    getElement("cart-button") ||
    document.querySelector(".fa-cart-shopping")
        ?.parentElement;


/*
STORAGE
*/

function loadStoredCart() {
    try {
        const stored =
            JSON.parse(
                localStorage.getItem(
                    CART_STORAGE_KEY
                )
            );

        return safeArray(stored);

    } catch (error) {
        console.error(
            "Invalid cart data:",
            error
        );

        localStorage.removeItem(
            CART_STORAGE_KEY
        );

        return [];
    }
}


function saveCart() {
    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}


/*
SIDEBAR
*/

function openCart() {
    if (!cartSidebar) return;

    cartSidebar.style.right = "0";
}


function closeCartSidebar() {
    if (!cartSidebar) return;

    cartSidebar.style.right = "-420px";
}


cartButton?.addEventListener(
    "click",
    openCart
);

closeCartButton?.addEventListener(
    "click",
    closeCartSidebar
);


/*
ADD MENU ITEM
*/

function addToCart(id) {
    if (
        typeof menuItems === "undefined" ||
        !Array.isArray(menuItems)
    ) {
        showError(
            "Menu is still loading."
        );

        return;
    }

    const selectedItem =
        menuItems.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!selectedItem) {
        showError("Item not found.");
        return;
    }

    const stock =
        Number(
            selectedItem.stock || 0
        );

    if (
        selectedItem.available === false ||
        stock <= 0
    ) {
        showError(
            "This item is currently unavailable."
        );

        return;
    }

    addCartItem({
        id: selectedItem.id,
        name: selectedItem.name,
        price: Number(
            selectedItem.price || 0
        ),
        image:
            selectedItem.image || "",
        stock
    });
}


/*
ADD SPECIALITY ITEM
*/

function addSpecialityToCart(
    id,
    name,
    price,
    image,
    stock = 100
) {
    addCartItem({
        id,
        name,
        price: Number(price || 0),
        image: image || "",
        stock: Number(stock || 100)
    });
}


/*
COMMON ADD LOGIC
*/

function addCartItem(item) {
    const existingItem =
        findCartItem(item.id);

    const stock =
        Math.max(
            0,
            Number(item.stock || 0)
        );

    if (stock <= 0) {
        showError(
            "This item is currently unavailable."
        );

        return;
    }

    if (existingItem) {
        if (
            Number(existingItem.quantity) >=
            stock
        ) {
            showError(
                `Only ${stock} item(s) available.`
            );

            return;
        }

        existingItem.quantity =
            Number(existingItem.quantity) + 1;

        existingItem.stock = stock;

    } else {
        cart.push({
            id: item.id,
            name:
                item.name ||
                "Unnamed Item",
            price:
                Number(item.price || 0),
            image:
                item.image || "",
            quantity: 1,
            stock
        });
    }

    updateCart();

    showSuccess(
        `${item.name} added to cart.`
    );
}


/*
UPDATE CART
*/

function updateCart() {
    cart = cart.filter(
        item =>
            item &&
            item.id !== undefined &&
            item.name &&
            Number(item.quantity) > 0
    );

    saveCart();

    const totalQuantity =
        cart.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );

    const totalPrice =
        cart.reduce(
            (total, item) =>
                total +
                Number(item.price || 0) *
                Number(item.quantity || 0),
            0
        );

    if (cartCounter) {
        cartCounter.textContent =
            String(totalQuantity);

        cartCounter.classList.toggle(
            "hidden",
            totalQuantity === 0
        );
    }

    if (cartTotal) {
        cartTotal.textContent =
            formatINR(totalPrice);
    }

    renderCartItems();
}


/*
RENDER CART
*/

function renderCartItems() {
    if (!cartItems) return;

    if (!cart.length) {
        renderEmptyCart();
        return;
    }

    cartItems.innerHTML =
        cart
            .map(createCartItemHTML)
            .join("");
}


function createCartItemHTML(
    item,
    index
) {
    const id =
        escapeHTML(
            String(item.id)
        );

    const name =
        escapeHTML(
            item.name
        );

    const image =
        escapeHTML(
            item.image ||
            CART_IMAGE_FALLBACK
        );

    const quantity =
        Number(
            item.quantity || 1
        );

    const price =
        Number(
            item.price || 0
        );

    const subtotal =
        price * quantity;

    return `
        <article
            class="flex gap-4 bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(212,175,55,0.25)] transition-all duration-300"
        >
            <img
                src="${image}"
                alt="${name}"
                loading="lazy"
                onerror="this.onerror=null; this.src='${CART_IMAGE_FALLBACK}';"
                class="w-20 h-20 object-cover rounded-xl"
            >

            <div class="flex-1">

                <h4 class="text-white font-semibold text-lg">
                    ${name}
                </h4>

                <p class="text-[#D4AF37] mt-1">
                    ${formatINR(price)} × ${quantity}
                </p>

                <p class="text-white font-bold mt-1">
                    ${formatINR(subtotal)}
                </p>

                <div class="flex items-center gap-3 mt-3">

                    <button
                        type="button"
                        data-cart-action="decrease"
                        data-cart-id="${id}"
                        class="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-bold hover:scale-110 hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-300"
                        aria-label="Decrease ${name} quantity"
                    >
                        −
                    </button>

                    <span class="text-white font-semibold min-w-5 text-center">
                        ${quantity}
                    </span>

                    <button
                        type="button"
                        data-cart-action="increase"
                        data-cart-id="${id}"
                        class="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-bold hover:scale-110 hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-300"
                        aria-label="Increase ${name} quantity"
                    >
                        +
                    </button>

                </div>

            </div>

            <button
                type="button"
                data-cart-action="remove"
                data-cart-index="${index}"
                aria-label="Remove ${name} from cart"
                class="text-red-500 hover:text-red-400 text-xl self-start"
            >
                <i class="fa-solid fa-trash"></i>
            </button>

        </article>
    `;
}


function renderEmptyCart() {
    cartItems.innerHTML = `
        <div class="h-full flex flex-col justify-center items-center text-center py-16">

            <div class="text-7xl mb-5">
                🛒
            </div>

            <h3 class="text-2xl font-bold text-[#D4AF37]">
                Your Cart is Empty
            </h3>

            <p class="text-gray-400 mt-3 leading-7">
                Looks like you haven't added<br>
                anything yet.
            </p>

            <button
                type="button"
                data-cart-action="browse"
                class="mt-8 bg-[#D4AF37] text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition"
            >
                Browse Menu
            </button>

        </div>
    `;
}


/*
CART ACTIONS
*/

function findCartItem(id) {
    return cart.find(
        item =>
            String(item.id) ===
            String(id)
    );
}


function increaseQuantity(id) {
    const item =
        findCartItem(id);

    if (!item) return;

    const stock =
        Number(
            item.stock || 0
        );

    if (
        Number(item.quantity) >=
        stock
    ) {
        showError(
            `Only ${stock} item(s) available.`
        );

        return;
    }

    item.quantity =
        Number(item.quantity) + 1;

    updateCart();
}


function decreaseQuantity(id) {
    const item =
        findCartItem(id);

    if (!item) return;

    if (
        Number(item.quantity) > 1
    ) {
        item.quantity =
            Number(item.quantity) - 1;

    } else {
        cart = cart.filter(
            cartItem =>
                String(cartItem.id) !==
                String(id)
        );
    }

    updateCart();
}


function removeItem(index) {
    const removedItem =
        cart[index];

    if (!removedItem) return;

    cart.splice(
        index,
        1
    );

    updateCart();

    showSuccess(
        `${removedItem.name} removed from cart.`
    );
}


/*
EVENT DELEGATION
*/

cartItems?.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest(
                "[data-cart-action]"
            );

        if (!button) return;

        const action =
            button.dataset.cartAction;

        const id =
            button.dataset.cartId;

        if (action === "increase") {
            increaseQuantity(id);
        }

        if (action === "decrease") {
            decreaseQuantity(id);
        }

        if (action === "remove") {
            removeItem(
                Number(
                    button.dataset
                        .cartIndex
                )
            );
        }

        if (action === "browse") {
            browseMenu();
        }
    }
);


/*
BROWSE MENU
*/

function browseMenu() {
    closeCartSidebar();

    const menuSection =
        getElement("menu");

    if (menuSection) {
        menuSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;
    }

    window.location.href =
        "index.html#menu";
}


updateCart();