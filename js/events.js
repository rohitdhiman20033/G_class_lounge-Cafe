/*
EVENTS MODULE
*/

let eventItems = [];

const eventsContainer =
    getElement("events-container");

const EVENT_IMAGE_FALLBACK =
    "images/logo chai.jpeg";


/*
LOAD EVENTS
*/

async function loadEvents() {
    if (!eventsContainer) return;

    try {
        const response =
            await getEvents();

        eventItems =
            safeArray(response);

        renderEvents();

    } catch (error) {
        console.error(
            "Events loading failed:",
            error
        );

        renderRetryState(
            eventsContainer,
            {
                title:
                    "Events Could Not Be Loaded",

                message:
                    error.message ||
                    "Unable to load events.",

                retryText:
                    "Try Again",

                onRetry:
                    loadEvents
            }
        );

        showError(
            error.message ||
            "Unable to load events."
        );
    }
}


/*
RENDER EVENTS
*/

function renderEvents() {
    if (!eventsContainer) return;

    if (!eventItems.length) {
        renderEmptyState(
            eventsContainer,
            {
                title:
                    "No Upcoming Events",

                message:
                    "New events will appear here as soon as they are announced.",

                icon:
                    "fa-calendar"
            }
        );

        return;
    }

    eventsContainer.innerHTML =
        eventItems
            .map(createEventCard)
            .join("");
}


/*
EVENT CARD
*/

function createEventCard(event) {
    const title =
        escapeHTML(
            event.title ||
            "Upcoming Event"
        );

    const description =
        escapeHTML(
            event.description ||
            "Join us for a memorable experience."
        );

    const badge =
        escapeHTML(
            event.badge ||
            "Exclusive"
        );

    const dateTime =
        escapeHTML(
            event.date_time ||
            "Schedule Coming Soon"
        );

    const image =
        escapeHTML(
            event.image ||
            EVENT_IMAGE_FALLBACK
        );

    return `
        <article
            class="group bg-[#171412] rounded-3xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(212,175,55,0.30)] transition-all duration-500 flex flex-col"
        >

            <div class="relative overflow-hidden">

                <img
                    src="${image}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${EVENT_IMAGE_FALLBACK}';"
                    class="w-full h-72 object-cover group-hover:scale-110 transition duration-700"
                >

                <span
                    class="absolute top-5 left-5 bg-[#D4AF37] text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                >
                    ${badge}
                </span>

            </div>

            <div class="p-8 flex flex-col flex-1">

                <p
                    class="text-[#D4AF37] tracking-wider text-sm font-semibold"
                >
                    ${dateTime}
                </p>

                <h3
                    class="text-3xl text-white font-bold mt-3 group-hover:text-[#D4AF37] transition-colors duration-300"
                >
                    ${title}
                </h3>

                <p
                    class="text-gray-400 mt-4 leading-7"
                >
                    ${description}
                </p>

                <button
                    type="button"
                    onclick="scrollToBooking()"
                    class="mt-auto pt-7"
                >
                    <span
                        class="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-8 py-3 rounded-full font-semibold hover:bg-[#E7C456] hover:scale-105 transition-all duration-300"
                    >
                        <i class="fa-solid fa-calendar-check"></i>

                        Reserve Your Spot
                    </span>
                </button>

            </div>

        </article>
    `;
}

document.addEventListener(
    "DOMContentLoaded",
    loadEvents
);