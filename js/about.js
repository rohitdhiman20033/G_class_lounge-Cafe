async function loadAboutSection() {
    try {
        const about =
            await getAboutSection();

        renderAboutSection(about);

    } catch (error) {
        console.error(
            "About section failed:",
            error
        );
    }
}


function renderAboutSection(about) {
    if (!about) {
        return;
    }

    setElementText(
        "about-eyebrow",
        about.eyebrow,
        "About G Class Lounge"
    );

    renderAboutTitle(about);

    setElementText(
        "about-description",
        about.description
    );

    setElementImage(
        "about-image",
        about.image,
        {
            fallback: "images/aboutimg.png",
            alt:
                about.title ||
                "Luxury interior of G Class Lounge"
        }
    );

    setElementText(
        "about-stat-customers",
        about.customers,
        "10K+"
    );

    setElementText(
        "about-stat-items",
        about.menu_items,
        "50+"
    );

    setElementText(
        "about-stat-rating",
        about.rating,
        "4.9★"
    );

    renderAboutPrimaryButton(about);

    setElementText(
        "about-secondary-link",
        about.secondary_button,
        "View Our Gallery"
    );

    setElementLink(
        "about-secondary-link",
        about.secondary_link,
        {
            fallback: "#gallery"
        }
    );

    renderAboutFeatures(about);

    renderAboutSignature(
        about.signature_text
    );
}


function renderAboutTitle(about) {
    const title =
        getElement("about-title");

    if (!title) {
        return;
    }

    title.innerHTML = `
        ${escapeHTML(
            about.title ||
            "Crafted For Conversations."
        )}

        <span class="text-[#D4AF37]">
            ${escapeHTML(
                about.highlighted_text ||
                "Designed For Memories."
            )}
        </span>
    `;
}


function renderAboutPrimaryButton(about) {
    const primaryLink =
        getElement("about-primary-link");

    if (!primaryLink) {
        return;
    }

    primaryLink.innerHTML = `
        ${escapeHTML(
            about.primary_button ||
            "Explore Our Menu"
        )}

        <i
            class="
                fa-solid
                fa-arrow-right
                ml-3
                group-hover:translate-x-2
                transition-transform
                duration-300
            "
        ></i>
    `;

    setElementLink(
        "about-primary-link",
        about.primary_link,
        {
            fallback: "#menu"
        }
    );
}


function renderAboutFeatures(about) {
    const features =
        getElements(
            "#about-features article"
        );

    const featureData = [
        {
            title:
                about.feature1_title,
            description:
                about.feature1_description
        },
        {
            title:
                about.feature2_title,
            description:
                about.feature2_description
        },
        {
            title:
                about.feature3_title,
            description:
                about.feature3_description
        },
        {
            title:
                about.feature4_title,
            description:
                about.feature4_description
        }
    ];

    features.forEach(
        (feature, index) => {
            const data =
                featureData[index];

            if (!data) {
                return;
            }

            const heading =
                feature.querySelector("h3");

            const paragraph =
                feature.querySelector("p");

            if (heading) {
                heading.textContent =
                    data.title || "";
            }

            if (paragraph) {
                paragraph.textContent =
                    data.description || "";
            }
        }
    );
}


function renderAboutSignature(text) {
    const signature =
        document.querySelector(
            "#about .fa-heart"
        )?.parentElement
            ?.nextElementSibling;

    if (!signature) {
        return;
    }

    signature.textContent =
        text || "";
}


document.addEventListener(
    "DOMContentLoaded",
    loadAboutSection
);