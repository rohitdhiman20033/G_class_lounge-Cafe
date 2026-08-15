function scrollToBooking() {

    const bookingSection = document.getElementById("booking");

    if (bookingSection) {

        bookingSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}




// Scroll To Top Button


const scrollTopBtn = document.getElementById("scrollTopBtn");

if (scrollTopBtn) {

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

}



/*

GLOBAL UTILITY HELPERS

*/


function getElement(id) {
    return document.getElementById(id);
}


function getElements(selector) {
    return document.querySelectorAll(selector);
}


function setElementText(id, value, fallback = "") {
    const element = getElement(id);

    if (!element) {
        return false;
    }

    element.textContent =
        value === null ||
        value === undefined ||
        value === ""
            ? fallback
            : String(value);

    return true;
}


function setElementHTML(id, html, fallback = "") {
    const element = getElement(id);

    if (!element) {
        return false;
    }

    element.innerHTML =
        html === null ||
        html === undefined ||
        html === ""
            ? fallback
            : String(html);

    return true;
}


function setElementLink(
    id,
    url,
    {
        hideWhenEmpty = false,
        fallback = "#",
    } = {}
) {
    const element = getElement(id);

    if (!element) {
        return false;
    }

    const safeURL =
        typeof url === "string" &&
        url.trim()
            ? url.trim()
            : fallback;

    element.href = safeURL;

    if (hideWhenEmpty) {
        element.classList.toggle(
            "hidden",
            !url || !String(url).trim()
        );
    }

    return true;
}


function setElementImage(
    id,
    source,
    {
        fallback = "images/logo chai.jpeg",
        alt = "",
    } = {}
) {
    const image = getElement(id);

    if (!image) {
        return false;
    }

    image.onerror = function () {
        this.onerror = null;
        this.src = fallback;
    };

    image.src =
        source && String(source).trim()
            ? source
            : fallback;

    if (alt) {
        image.alt = alt;
    }

    return true;
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatINR(
    value,
    {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
    } = {}
) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "₹0.00";
    }

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits,
            maximumFractionDigits,
        }
    ).format(amount);
}


function formatDateTime(
    value,
    options = {
        dateStyle: "medium",
        timeStyle: "short",
    }
) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        "en-IN",
        options
    );
}


function normalizePhoneForLink(phone) {
    return String(phone ?? "")
        .replace(/[^\d+]/g, "");
}


function debounce(callback, delay = 300) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(
            () => {
                callback.apply(this, args);
            },
            delay
        );
    };
}


function safeArray(value) {
    return Array.isArray(value)
        ? value
        : [];
}


window.addEventListener("load", () => {

    const hash =
        window.location.hash;

    if (!hash) {
        return;
    }


    const target =
        document.querySelector(hash);

    if (!target) {
        return;
    }


    setTimeout(() => {

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 300);

});