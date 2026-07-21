const defaultMenuItems = [

    {
        id: 1,
        name: "Classic Masala Chai",
        category: "chai",
        price: 49,
        rating: 4.9,
        image: "images/masala chai menu.png",
        description: "Traditional Indian chai brewed with aromatic spices.",
        quantity: 1,
        badge: "Best Seller",
        color: "yellow"
    },

    {
        id: 2,
        name: "Ginger Chai",
        category: "chai",
        price: 59,
        rating: 4.8,
        image: "images/ginger menu.png",
        description: "Fresh ginger infused tea with a refreshing taste.",
        quantity: 1,
        badge: "Chef Special",
        color: "green"
    },

    {
        id: 3,
        name: "Elaichi Chai",
        category: "chai",
        price: 69,
        rating: 4.8,
        image: "images/elaichi chai.png",
        description: "Premium cardamom tea with rich aroma.",
        quantity: 1,
        badge: "New",
        color: "blue"
    },

    {
        id: 4,
        name: "Kesar Chai",
        category: "chai",
        price: 89,
        rating: 4.9,
        image: "images/kesar chai.png",
        description: "Luxury saffron tea crafted for royal taste.",
        quantity: 1,
        badge: "Premium",
        color: "purple"
    },

    {
        id: 5,
        name: "Kashmiri Kahwa",
        category: "chai",
        price: 119,
        rating: 5.0,
        image: "images/kashmiri chai.png",
        description: "Authentic Kashmiri herbal tea with dry fruits.",
        quantity: 1,
        badge: "Signature",
        color: "red"
    },

    {
        id: 6,
        name: "Cold Coffee",
        category: "coffee",
        price: 149,
        rating: 4.9,
        image: "images/cold menu.png",
        description: "Creamy chilled coffee topped with chocolate.",
        quantity: 1,
        badge: "Best Seller",
        color: "yellow"
    },

    {
        id: 7,
        name: "Cappuccino",
        category: "coffee",
        price: 169,
        rating: 4.8,
        image: "images/capichino.png",
        description: "Espresso finished with silky milk foam.",
        quantity: 1,
        badge: "Popular",
        color: "orange"
    },

    {
        id: 8,
        name: "Cafe Latte",
        category: "coffee",
        price: 179,
        rating: 4.8,
        image: "images/latte.png",
        description: "Smooth espresso blended with steamed milk.",
        quantity: 1,
        badge: "New",
        color: "blue"
    },

    {
        id: 9,
        name: "Mocha Coffee",
        category: "coffee",
        price: 199,
        rating: 4.9,
        image: "images/mocha.png",
        description: "Chocolate infused coffee with whipped cream.",
        quantity: 1,
        badge: "Chef Special",
        color: "green"
    },

    {
        id: 10,
        name: "Hazelnut Latte",
        category: "coffee",
        price: 219,
        rating: 5.0,
        image: "images/hazelnut.png",
        description: "Premium hazelnut latte with rich flavour.",
        quantity: 1,
        badge: "Premium",
        color: "purple"
    },

    {
        id: 11,
        name: "Veg Sandwich",
        category: "snacks",
        price: 129,
        rating: 4.7,
        image: "images/sandwich menu.png",
        description: "Grilled sandwich loaded with vegetables.",
        quantity: 1,
        badge: "Popular",
        color: "orange"
    },

    {
        id: 12,
        name: "French Fries",
        category: "snacks",
        price: 139,
        rating: 4.8,
        image: "images/french fries.png",
        description: "Golden crispy fries served with dip.",
        quantity: 1,
        badge: "Best Seller",
        color: "yellow"
    },

    {
        id: 13,
        name: "Cheese Garlic Bread",
        category: "snacks",
        price: 179,
        rating: 4.9,
        image: "images/garlic bread.png",
        description: "Toasted garlic bread topped with cheese.",
        quantity: 1,
        badge: "Chef Special",
        color: "green"
    },

    {
        id: 14,
        name: "Veg Burger",
        category: "snacks",
        price: 189,
        rating: 4.8,
        image: "images/burger.png",
        description: "Loaded burger with crispy veggie patty.",
        quantity: 1,
        badge: "Popular",
        color: "orange"
    },

    {
        id: 15,
        name: "Cheese Pizza",
        category: "snacks",
        price: 299,
        rating: 4.9,
        image: "images/pizza.png",
        description: "Stone baked pizza with extra cheese.",
        quantity: 1,
        badge: "Best Seller",
        color: "yellow"
    },

    {
        id: 16,
        name: "Chocolate Brownie",
        category: "desserts",
        price: 199,
        rating: 4.8,
        image: "images/brownie menu.png",
        description: "Warm brownie served with chocolate sauce.",
        quantity: 1,
        badge: "Premium",
        color: "purple"
    },

    {
        id: 17,
        name: "Red Velvet Cake",
        category: "desserts",
        price: 249,
        rating: 4.9,
        image: "images/red velvet.png",
        description: "Soft red velvet cake with cream cheese.",
        quantity: 1,
        badge: "New",
        color: "blue"
    },

    {
        id: 18,
        name: "Belgian Waffle",
        category: "desserts",
        price: 229,
        rating: 4.9,
        image: "images/waffle.png",
        description: "Fresh waffle served with chocolate syrup.",
        quantity: 1,
        badge: "Chef Special",
        color: "green"
    },

    {
        id: 19,
        name: "Vanilla Ice Cream",
        category: "desserts",
        price: 149,
        rating: 4.7,
        image: "images/icecream.png",
        description: "Creamy vanilla ice cream with toppings.",
        quantity: 1,
        badge: "Popular",
        color: "orange"
    },

    {
        id: 20,
        name: "Chocolate Pastry",
        category: "desserts",
        price: 169,
        rating: 4.8,
        image: "images/pastry.png",
        description: "Moist chocolate pastry with rich cream.",
        quantity: 1,
        badge: "Best Seller",
        color: "yellow"
    }

];

let menuItems = JSON.parse(localStorage.getItem("menuItems"));

if (!menuItems || menuItems.length === 0) {

    menuItems = [...defaultMenuItems];

    localStorage.setItem("menuItems", JSON.stringify(menuItems));

}

const menuContainer = document.getElementById("menu-container");

function displayMenu(items) {

    menuContainer.innerHTML = "";

    items.forEach((item) => {

        menuContainer.innerHTML += `

        <div class="group relative bg-[#171412] border border-[#D4AF37]/20 rounded-3xl overflow-hidden hover:border-[#D4AF37] hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(212,175,55,0.35)] transition-all duration-500">

        <div class="absolute top-4 left-4 z-20">

            <span class="
                px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg

                    ${item.color === "yellow" ? "bg-yellow-500" : ""}
                    ${item.color === "green" ? "bg-green-500" : ""}
                    ${item.color === "blue" ? "bg-blue-500" : ""}
                    ${item.color === "purple" ? "bg-purple-600" : ""}
                    ${item.color === "orange" ? "bg-orange-500" : ""}
                    ${item.color === "red" ? "bg-red-500" : ""}
                ">

                ${item.badge}

            </span>

        </div>

        <div class="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[#D4AF37] font-semibold text-sm">

            ⭐ ${item.rating}

        </div>

            <img src="${item.image}"
            class="w-full h-72 object-cover group-hover:scale-110 group-hover:brightness-90 transition-all duration-700">

            <div class="p-6">

                <h3 class="text-2xl text-white font-semibold group-hover:text-[#d4af37] transition-all duration-300">
                    ${item.name}
                </h3>

                <p class="text-gray-400 mt-2 leading-7">
                    ${item.description}
                </p>

                <div class="flex justify-between items-center mt-6">

                    <span class="text-[#D4AF37] text-2xl font-bold">
                        ₹${item.price}
                    </span>

                   <button
                      onclick="addToCart(${item.id})"
                      class="bg-[#D4AF37] text-black px-5 py-2 rounded-full font-semibold hover:scale-105 transition">

                      Add to Cart

                    </button>

                </div>

            </div>

        </div>

        `;

    });

}

const buttons = document.querySelectorAll(".menu-btn");

function setActiveButton(activeBtn) {

    buttons.forEach((btn) => {

        btn.classList.remove("bg-[#D4AF37]", "text-black");

        btn.classList.add("border", "border-[#D4AF37]", "text-[#D4AF37]");

    });

    activeBtn.classList.remove("border", "border-[#D4AF37]", "text-[#D4AF37]");

    activeBtn.classList.add("bg-[#D4AF37]", "text-black");

}

displayMenu(menuItems);

// ALL
document.getElementById("all-btn").addEventListener("click", (e) => {

    setActiveButton(e.target);

    displayMenu(menuItems);

});

// CHAI
document.getElementById("chai-btn").addEventListener("click", (e) => {

    setActiveButton(e.target);

    const chaiItems = menuItems.filter(item => item.category === "chai");

    displayMenu(chaiItems);

});
// COFFEE
document.getElementById("coffee-btn").addEventListener("click", (e) => {

    setActiveButton(e.target);

    const coffeeItems = menuItems.filter(item => item.category === "coffee");

    displayMenu(coffeeItems);

});
// SNACKS
document.getElementById("snacks-btn").addEventListener("click", (e) => {

    setActiveButton(e.target);

    const snackItems = menuItems.filter(item => item.category === "snacks");
    displayMenu(snackItems);
});

// DESSERTS
document.getElementById("desserts-btn").addEventListener("click", (e) => {

    setActiveButton(e.target);

    const dessertItems = menuItems.filter(item => item.category === "desserts");
    displayMenu(dessertItems);
});

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("keyup", () => {

    const searchValue = searchInput.value.toLowerCase();

    if (searchValue === "") {
        displayMenu(menuItems);
        return;
    }

    const filteredItems = menuItems.filter((item) => {

        return item.name.toLowerCase().includes(searchValue);

    });

    displayMenu(filteredItems);

});

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartCounter = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");

const cartTotal = document.getElementById("cart-total");

const cartIcon = document.querySelector(".fa-cart-shopping");
const cartSidebar = document.getElementById("cart-sidebar");
const closeCart = document.getElementById("close-cart");


cartIcon.addEventListener("click", () => {
    cartSidebar.style.right = "0";
});


closeCart.addEventListener("click", () => {
    cartSidebar.style.right = "-420px";
});






function addToCart(id) {

    const selectedItem = menuItems.find(item => item.id === id);

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            ...selectedItem,
            quantity: 1
        });

    }

    updateCart();
    showToast(`${selectedItem.name} added to cart`);

}

function addSpecialityToCart(id, name, price, image) {

    const existingItem = cart.find(item => item.id === id);


    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });

    }


    updateCart();

    showToast(`${name} added to cart`);

}

function updateCart() {

    localStorage.setItem("cart", JSON.stringify(cart));

    cartItems.innerHTML = "";

    if (cart.length === 0) {

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
        onclick="browseMenu()"
        class="mt-8 bg-[#D4AF37] text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition">

        Browse Menu

    </button>

</div>
`;
        cartCounter.innerText = 0;
        cartTotal.innerText = "₹0";



        return;
    }



    cartCounter.innerText = cart.reduce((total, item) => total + item.quantity, 0);

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    cartTotal.innerText = `₹${total}`;

    cart.forEach((item, index) => {

        cartItems.innerHTML += `
<div class="flex gap-4 bg-[#1a1a1a] rounded-2xl p-4 mb-4 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(212,175,55,0.25)] transition-all duration-300">

    <img
        src="${item.image}"
        class="w-20 h-20 object-cover rounded-xl">

    <div class="flex-1">

        <h4 class="text-white font-semibold text-lg">
            ${item.name}
        </h4>

        <p class="text-[#D4AF37] mt-1">
            ₹${item.price} × ${item.quantity}
        </p>

        <p class="text-white font-bold mt-1">
            ₹${item.price * item.quantity}
        </p>

        <div class="flex items-center gap-3 mt-3">

            <button
                onclick="decreaseQuantity(${item.id})"
                class="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-bold hover:scale-110 hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-300">
                -
            </button>

            <span class="text-white font-semibold">
                ${item.quantity}
            </span>

            <button
                onclick="increaseQuantity(${item.id})"
                class="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-bold hover:scale-110 hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-300">
                +
            </button>

        </div>

    </div>

    <button
        onclick="removeItem(${index})"
        class="text-red-500 hover:text-red-400 text-xl self-start">
        <i class="fa-solid fa-trash"></i>
    </button>

</div>
`;

    });
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

function increaseQuantity(id) {

    const item = cart.find(item => item.id === id);

    if (item) {
        item.quantity++;
    }

    updateCart();

}

function decreaseQuantity(id) {

    const item = cart.find(item => item.id === id);

    if (!item) return;

    if (item.quantity > 1) {

        item.quantity--;

    } else {

        cart = cart.filter(cartItem => cartItem.id !== id);

    }

    updateCart();

}

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach((section) => {

        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.offsetHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute("id");
        }

    });

    navLinks.forEach((link) => {

        link.classList.remove(
            "text-[#D4AF37]",
            "border-b-2",
            "border-[#D4AF37]",
            "pb-2"
        );

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add(
                "text-[#D4AF37]",
                "border-b-2",
                "border-[#D4AF37]",
                "pb-2"
            );

        }

    });

});

const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 80) {

        navbar.classList.add(
            "shadow-[0_8px_30px_rgba(0,0,0,0.6)]",
            "backdrop-blur-md",
            "bg-black/90"
        );

    } else {

        navbar.classList.remove(
            "shadow-[0_8px_30px_rgba(0,0,0,0.6)]",
            "backdrop-blur-md",
            "bg-black/90"
        );

    }

});

function clearCart() {
    cart = [];
    updateCart();
}

function openCheckout() {

    if (cart.length === 0) {

        showToast("Your cart is empty", "error");
        return;

    }

    document.getElementById("checkout-modal")
        .classList.remove("hidden");

}

function closeCheckout() {

    document.getElementById("checkout-modal")
        .classList.add("hidden");


    document.getElementById("customer-name").value = "";

    document.getElementById("customer-phone").value = "";

}

function placeOrder() {

    let name = document.getElementById("customer-name").value;
    let phone = document.getElementById("customer-phone").value;


    if (name.trim() === "" || phone.trim() === "") {

        alert("Please fill your details");
        return;

    }



    let total = 0;

    cart.forEach(item => {

        total += item.price * item.quantity;

    });



    let order = {

        id: Date.now(),

        customerName: name,

        phone: phone,

        items: cart,

        total: total,

        date: new Date().toLocaleDateString(),

        time: new Date().toLocaleTimeString(),

        status: "Pending"

    };



    let orders = JSON.parse(localStorage.getItem("orders")) || [];


    orders.push(order);


    localStorage.setItem("orders", JSON.stringify(orders));



    // clear cart

    cart = [];

    localStorage.setItem("cart", JSON.stringify(cart));


    updateCart();





    closeCheckout();

    document.getElementById("success-popup")
        .classList.remove("hidden");

    document.getElementById("success-popup")
        .classList.add("flex");





    document.getElementById("customer-name").value = "";

    document.getElementById("customer-phone").value = "";





    document.getElementById("success-popup")
        .classList.remove("hidden");

    document.getElementById("success-popup")
        .classList.add("flex");


}

function closePopup() {

    document.getElementById("success-popup").classList.remove("flex");
    document.getElementById("success-popup").classList.add("hidden");

    clearCart();

}

function closeBookingPopup() {

    document.getElementById("booking-popup").classList.remove("flex");
    document.getElementById("booking-popup").classList.add("hidden");

}

function browseMenu() {


    cartSidebar.style.right = "-420px";


    document.getElementById("menu").scrollIntoView({
        behavior: "smooth"
    });

}

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");

    toastMessage.innerText = message;

    if (type === "success") {

        toast.classList.remove("border-red-500");
        toast.classList.add("border-[#D4AF37]");

    } else {

        toast.classList.remove("border-[#D4AF37]");
        toast.classList.add("border-red-500");

    }

    toast.classList.remove("translate-y-32", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    setTimeout(() => {

        toast.classList.remove("translate-y-0", "opacity-100");
        toast.classList.add("translate-y-32", "opacity-0");

    }, 2500);

}

updateCart();

function scrollToBooking() {

    document.getElementById("booking").scrollIntoView({

        behavior: "smooth"

    });

}

// Minimum Date = Today

const today = new Date().toISOString().split("T")[0];
document.getElementById("date").setAttribute("min", today);


// Elements

const bookingForm = document.getElementById("booking-form");
const descriptionInput = document.getElementById("description");


// Booking Submit

bookingForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const guests = document.getElementById("guests").value;
    const description = descriptionInput.value.trim();

    // Validation

    if (!name || !phone || !date || !time || !guests) {

        showToast("Please fill all fields.", "error");
        return;

    }

    if (!/^[0-9]{10}$/.test(phone)) {

        showToast("Enter a valid 10-digit phone number.", "error");
        return;

    }


    // Booking Object

    const booking = {

        id: Date.now(),

        name,

        phone,

        date,

        time,

        guests,

        description,

        status: "Pending"

    };


    // Save Booking

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    bookings.push(booking);

    localStorage.setItem("bookings", JSON.stringify(bookings));


    // Success

    showToast("Table Reserved Successfully!");

    document.getElementById("booking-popup").classList.remove("hidden");
    document.getElementById("booking-popup").classList.add("flex");


    // Reset Form

    bookingForm.reset();

    descriptionInput.style.height = "auto";

});


// Auto Resize Textarea

descriptionInput.addEventListener("input", function () {

    this.style.height = "auto";

    this.style.height = this.scrollHeight + "px";

});



// REVIEWS 

let reviews = JSON.parse(localStorage.getItem("reviews")) || [
    {
        id: 1,
        name: "Rahul Sharma",
        rating: "★★★★★",
        message: "Amazing ambience and premium service. The lounge experience was outstanding.",
        date: "21 June 2026",
        time: "05:34 PM",
        demo: true
    },

    {
        id: 2,
        name: "Priya Verma",
        rating: "★★★★★",
        message: "Beautiful interiors, delicious food and a perfect place for celebrations.",
        date: "13 July 2026",
        time: "08:30 PM",
        demo: true
    },

    {
        id: 3,
        name: "Aman Kapoor",
        rating: "★★★★",
        message: "Loved the atmosphere and coffee quality. Will definitely visit again.",
        date: "05 April 2026",
        time: "01:30 PM",
        demo: true
    }

];





function addReview() {

    let name = document.getElementById("review-name").value;
    let rating = document.getElementById("review-rating").value;
    let message = document.getElementById("review-message").value;


    if (name === "" || message === "") {
        alert("Please fill all details");
        return;
    }


    let review = {
        id: Date.now(),
        name: name,
        rating: rating,
        message: message,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        demo: false
    };


    reviews.push(review);

    localStorage.setItem("reviews", JSON.stringify(reviews));


    displayReviews();

    let success = document.getElementById("review-success");

    success.classList.remove("hidden");


    setTimeout(() => {

        success.classList.add("hidden");

    }, 3000);


    document.getElementById("review-name").value = "";
    document.getElementById("review-message").value = "";

}



// Display Reviews

function displayReviews() {

    let container = document.getElementById("review-container");

    container.innerHTML = "";


    reviews.forEach(review => {


        container.innerHTML += `

<div class="group bg-[#171412] p-8 rounded-3xl border border-[#D4AF37]/20 
hover:border-[#D4AF37] hover:-translate-y-2 
hover:shadow-[0_15px_40px_rgba(212,175,55,0.25)] 
transition-all duration-500">


<div class="flex items-center gap-4">

<div class="w-14 h-14 rounded-full bg-[#D4AF37] 
flex items-center justify-center text-black text-2xl font-bold">
${review.name.charAt(0)}
</div>


<div>

<h3 class="text-xl text-white font-bold">
${review.name}
</h3>

<div class="text-[#D4AF37] mt-1">
${review.rating}
</div>

</div>

</div>


<p class="text-gray-400 mt-6 leading-7">
"${review.message}"
</p>

<div class="flex gap-5 text-gray-500 text-sm mt-5">

    <span>
        <i class="fa-regular fa-calendar text-[#D4AF37]"></i>
        ${review.date}
    </span>


    <span>
        <i class="fa-regular fa-clock text-[#D4AF37]"></i>
        ${review.time}
    </span>

</div>



${review.demo === false ? `

<button onclick="deleteReview(${review.id})"
class="mt-6 text-red-400 hover:text-red-600 transition">
Delete Review
</button>

` : ""}


</div>

`;

    });

}




// Delete Review

function deleteReview(id) {

    reviews = reviews.filter(review => review.id !== id);


    localStorage.setItem("reviews", JSON.stringify(reviews));


    displayReviews();

}



// Load Reviews


displayReviews();





function openAdmin() {

    document.getElementById("admin-login").classList.remove("hidden");

}

function closeAdmin() {

    document.getElementById("admin-login").classList.add("hidden");

}

function checkAdmin() {

    const password = document.getElementById("admin-password").value;

    if (password === "12345") {

        window.location.href = "admin.html";

    } else {

        alert("Wrong Password");

    }

}



const scrollTopBtn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", function () {

    if (window.pageYOffset > 100) {
        scrollTopBtn.style.display = "flex";
        scrollTopBtn.style.alignItems = "center";
        scrollTopBtn.style.justifyContent = "center";
    } else {
        scrollTopBtn.style.display = "none";
    }

});

scrollTopBtn.addEventListener("click", function () {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// MOBILE HAMBURGER MENU


const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

if (menuBtn && mobileMenu) {

    menuBtn.addEventListener("click", () => {

        const icon = menuBtn.querySelector("i");

        if (mobileMenu.classList.contains("hidden")) {

            mobileMenu.classList.remove("hidden");
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");

        } else {

            mobileMenu.classList.add("hidden");
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");

        }

    });

    document.querySelectorAll(".mobile-link").forEach(link => {

        link.addEventListener("click", () => {

            mobileMenu.classList.add("hidden");

            const icon = menuBtn.querySelector("i");

            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");

        });

    });

}

let logoClicks = 0;
let clickTimer;

document.getElementById("logo").addEventListener("click", function (e) {

    e.preventDefault();

    logoClicks++;

    clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
        logoClicks = 0;
    }, 1500);

    if (logoClicks === 5) {

        let password = prompt("Enter Admin Password");

        if (password === "12345") {

            window.location.href = "admin.html";

        } else {

            alert("Incorrect Password");

        }

        logoClicks = 0;
    }

});