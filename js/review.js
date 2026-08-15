/*
REVIEWS MODULE
*/

let reviews = [];

const reviewsContainer = getElement("reviews-container");
const reviewRating = getElement("review-rating");
const reviewMessage = getElement("review-message");
const reviewSuccess = getElement("review-success");

const REVIEW_LOGIN_URL =
    "login.html?next=index.html#reviews";


/*
HELPERS
*/

function formatReviewDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function getReviewStars(rating) {
    const value = Math.max(
        1,
        Math.min(
            5,
            Number(rating || 1)
        )
    );

    return (
        "★".repeat(value) +
        "☆".repeat(5 - value)
    );
}


/*
REVIEW CARD
*/

function createReviewCard(review) {
    const userName = escapeHTML(
        review.user_name || "Guest"
    );

    const comment = escapeHTML(
        review.comment || ""
    );

    const date = formatReviewDate(
        review.created_at
    );

    const stars = getReviewStars(
        review.rating
    );

    const firstLetter =
        userName
            .charAt(0)
            .toUpperCase() || "G";

    const profileImage =
        review.profile_image
            ? escapeHTML(
                review.profile_image
            )
            : "";

    const avatar = profileImage
        ? `
            <img
                src="${profileImage}"
                alt="${userName}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.remove();
                "
                class="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]"
            >
        `
        : `
            <div
                class="w-14 h-14 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold text-xl"
            >
                ${firstLetter}
            </div>
        `;

    return `
        <article
            class="group bg-[#171412] border border-[#D4AF37]/20 rounded-3xl p-7 transition-all duration-500 hover:-translate-y-2 hover:border-[#D4AF37] hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)]"
        >

            <div class="flex items-center gap-4">

                ${avatar}

                <div>
                    <h3
                        class="text-xl font-bold text-white group-hover:text-[#D4AF37] transition"
                    >
                        ${userName}
                    </h3>

                    <p class="text-gray-500 text-sm mt-1">
                        ${date}
                    </p>
                </div>

            </div>

            <div
                class="text-[#D4AF37] text-xl mt-6 tracking-wider"
            >
                ${stars}
            </div>

            <p class="text-gray-300 leading-7 mt-5">
                “${comment}”
            </p>

        </article>
    `;
}


/*
RENDER REVIEWS
*/

function renderReviews() {
    if (!reviewsContainer) return;

    if (!reviews.length) {
        renderEmptyState(
            reviewsContainer,
            {
                title: "No Reviews Yet",
                message:
                    "Be the first guest to share an experience.",
                icon:
                    "fa-comment-dots"
            }
        );

        return;
    }

    reviewsContainer.innerHTML =
        reviews
            .map(createReviewCard)
            .join("");
}


/*
LOAD REVIEWS
*/

async function loadReviews() {
    if (!reviewsContainer) return;

    try {
        reviews = safeArray(
            await getReviews()
        );

        renderReviews();

    } catch (error) {
        console.error(
            "Reviews loading failed:",
            error
        );

        renderRetryState(
            reviewsContainer,
            {
                title:
                    "Reviews Could Not Be Loaded",

                message:
                    error.message ||
                    "Unable to load reviews.",

                retryText:
                    "Try Again",

                onRetry:
                    loadReviews
            }
        );

        showError(
            error.message ||
            "Unable to load reviews."
        );
    }
}


/*
FORM MESSAGE
*/

function showReviewFormMessage(
    message,
    type = "success"
) {
    if (!reviewSuccess) return;

    reviewSuccess.textContent =
        message;

    reviewSuccess.classList.remove(
        "hidden",
        "text-[#D4AF37]",
        "text-red-400"
    );

    reviewSuccess.classList.add(
        type === "success"
            ? "text-[#D4AF37]"
            : "text-red-400"
    );
}


/*
SUBMIT REVIEW
*/

async function addReview() {
    const accessToken =
        localStorage.getItem(
            "accessToken"
        );

    if (!accessToken) {
        localStorage.setItem(
            "loginRedirect",
            "index.html#reviews"
        );

        window.location.href =
            REVIEW_LOGIN_URL;

        return;
    }

    const rating =
        Number(
            reviewRating?.value || 0
        );

    const comment =
        reviewMessage
            ?.value
            .trim() || "";

    if (
        rating < 1 ||
        rating > 5
    ) {
        showReviewFormMessage(
            "Please select a valid rating.",
            "error"
        );

        return;
    }

    if (comment.length < 5) {
        showReviewFormMessage(
            "Please write at least 5 characters.",
            "error"
        );

        return;
    }

    const submitButton =
        document.querySelector(
            'button[onclick="addReview()"]'
        );

    setReviewSubmitState(
        submitButton,
        true
    );

    try {
        const createdReview =
            await createReview({
                rating,
                comment
            });

        reviews.unshift(
            createdReview
        );

        renderReviews();

        if (reviewMessage) {
            reviewMessage.value = "";
        }

        if (reviewRating) {
            reviewRating.value = "5";
        }

        showReviewFormMessage(
            "✨ Thank you for sharing your experience!"
        );

        showSuccess(
            "Review submitted successfully."
        );

    } catch (error) {
        console.error(
            "Review submission failed:",
            error
        );

        if (error.status === 401) {
            window.location.href =
                REVIEW_LOGIN_URL;

            return;
        }

        const message =
            error.message ||
            "Unable to submit review.";

        showReviewFormMessage(
            message,
            "error"
        );

        showError(message);

    } finally {
        setReviewSubmitState(
            submitButton,
            false
        );
    }
}


/*
SUBMIT BUTTON STATE
*/

function setReviewSubmitState(
    button,
    loading
) {
    if (!button) return;

    button.disabled =
        loading;

    button.textContent =
        loading
            ? "Submitting Review..."
            : "Submit Review";
}


document.addEventListener(
    "DOMContentLoaded",
    loadReviews
);