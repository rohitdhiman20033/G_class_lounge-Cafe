async function loadWebsiteSettings() {
    try {
        const settings =
            await getWebsiteSettings();

        console.log(
            "Website Settings:",
            settings
        );

        renderWebsiteSettings(settings);

    } catch (error) {
        console.error(
            "Website settings failed:",
            error
        );
    }
}


function renderWebsiteSettings(settings) {
    if (!settings) {
        return;
    }

    setElementText(
        "footer-site-name",
        settings.site_name,
        "G-Class Lounge"
    );

    setElementText(
        "footer-description",
        settings.footer_description
    );

    renderFooterContact(
        "footer-phone",
        "fa-phone",
        settings.phone,
        settings.phone
            ? `tel:${normalizePhoneForLink(settings.phone)}`
            : ""
    );

    renderFooterContact(
        "footer-email",
        "fa-envelope",
        settings.email,
        settings.email
            ? `mailto:${settings.email}`
            : ""
    );

    renderFooterContact(
        "footer-address",
        "fa-location-dot",
        settings.address,
        settings.google_maps_url || ""
    );

    setElementText(
        "footer-weekday-label",
        settings.weekday_label
    );

    setElementText(
        "footer-weekday-hours",
        settings.weekday_hours
    );

    setElementText(
        "footer-weekend-label",
        settings.weekend_label
    );

    setElementText(
        "footer-weekend-hours",
        settings.weekend_hours
    );

    setElementText(
        "footer-copyright",
        settings.copyright_text
    );

    setElementText(
        "footer-made-with",
        settings.made_with_text
    );

    setElementLink(
        "facebook-link",
        settings.facebook_url,
        {
            hideWhenEmpty: true
        }
    );

    setElementLink(
        "instagram-link",
        settings.instagram_url,
        {
            hideWhenEmpty: true
        }
    );

    setElementLink(
        "twitter-link",
        settings.twitter_url,
        {
            hideWhenEmpty: true
        }
    );

    setElementLink(
        "youtube-link",
        settings.youtube_url,
        {
            hideWhenEmpty: true
        }
    );
}


function renderFooterContact(
    elementId,
    iconClass,
    value,
    link = ""
) {
    const element =
        getElement(elementId);

    if (!element) {
        return;
    }

    if (!value) {
        element.classList.add("hidden");
        return;
    }

    element.classList.remove("hidden");

    const safeValue =
        escapeHTML(value);

    const iconHTML = `
        <i
            class="
                fa-solid
                ${iconClass}
                text-[#D4AF37]
                mr-3
            "
        ></i>
    `;

    if (link) {
        const safeLink =
            escapeHTML(link);

        element.innerHTML = `
            ${iconHTML}

            <a
                href="${safeLink}"
                ${
                    link.startsWith("http")
                        ? `target="_blank" rel="noopener noreferrer"`
                        : ""
                }
                class="
                    hover:text-[#D4AF37]
                    transition
                "
            >
                ${safeValue}
            </a>
        `;

        return;
    }

    element.innerHTML = `
        ${iconHTML}
        ${safeValue}
    `;
}


document.addEventListener(
    "DOMContentLoaded",
    loadWebsiteSettings
);