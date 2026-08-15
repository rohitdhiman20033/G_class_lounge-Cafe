async function loadHeroSection() {

    try {

        const hero =
            await getHeroSection();

        renderHeroSection(hero);

    }

    catch (error) {

        console.error(
            "Hero section failed:",
            error
        );

    }

}


function renderHeroSection(hero) {

    if (!hero) {
        return;
    }

    setElementText(
        "hero-eyebrow",
        hero.eyebrow,
        "Experience • Relax • Enjoy"
    );


    const title =
        getElement("hero-title");

    if (title) {

        const formattedTitle =
            (hero.title || "")
                .replace(
                    "JUST CHAI,",
                    "JUST<br>CHAI,"
                )
                .replace(
                    "IT'S AN",
                    "<br>IT'S AN"
                );

        title.innerHTML = `
            ${formattedTitle}

            <br>

            <span
                class="gold text-[#D4AF37]"
            >
                ${escapeHTML(
                    hero.highlighted_text
                )}
            </span>
        `;

    }


    setElementText(
        "hero-description",
        hero.description
    );


    setElementImage(
        "hero-image",
        hero.desktop_image,
        {
            alt: hero.title
        }
    );


    const mobileSource =
        getElement(
            "hero-mobile-source"
        );

    if (
        mobileSource &&
        hero.mobile_image
    ) {

        mobileSource.srcset =
            hero.mobile_image;

    }


    setElementText(
        "hero-primary-text",
        hero.primary_button_text
    );

    setElementLink(
        "hero-primary-link",
        hero.primary_button_link
    );


    setElementText(
        "hero-secondary-text",
        hero.secondary_button_text
    );

    setElementLink(
        "hero-secondary-link",
        hero.secondary_button_link
    );


    setElementText(
        "hero-stat-drinks",
        hero.stat1_value
    );

    setElementText(
        "hero-stat-drinks-label",
        hero.stat1_label
    );


    setElementText(
        "hero-stat-customers",
        hero.stat2_value
    );

    setElementText(
        "hero-stat-customers-label",
        hero.stat2_label
    );


    setElementText(
        "hero-stat-rating",
        hero.stat3_value
    );

    setElementText(
        "hero-stat-rating-label",
        hero.stat3_label
    );


    setElementText(
        "hero-feature1-text",
        hero.feature1_text
    );

    setElementText(
        "hero-feature2-text",
        hero.feature2_text
    );

    setElementText(
        "hero-feature3-text",
        hero.feature3_text
    );

    setElementText(
        "hero-feature4-text",
        hero.feature4_text
    );

    setElementText(
        "hero-feature5-text",
        hero.feature5_text
    );

}


document.addEventListener(
    "DOMContentLoaded",
    loadHeroSection
);