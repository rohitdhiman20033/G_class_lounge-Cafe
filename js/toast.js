function getOrCreateToast() {
    let toast =
        document.getElementById("toast");

    let toastMessage =
        document.getElementById(
            "toast-message"
        );

    if (toast && toastMessage) {
        return {
            toast,
            toastMessage
        };
    }

    // Remove incomplete toast if one exists
    if (toast) {
        toast.remove();
    }

    toast = document.createElement("div");

    toast.id = "toast";

    toast.className = `
        fixed
        bottom-6
        left-1/2
        -translate-x-1/2
        translate-y-32
        opacity-0
        z-[99999]
        min-w-[280px]
        max-w-[90vw]
        bg-[#171412]
        border
        border-[#D4AF37]
        text-white
        px-5
        py-4
        rounded-xl
        shadow-2xl
        transition-all
        duration-300
    `;

    toastMessage =
        document.createElement("p");

    toastMessage.id =
        "toast-message";

    toastMessage.className =
        "text-sm font-semibold";

    toast.appendChild(
        toastMessage
    );

    document.body.appendChild(
        toast
    );

    return {
        toast,
        toastMessage
    };
}


let toastTimer = null;


function showToast(
    message,
    type = "success"
) {
    const {
        toast,
        toastMessage
    } = getOrCreateToast();

    toastMessage.innerText =
        String(message || "");

    if (type === "success") {
        toast.classList.remove(
            "border-red-500"
        );

        toast.classList.add(
            "border-[#D4AF37]"
        );

    } else {
        toast.classList.remove(
            "border-[#D4AF37]"
        );

        toast.classList.add(
            "border-red-500"
        );
    }

    toast.classList.remove(
        "translate-y-32",
        "opacity-0"
    );

    toast.classList.add(
        "translate-y-0",
        "opacity-100"
    );

    if (toastTimer) {
        clearTimeout(
            toastTimer
        );
    }

    toastTimer = setTimeout(
        () => {
            toast.classList.remove(
                "translate-y-0",
                "opacity-100"
            );

            toast.classList.add(
                "translate-y-32",
                "opacity-0"
            );

            toastTimer = null;
        },
        2500
    );
}