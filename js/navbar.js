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


// AUTHENTICATION NAVBAR


function initializeAuthNavbar() {
    const accessToken = localStorage.getItem("accessToken");

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );
    } catch (error) {
        localStorage.removeItem("currentUser");
    }

    const desktopGuestAuth =
        document.getElementById("desktop-guest-auth");

    const desktopUserAuth =
        document.getElementById("desktop-user-auth");

    const mobileGuestAuth =
        document.getElementById("mobile-guest-auth");

    const mobileUserAuth =
        document.getElementById("mobile-user-auth");

    const navbarUsername =
        document.getElementById("navbar-username");

    const mobileNavbarUsername =
        document.getElementById("mobile-navbar-username");

    const desktopAdminLink =
        document.getElementById("desktop-admin-link");

    const mobileAdminLink =
        document.getElementById("mobile-admin-link");

    const isLoggedIn = Boolean(accessToken && currentUser);

    if (isLoggedIn) {
        // Guest buttons hide
        desktopGuestAuth?.classList.add("hidden");
        desktopGuestAuth?.classList.remove("md:flex");

        mobileGuestAuth?.classList.add("hidden");

        // User dropdown show
        desktopUserAuth?.classList.remove("hidden");
        desktopUserAuth?.classList.add("md:block");

        mobileUserAuth?.classList.remove("hidden");

        const displayName =
            currentUser.full_name ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "User";

        if (navbarUsername) {
            navbarUsername.textContent = displayName;
        }

        if (mobileNavbarUsername) {
            mobileNavbarUsername.textContent = displayName;
        }

        const isAdmin =
            currentUser.is_admin === true ||
            currentUser.is_staff === true ||
            currentUser.is_superuser === true;

        if (isAdmin) {
            desktopAdminLink?.classList.remove("hidden");
            desktopAdminLink?.classList.add("block");

            mobileAdminLink?.classList.remove("hidden");
            mobileAdminLink?.classList.add("block");
        }

    } else {
        // Guest buttons show
        desktopGuestAuth?.classList.remove("hidden");
        desktopGuestAuth?.classList.add("md:flex");

        mobileGuestAuth?.classList.remove("hidden");

        // User dropdown hide
        desktopUserAuth?.classList.add("hidden");
        desktopUserAuth?.classList.remove("md:block");

        mobileUserAuth?.classList.add("hidden");
    }
}

function logoutUser() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("desktop-logout-button")
        ?.addEventListener("click", logoutUser);

    document
        .getElementById("mobile-logout-button")
        ?.addEventListener("click", logoutUser);
});

document.addEventListener("DOMContentLoaded", initializeAuthNavbar);


// USER DROPDOWN


document.addEventListener("click", function (e) {

    const button = document.getElementById("user-menu-button");
    const dropdown = document.getElementById("user-dropdown");

    if (!button || !dropdown) return;

    if (button.contains(e.target)) {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
        return;
    }

    if (!dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
    }

});

document.getElementById("desktop-logout-button")
?.addEventListener("click", logoutUser);

document.getElementById("mobile-logout-button")
?.addEventListener("click", logoutUser);