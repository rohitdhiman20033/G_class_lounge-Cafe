/*
GALLERY MODULE
*/

let galleryItems = [];
let activeGalleryIndex = 0;
let isFullGalleryVisible = false;

const galleryContainer =
    getElement("gallery-container");

const galleryToggleButton =
    getElement("gallery-toggle-button");

const galleryToggleText =
    getElement("gallery-toggle-text");

const galleryToggleIcon =
    getElement("gallery-toggle-icon");

const GALLERY_VISIBLE_LIMIT = 5;

const GALLERY_IMAGE_FALLBACK =
    "images/logo chai.jpeg";


/*
LOAD GALLERY
*/

async function loadGallery() {
    if (!galleryContainer) {
        return;
    }

    try {
        const response =
            await getGalleryImages();

        galleryItems =
            safeArray(response);

        renderGallery();

    } catch (error) {
        console.error(
            "Gallery loading failed:",
            error
        );

        renderRetryState(
            galleryContainer,
            {
                title:
                    "Gallery Could Not Be Loaded",

                message:
                    error.message ||
                    "Unable to load gallery.",

                retryText:
                    "Try Again",

                onRetry:
                    loadGallery
            }
        );

        showError(
            error.message ||
            "Unable to load gallery."
        );
    }
}


/*
RENDER GALLERY
*/

function renderGallery() {
    if (!galleryContainer) {
        return;
    }

    if (!galleryItems.length) {
        renderEmptyState(
            galleryContainer,
            {
                title:
                    "No Gallery Images",

                message:
                    "New images will appear here soon.",

                icon:
                    "fa-images"
            }
        );

        updateGalleryToggleButton();

        return;
    }

    const visibleItems =
        isFullGalleryVisible
            ? galleryItems
            : galleryItems.slice(
                0,
                GALLERY_VISIBLE_LIMIT
            );

    galleryContainer.innerHTML =
        visibleItems
            .map(
                (item, index) =>
                    createGalleryCard(
                        item,
                        index
                    )
            )
            .join("");

    updateGalleryToggleButton();
}


/*
GALLERY CARD
*/

function createGalleryCard(
    item,
    index
) {
    const title =
        escapeHTML(
            item.title ||
            "Gallery Image"
        );

    const description =
        escapeHTML(
            item.description || ""
        );

    const image =
        escapeHTML(
            item.image ||
            GALLERY_IMAGE_FALLBACK
        );

    const sizeClass =
        item.card_size === "large"
            ? "md:col-span-2 md:row-span-2"
            : "";

    return `
        <article
            onclick="openGalleryLightbox(${index})"
            class="
                group
                relative
                overflow-hidden
                rounded-3xl
                cursor-pointer
                border
                border-transparent
                hover:border-[#D4AF37]
                hover:-translate-y-2
                hover:shadow-[0_25px_50px_rgba(212,175,55,0.35)]
                transition-all
                duration-500
                ${sizeClass}
            "
        >

            <img
                src="${image}"
                alt="${title}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.src='${GALLERY_IMAGE_FALLBACK}';
                "
                class="
                    w-full
                    h-full
                    object-cover
                    rounded-3xl
                    transition-all
                    duration-700
                    group-hover:scale-110
                    group-hover:brightness-75
                "
            >

            <div
                class="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black/90
                    via-black/40
                    to-transparent
                    opacity-0
                    group-hover:opacity-100
                    backdrop-blur-[2px]
                    transition-all
                    duration-500
                    flex
                    flex-col
                    items-center
                    justify-center
                    text-center
                    px-6
                "
            >

                <i
                    class="
                        fa-solid
                        fa-expand
                        text-[#D4AF37]
                        text-3xl
                        mb-4
                        group-hover:scale-125
                        group-hover:rotate-12
                        transition-all
                        duration-500
                    "
                ></i>

                <h3
                    class="
                        text-white
                        text-2xl
                        font-semibold
                        group-hover:-translate-y-1
                        transition-all
                        duration-500
                    "
                >
                    ${title}
                </h3>

                ${
                    description
                        ? `
                            <p
                                class="
                                    text-gray-300
                                    text-sm
                                    mt-2
                                    group-hover:text-white
                                    transition-all
                                    duration-500
                                "
                            >
                                ${description}
                            </p>
                        `
                        : ""
                }

            </div>

        </article>
    `;
}


/*
VIEW FULL GALLERY
*/

function updateGalleryToggleButton() {
    if (
        !galleryToggleButton ||
        !galleryToggleText ||
        !galleryToggleIcon
    ) {
        return;
    }

    if (
        galleryItems.length <=
        GALLERY_VISIBLE_LIMIT
    ) {
        galleryToggleButton
            .classList
            .add("hidden");

        return;
    }

    galleryToggleButton
        .classList
        .remove("hidden");

    if (isFullGalleryVisible) {
        galleryToggleText.textContent =
            "Show Less";

        galleryToggleIcon
            .classList
            .remove(
                "fa-arrow-right"
            );

        galleryToggleIcon
            .classList
            .add(
                "fa-arrow-up"
            );

    } else {
        galleryToggleText.textContent =
            "View Full Gallery";

        galleryToggleIcon
            .classList
            .remove(
                "fa-arrow-up"
            );

        galleryToggleIcon
            .classList
            .add(
                "fa-arrow-right"
            );
    }
}


function toggleFullGallery() {
    isFullGalleryVisible =
        !isFullGalleryVisible;

    renderGallery();

    if (!isFullGalleryVisible) {
        getElement("gallery")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }
}


/*
LIGHTBOX CREATION
*/

function createGalleryLightbox() {
    if (
        getElement(
            "gallery-lightbox"
        )
    ) {
        return;
    }

    document.body.insertAdjacentHTML(
        "beforeend",
        `
            <div
                id="gallery-lightbox"
                class="
                    hidden
                    fixed
                    inset-0
                    z-[9999]
                    bg-black/95
                    backdrop-blur-md
                    items-center
                    justify-center
                    px-5
                    py-10
                "
            >

                <button
                    id="gallery-lightbox-close"
                    type="button"
                    aria-label="Close gallery"
                    class="
                        absolute
                        top-6
                        right-6
                        w-12
                        h-12
                        rounded-full
                        bg-white/10
                        text-white
                        text-2xl
                        hover:bg-[#D4AF37]
                        hover:text-black
                        transition
                    "
                >
                    <i
                        class="fa-solid fa-xmark"
                    ></i>
                </button>


                <button
                    id="gallery-lightbox-previous"
                    type="button"
                    aria-label="Previous image"
                    class="
                        absolute
                        left-4
                        md:left-10
                        w-12
                        h-12
                        rounded-full
                        bg-white/10
                        text-white
                        text-xl
                        hover:bg-[#D4AF37]
                        hover:text-black
                        transition
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-chevron-left
                        "
                    ></i>
                </button>


                <div
                    class="
                        max-w-5xl
                        w-full
                        text-center
                    "
                >

                    <img
                        id="gallery-lightbox-image"
                        src=""
                        alt=""
                        class="
                            max-h-[75vh]
                            w-full
                            object-contain
                            rounded-3xl
                            border
                            border-[#D4AF37]/30
                        "
                    >

                    <h3
                        id="gallery-lightbox-title"
                        class="
                            text-3xl
                            text-white
                            font-bold
                            mt-6
                        "
                    ></h3>

                    <p
                        id="gallery-lightbox-description"
                        class="
                            text-gray-400
                            mt-3
                        "
                    ></p>

                </div>


                <button
                    id="gallery-lightbox-next"
                    type="button"
                    aria-label="Next image"
                    class="
                        absolute
                        right-4
                        md:right-10
                        w-12
                        h-12
                        rounded-full
                        bg-white/10
                        text-white
                        text-xl
                        hover:bg-[#D4AF37]
                        hover:text-black
                        transition
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-chevron-right
                        "
                    ></i>
                </button>

            </div>
        `
    );

    bindGalleryLightboxEvents();
}


/*
LIGHTBOX EVENTS
*/

function bindGalleryLightboxEvents() {
    const lightbox =
        getElement(
            "gallery-lightbox"
        );

    getElement(
        "gallery-lightbox-close"
    )?.addEventListener(
        "click",
        closeGalleryLightbox
    );

    getElement(
        "gallery-lightbox-previous"
    )?.addEventListener(
        "click",
        showPreviousGalleryImage
    );

    getElement(
        "gallery-lightbox-next"
    )?.addEventListener(
        "click",
        showNextGalleryImage
    );

    lightbox?.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                lightbox
            ) {
                closeGalleryLightbox();
            }
        }
    );
}


/*
LIGHTBOX UPDATE
*/

function updateGalleryLightbox() {
    const item =
        galleryItems[
            activeGalleryIndex
        ];

    if (!item) {
        return;
    }

    const image =
        getElement(
            "gallery-lightbox-image"
        );

    const title =
        getElement(
            "gallery-lightbox-title"
        );

    const description =
        getElement(
            "gallery-lightbox-description"
        );

    if (image) {
        image.onerror =
            function () {
                this.onerror = null;

                this.src =
                    GALLERY_IMAGE_FALLBACK;
            };

        image.src =
            item.image ||
            GALLERY_IMAGE_FALLBACK;

        image.alt =
            item.title ||
            "Gallery Image";
    }

    if (title) {
        title.textContent =
            item.title ||
            "Gallery Image";
    }

    if (description) {
        description.textContent =
            item.description || "";

        description.classList.toggle(
            "hidden",
            !item.description
        );
    }
}


/*
OPEN / CLOSE LIGHTBOX
*/

function openGalleryLightbox(index) {
    if (!galleryItems.length) {
        return;
    }

    const numericIndex =
        Number(index);

    if (
        !Number.isInteger(
            numericIndex
        ) ||
        numericIndex < 0 ||
        numericIndex >=
            galleryItems.length
    ) {
        return;
    }

    createGalleryLightbox();

    activeGalleryIndex =
        numericIndex;

    updateGalleryLightbox();

    const lightbox =
        getElement(
            "gallery-lightbox"
        );

    if (!lightbox) {
        return;
    }

    lightbox.classList.remove(
        "hidden"
    );

    lightbox.classList.add(
        "flex"
    );

    document.body.style.overflow =
        "hidden";
}


function closeGalleryLightbox() {
    const lightbox =
        getElement(
            "gallery-lightbox"
        );

    if (!lightbox) {
        return;
    }

    lightbox.classList.add(
        "hidden"
    );

    lightbox.classList.remove(
        "flex"
    );

    document.body.style.overflow =
        "";
}


/*
NEXT / PREVIOUS
*/

function showNextGalleryImage() {
    if (!galleryItems.length) {
        return;
    }

    activeGalleryIndex =
        (
            activeGalleryIndex + 1
        ) %
        galleryItems.length;

    updateGalleryLightbox();
}


function showPreviousGalleryImage() {
    if (!galleryItems.length) {
        return;
    }

    activeGalleryIndex =
        (
            activeGalleryIndex -
            1 +
            galleryItems.length
        ) %
        galleryItems.length;

    updateGalleryLightbox();
}


/*
KEYBOARD NAVIGATION
*/

document.addEventListener(
    "keydown",
    event => {
        const lightbox =
            getElement(
                "gallery-lightbox"
            );

        if (
            !lightbox ||
            lightbox.classList.contains(
                "hidden"
            )
        ) {
            return;
        }

        if (
            event.key ===
            "Escape"
        ) {
            closeGalleryLightbox();
        }

        if (
            event.key ===
            "ArrowRight"
        ) {
            showNextGalleryImage();
        }

        if (
            event.key ===
            "ArrowLeft"
        ) {
            showPreviousGalleryImage();
        }
    }
);


document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadGallery();

        galleryToggleButton
            ?.addEventListener(
                "click",
                toggleFullGallery
            );
    }
);