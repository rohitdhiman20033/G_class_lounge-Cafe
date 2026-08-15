const RESET_EMAIL_KEY = "resetEmail";
const RESET_OTP_KEY = "resetOTP";
const RESEND_TIME_KEY = "resetOtpResendAvailableAt";

let resendTimerInterval = null;



// ELEMENTS


function getOTPElement(id) {
    return document.getElementById(id);
}


function getOTPInputs() {
    return Array.from(
        document.querySelectorAll(".otp-input")
    );
}



// MESSAGE


function showOTPMessage(message, type = "error") {
    const messageBox =
        getOTPElement("otp-message");

    if (!messageBox) return;

    messageBox.textContent = message;

    messageBox.classList.remove(
        "hidden",
        "border-red-500/40",
        "bg-red-500/10",
        "text-red-300",
        "border-green-500/40",
        "bg-green-500/10",
        "text-green-300",
        "border-yellow-500/40",
        "bg-yellow-500/10",
        "text-yellow-300"
    );

    if (type === "success") {
        messageBox.classList.add(
            "border-green-500/40",
            "bg-green-500/10",
            "text-green-300"
        );

    } else if (type === "warning") {
        messageBox.classList.add(
            "border-yellow-500/40",
            "bg-yellow-500/10",
            "text-yellow-300"
        );

    } else {
        messageBox.classList.add(
            "border-red-500/40",
            "bg-red-500/10",
            "text-red-300"
        );
    }
}


function hideOTPMessage() {
    getOTPElement("otp-message")
        ?.classList.add("hidden");
}



// LOADING


function setVerifyOTPLoading(isLoading) {
    const button =
        getOTPElement("verify-otp-button");

    const buttonText =
        getOTPElement("verify-otp-button-text");

    if (!button || !buttonText) return;

    button.disabled = isLoading;

    if (isLoading) {
        buttonText.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Verifying...
        `;
    } else {
        buttonText.innerHTML = `
            <i class="fa-solid fa-circle-check mr-2"></i>
            Verify OTP
        `;
    }
}


function setResendLoading(isLoading) {
    const button =
        getOTPElement("resend-otp-button");

    if (!button) return;

    button.disabled = isLoading;

    button.innerHTML = isLoading
        ? `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Sending...
        `
        : "Resend OTP";
}



// OTP INPUT HANDLING


function getEnteredOTP() {
    return getOTPInputs()
        .map(input => input.value)
        .join("");
}


function clearOTPInputs() {
    getOTPInputs().forEach(input => {
        input.value = "";
    });

    getOTPInputs()[0]?.focus();
}


function fillOTPInputs(value) {
    const digits = String(value)
        .replace(/\D/g, "")
        .slice(0, 6)
        .split("");

    const inputs = getOTPInputs();

    inputs.forEach((input, index) => {
        input.value = digits[index] || "";
    });

    const nextEmptyIndex =
        inputs.findIndex(input => !input.value);

    if (nextEmptyIndex >= 0) {
        inputs[nextEmptyIndex].focus();
    } else {
        inputs[inputs.length - 1]?.focus();
    }
}


function initializeOTPInputs() {
    const inputs = getOTPInputs();

    inputs.forEach((input, index) => {

        input.addEventListener("input", event => {
            const digit = event.target.value
                .replace(/\D/g, "")
                .slice(-1);

            event.target.value = digit;

            if (digit && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", event => {
            if (
                event.key === "Backspace" &&
                !input.value &&
                index > 0
            ) {
                inputs[index - 1].focus();
                inputs[index - 1].value = "";
            }

            if (
                event.key === "ArrowLeft" &&
                index > 0
            ) {
                event.preventDefault();
                inputs[index - 1].focus();
            }

            if (
                event.key === "ArrowRight" &&
                index < inputs.length - 1
            ) {
                event.preventDefault();
                inputs[index + 1].focus();
            }
        });

        input.addEventListener("paste", event => {
            event.preventDefault();

            const pastedText =
                event.clipboardData.getData("text");

            fillOTPInputs(pastedText);
        });

    });
}



// RESEND TIMER


function setResendAvailableTime(seconds = 60) {
    const availableAt =
        Date.now() + seconds * 1000;

    localStorage.setItem(
        RESEND_TIME_KEY,
        String(availableAt)
    );

    startResendTimer();
}


function startResendTimer() {
    clearInterval(resendTimerInterval);

    const timerText =
        getOTPElement("resend-timer-text");

    const resendButton =
        getOTPElement("resend-otp-button");

    const storedAvailableAt =
        Number(localStorage.getItem(RESEND_TIME_KEY));

    const availableAt =
        storedAvailableAt > Date.now()
            ? storedAvailableAt
            : Date.now();

    function updateTimer() {
        const remainingMilliseconds =
            availableAt - Date.now();

        const remainingSeconds =
            Math.max(
                0,
                Math.ceil(remainingMilliseconds / 1000)
            );

        if (remainingSeconds > 0) {
            timerText?.classList.remove("hidden");
            resendButton?.classList.add("hidden");

            if (timerText) {
                timerText.textContent =
                    `Resend available in ${remainingSeconds} seconds`;
            }

            return;
        }

        clearInterval(resendTimerInterval);

        timerText?.classList.add("hidden");
        resendButton?.classList.remove("hidden");

        if (resendButton) {
            resendButton.disabled = false;
        }
    }

    updateTimer();

    resendTimerInterval =
        setInterval(updateTimer, 1000);
}



// VERIFY OTP


async function handleOTPSubmit(event) {
    event.preventDefault();

    hideOTPMessage();

    const email =
        localStorage.getItem(RESET_EMAIL_KEY);

    const otp = getEnteredOTP();

    if (!email) {
        showOTPMessage(
            "Reset session not found. Enter your email again."
        );

        setTimeout(() => {
            window.location.href =
                "forgot-password.html";
        }, 1200);

        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        showOTPMessage(
            "Please enter the complete 6-digit OTP."
        );

        return;
    }

    setVerifyOTPLoading(true);

    try {
        const response =
            await verifyResetOTP({
                email,
                otp
            });

        localStorage.setItem(
            RESET_OTP_KEY,
            otp
        );

        showOTPMessage(
            `${response.message} Redirecting...`,
            "success"
        );

        setTimeout(() => {
            window.location.href =
                "reset-password.html";
        }, 1000);

    } catch (error) {
        console.error(
            "OTP verification error:",
            error
        );

        showOTPMessage(
            error.message ||
            "Unable to verify OTP."
        );

        clearOTPInputs();

    } finally {
        setVerifyOTPLoading(false);
    }
}



// RESEND OTP


async function handleResendOTP() {
    const email =
        localStorage.getItem(RESET_EMAIL_KEY);

    if (!email) {
        window.location.href =
            "forgot-password.html";

        return;
    }

    setResendLoading(true);
    hideOTPMessage();

    try {
        const response =
            await forgotPassword(email);

        localStorage.removeItem(RESET_OTP_KEY);

        clearOTPInputs();

        showOTPMessage(
            response.message ||
            "A new OTP has been sent.",
            "success"
        );

        setResendAvailableTime(60);

    } catch (error) {
        console.error(
            "Resend OTP error:",
            error
        );

        showOTPMessage(
            error.message ||
            "Unable to resend OTP."
        );

    } finally {
        setResendLoading(false);
    }
}


// INITIALIZE

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const email =
            localStorage.getItem(RESET_EMAIL_KEY);

        if (!email) {
            window.location.href =
                "forgot-password.html";

            return;
        }

        const emailDisplay =
            getOTPElement("otp-email-display");

        if (emailDisplay) {
            emailDisplay.textContent = email;
        }

        initializeOTPInputs();

        getOTPInputs()[0]?.focus();

        getOTPElement("otp-form")
            ?.addEventListener(
                "submit",
                handleOTPSubmit
            );

        getOTPElement("resend-otp-button")
            ?.addEventListener(
                "click",
                handleResendOTP
            );

        const storedAvailableAt =
            Number(
                localStorage.getItem(
                    RESEND_TIME_KEY
                )
            );

        if (!storedAvailableAt) {
            setResendAvailableTime(60);
        } else {
            startResendTimer();
        }
    }
);