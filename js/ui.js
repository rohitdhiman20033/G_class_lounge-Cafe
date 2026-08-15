/*
GLOBAL UI HELPERS
*/


let globalLoaderCount = 0;
let globalToastTimeout = null;
let activeConfirmResolver = null;


/*
GLOBAL LOADER
*/

function ensureGlobalLoader() {

    let loader =
        document.getElementById(
            "global-loader"
        );

    if (loader) {
        return loader;
    }

    loader =
        document.createElement("div");

    loader.id =
        "global-loader";

    loader.className = `
        hidden
        fixed
        inset-0
        z-[99999]
        bg-black/70
        backdrop-blur-sm
        items-center
        justify-center
    `;

    loader.innerHTML = `
        <div
            class="
                bg-[#171412]
                border
                border-[#D4AF37]/30
                rounded-3xl
                px-10
                py-9
                text-center
                shadow-[0_25px_80px_rgba(0,0,0,0.6)]
            "
        >

            <div
                class="
                    w-14
                    h-14
                    border-4
                    border-[#D4AF37]/20
                    border-t-[#D4AF37]
                    rounded-full
                    animate-spin
                    mx-auto
                "
            ></div>

            <p
                id="global-loader-message"
                class="
                    text-white
                    mt-5
                    font-semibold
                "
            >
                Loading...
            </p>

        </div>
    `;

    document.body.appendChild(
        loader
    );

    return loader;
}


function showLoader(
    message = "Loading..."
) {

    const loader =
        ensureGlobalLoader();

    globalLoaderCount++;

    const messageElement =
        document.getElementById(
            "global-loader-message"
        );

    if (messageElement) {
        messageElement.textContent =
            message;
    }

    loader.classList.remove(
        "hidden"
    );

    loader.classList.add(
        "flex"
    );

    document.body.style.overflow =
        "hidden";
}


function hideLoader() {

    globalLoaderCount =
        Math.max(
            0,
            globalLoaderCount - 1
        );

    if (globalLoaderCount > 0) {
        return;
    }

    const loader =
        document.getElementById(
            "global-loader"
        );

    if (!loader) {
        return;
    }

    loader.classList.add(
        "hidden"
    );

    loader.classList.remove(
        "flex"
    );

    document.body.style.overflow =
        "";
}


/*
GLOBAL TOAST
*/

function ensureGlobalToast() {

    let toast =
        document.getElementById(
            "global-toast"
        );

    if (toast) {
        return toast;
    }

    toast =
        document.createElement("div");

    toast.id =
        "global-toast";

    toast.className = `
        fixed
        bottom-6
        right-6
        z-[99999]
        max-w-sm
        translate-y-10
        opacity-0
        pointer-events-none
        transition-all
        duration-300
    `;

    toast.innerHTML = `
        <div
            id="global-toast-box"
            class="
                bg-[#171412]
                border
                rounded-2xl
                px-5
                py-4
                shadow-2xl
                flex
                items-start
                gap-4
            "
        >

            <div
                id="global-toast-icon"
                class="
                    text-xl
                    mt-0.5
                "
            ></div>

            <div class="flex-1">

                <p
                    id="global-toast-title"
                    class="
                        text-white
                        font-semibold
                    "
                ></p>

                <p
                    id="global-toast-message"
                    class="
                        text-gray-400
                        text-sm
                        mt-1
                        leading-6
                    "
                ></p>

            </div>

            <button
                id="global-toast-close"
                type="button"
                class="
                    text-gray-500
                    hover:text-white
                    transition
                "
                aria-label="Close notification"
            >
                <i
                    class="fa-solid fa-xmark"
                ></i>
            </button>

        </div>
    `;

    document.body.appendChild(
        toast
    );

    document
        .getElementById(
            "global-toast-close"
        )
        ?.addEventListener(
            "click",
            hideToast
        );

    return toast;
}


function showToast(
    message,
    {
        type = "info",
        title = "",
        duration = 4000,
    } = {}
) {

    const toast =
        ensureGlobalToast();

    const box =
        document.getElementById(
            "global-toast-box"
        );

    const icon =
        document.getElementById(
            "global-toast-icon"
        );

    const titleElement =
        document.getElementById(
            "global-toast-title"
        );

    const messageElement =
        document.getElementById(
            "global-toast-message"
        );

    if (
        !box ||
        !icon ||
        !titleElement ||
        !messageElement
    ) {
        return;
    }

    clearTimeout(
        globalToastTimeout
    );

    box.classList.remove(
        "border-green-500/40",
        "border-red-500/40",
        "border-blue-500/40",
        "border-[#D4AF37]/40"
    );

    const config = {
        success: {
            icon:
                '<i class="fa-solid fa-circle-check"></i>',
            iconClass:
                "text-green-400",
            borderClass:
                "border-green-500/40",
            defaultTitle:
                "Success",
        },

        error: {
            icon:
                '<i class="fa-solid fa-circle-exclamation"></i>',
            iconClass:
                "text-red-400",
            borderClass:
                "border-red-500/40",
            defaultTitle:
                "Error",
        },

        info: {
            icon:
                '<i class="fa-solid fa-circle-info"></i>',
            iconClass:
                "text-blue-400",
            borderClass:
                "border-blue-500/40",
            defaultTitle:
                "Information",
        },

        warning: {
            icon:
                '<i class="fa-solid fa-triangle-exclamation"></i>',
            iconClass:
                "text-[#D4AF37]",
            borderClass:
                "border-[#D4AF37]/40",
            defaultTitle:
                "Attention",
        },
    };

    const selected =
        config[type] ||
        config.info;

    icon.className =
        `text-xl mt-0.5 ${selected.iconClass}`;

    icon.innerHTML =
        selected.icon;

    box.classList.add(
        selected.borderClass
    );

    titleElement.textContent =
        title ||
        selected.defaultTitle;

    messageElement.textContent =
        message || "";

    toast.classList.remove(
        "translate-y-10",
        "opacity-0",
        "pointer-events-none"
    );

    toast.classList.add(
        "translate-y-0",
        "opacity-100"
    );

    globalToastTimeout =
        setTimeout(
            hideToast,
            duration
        );
}


function hideToast() {

    const toast =
        document.getElementById(
            "global-toast"
        );

    if (!toast) {
        return;
    }

    clearTimeout(
        globalToastTimeout
    );

    toast.classList.add(
        "translate-y-10",
        "opacity-0",
        "pointer-events-none"
    );

    toast.classList.remove(
        "translate-y-0",
        "opacity-100"
    );
}


function showSuccess(
    message,
    options = {}
) {

    showToast(
        message,
        {
            ...options,
            type: "success",
        }
    );
}


function showError(
    message,
    options = {}
) {

    showToast(
        message,
        {
            ...options,
            type: "error",
        }
    );
}


function showInfo(
    message,
    options = {}
) {

    showToast(
        message,
        {
            ...options,
            type: "info",
        }
    );
}


function showWarning(
    message,
    options = {}
) {

    showToast(
        message,
        {
            ...options,
            type: "warning",
        }
    );
}


/*

CONFIRM MODAL

*/

function ensureConfirmModal() {

    let modal =
        document.getElementById(
            "global-confirm-modal"
        );

    if (modal) {
        return modal;
    }

    modal =
        document.createElement("div");

    modal.id =
        "global-confirm-modal";

    modal.className = `
        hidden
        fixed
        inset-0
        z-[99999]
        bg-black/80
        backdrop-blur-sm
        items-center
        justify-center
        px-5
    `;

    modal.innerHTML = `
        <div
            class="
                w-full
                max-w-md
                bg-[#171412]
                border
                border-[#D4AF37]/25
                rounded-3xl
                p-8
                shadow-[0_30px_90px_rgba(0,0,0,0.7)]
            "
        >

            <div
                class="
                    w-14
                    h-14
                    rounded-full
                    bg-[#D4AF37]/10
                    text-[#D4AF37]
                    flex
                    items-center
                    justify-center
                    text-2xl
                    mx-auto
                "
            >
                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>
            </div>

            <h3
                id="confirm-modal-title"
                class="
                    text-white
                    text-2xl
                    font-bold
                    text-center
                    mt-5
                "
            >
                Confirm Action
            </h3>

            <p
                id="confirm-modal-message"
                class="
                    text-gray-400
                    text-center
                    leading-7
                    mt-3
                "
            ></p>

            <div
                class="
                    grid
                    grid-cols-2
                    gap-4
                    mt-8
                "
            >

                <button
                    id="confirm-modal-cancel"
                    type="button"
                    class="
                        border
                        border-gray-600
                        text-gray-300
                        py-3
                        rounded-xl
                        hover:bg-white/5
                        transition
                    "
                >
                    Cancel
                </button>

                <button
                    id="confirm-modal-confirm"
                    type="button"
                    class="
                        bg-[#D4AF37]
                        text-black
                        py-3
                        rounded-xl
                        font-bold
                        hover:scale-[1.02]
                        transition
                    "
                >
                    Confirm
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    document
        .getElementById(
            "confirm-modal-cancel"
        )
        ?.addEventListener(
            "click",
            () => {
                closeConfirmModal(
                    false
                );
            }
        );

    document
        .getElementById(
            "confirm-modal-confirm"
        )
        ?.addEventListener(
            "click",
            () => {
                closeConfirmModal(
                    true
                );
            }
        );

    modal.addEventListener(
        "click",
        event => {
            if (
                event.target === modal
            ) {
                closeConfirmModal(
                    false
                );
            }
        }
    );

    return modal;
}


function confirmAction(
    message,
    {
        title = "Confirm Action",
        confirmText = "Confirm",
        cancelText = "Cancel",
    } = {}
) {

    const modal =
        ensureConfirmModal();

    const titleElement =
        document.getElementById(
            "confirm-modal-title"
        );

    const messageElement =
        document.getElementById(
            "confirm-modal-message"
        );

    const confirmButton =
        document.getElementById(
            "confirm-modal-confirm"
        );

    const cancelButton =
        document.getElementById(
            "confirm-modal-cancel"
        );

    if (titleElement) {
        titleElement.textContent =
            title;
    }

    if (messageElement) {
        messageElement.textContent =
            message;
    }

    if (confirmButton) {
        confirmButton.textContent =
            confirmText;
    }

    if (cancelButton) {
        cancelButton.textContent =
            cancelText;
    }

    modal.classList.remove(
        "hidden"
    );

    modal.classList.add(
        "flex"
    );

    document.body.style.overflow =
        "hidden";

    return new Promise(
        resolve => {

            if (
                activeConfirmResolver
            ) {
                activeConfirmResolver(
                    false
                );
            }

            activeConfirmResolver =
                resolve;

        }
    );
}


function closeConfirmModal(
    confirmed
) {

    const modal =
        document.getElementById(
            "global-confirm-modal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );

        modal.classList.remove(
            "flex"
        );

    }

    document.body.style.overflow =
        "";

    if (
        activeConfirmResolver
    ) {

        activeConfirmResolver(
            confirmed
        );

        activeConfirmResolver =
            null;

    }
}


/*

EMPTY STATE

*/

function renderEmptyState(
    container,
    {
        title = "Nothing Found",
        message = "",
        icon = "fa-box-open",
    } = {}
) {

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div
            class="
                col-span-full
                text-center
                py-16
            "
        >

            <div
                class="
                    text-[#D4AF37]
                    text-5xl
                "
            >
                <i
                    class="fa-solid ${escapeHTML(icon)}"
                ></i>
            </div>

            <h3
                class="
                    text-white
                    text-2xl
                    font-bold
                    mt-5
                "
            >
                ${escapeHTML(title)}
            </h3>

            ${
                message
                    ? `
                        <p
                            class="
                                text-gray-400
                                mt-3
                            "
                        >
                            ${escapeHTML(message)}
                        </p>
                    `
                    : ""
            }

        </div>
    `;
}


/*

ERROR + RETRY STATE

*/

function renderRetryState(
    container,
    {
        title =
            "Something Went Wrong",
        message =
            "Unable to load this content.",
        retryText =
            "Try Again",
        onRetry =
            null,
    } = {}
) {

    if (!container) {
        return;
    }

    const retryId =
        `retry-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    container.innerHTML = `
        <div
            class="
                col-span-full
                text-center
                py-16
            "
        >

            <div
                class="
                    text-red-400
                    text-5xl
                "
            >
                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>
            </div>

            <h3
                class="
                    text-white
                    text-2xl
                    font-bold
                    mt-5
                "
            >
                ${escapeHTML(title)}
            </h3>

            <p
                class="
                    text-gray-400
                    mt-3
                "
            >
                ${escapeHTML(message)}
            </p>

            ${
                typeof onRetry ===
                "function"
                    ? `
                        <button
                            id="${retryId}"
                            type="button"
                            class="
                                mt-6
                                bg-[#D4AF37]
                                text-black
                                px-7
                                py-3
                                rounded-full
                                font-semibold
                                hover:scale-105
                                transition
                            "
                        >
                            ${escapeHTML(
                                retryText
                            )}
                        </button>
                    `
                    : ""
            }

        </div>
    `;

    if (
        typeof onRetry ===
        "function"
    ) {

        document
            .getElementById(
                retryId
            )
            ?.addEventListener(
                "click",
                onRetry
            );

    }
}