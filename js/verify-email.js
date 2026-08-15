const VERIFICATION_RESEND_TIME_KEY =
    "verificationResendAvailableAt";

let verificationResendInterval = null;

const VERIFICATION_EMAIL_KEY =
    "verificationEmail";


function getEmailOTPInputs() {
    return Array.from(
        document.querySelectorAll(
            ".email-otp-input"
        )
    );
}


function getEmailOTP() {
    return getEmailOTPInputs()
        .map(input => input.value)
        .join("");
}


function showVerifyEmailMessage(
    message,
    type = "error"
) {
    const box =
        document.getElementById(
            "verify-email-message"
        );

    if (!box) return;

    box.textContent = message;

    box.classList.remove(
        "hidden",
        "border-red-500/40",
        "bg-red-500/10",
        "text-red-300",
        "border-green-500/40",
        "bg-green-500/10",
        "text-green-300"
    );

    if (type === "success") {
        box.classList.add(
            "border-green-500/40",
            "bg-green-500/10",
            "text-green-300"
        );
    } else {
        box.classList.add(
            "border-red-500/40",
            "bg-red-500/10",
            "text-red-300"
        );
    }
}


function initializeEmailOTPInputs() {
    const inputs = getEmailOTPInputs();

    inputs.forEach((input, index) => {

        input.addEventListener(
            "input",
            event => {
                event.target.value =
                    event.target.value
                        .replace(/\D/g, "")
                        .slice(-1);

                if (
                    event.target.value &&
                    index < inputs.length - 1
                ) {
                    inputs[index + 1].focus();
                }
            }
        );

        input.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Backspace" &&
                    !input.value &&
                    index > 0
                ) {
                    inputs[index - 1].focus();
                }
            }
        );

        input.addEventListener(
            "paste",
            event => {
                event.preventDefault();

                const digits =
                    event.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6)
                        .split("");

                inputs.forEach(
                    (otpInput, otpIndex) => {
                        otpInput.value =
                            digits[otpIndex] || "";
                    }
                );
            }
        );

    });
}

function clearEmailOTPInputs() {
    getEmailOTPInputs().forEach(input => {
        input.value = "";
    });

    getEmailOTPInputs()[0]?.focus();
}


function setVerificationResendTime(
    seconds = 60
) {
    const availableAt =
        Date.now() + seconds * 1000;

    localStorage.setItem(
        VERIFICATION_RESEND_TIME_KEY,
        String(availableAt)
    );

    startVerificationResendTimer();
}


function startVerificationResendTimer() {
    clearInterval(
        verificationResendInterval
    );

    const timer =
        document.getElementById(
            "verification-resend-timer"
        );

    const button =
        document.getElementById(
            "verification-resend-button"
        );

    const storedTime = Number(
        localStorage.getItem(
            VERIFICATION_RESEND_TIME_KEY
        )
    );

    const availableAt =
        storedTime > Date.now()
            ? storedTime
            : Date.now();

    function updateTimer() {
        const remaining = Math.max(
            0,
            Math.ceil(
                (availableAt - Date.now()) / 1000
            )
        );

        if (remaining > 0) {
            timer?.classList.remove("hidden");
            button?.classList.add("hidden");

            if (timer) {
                timer.textContent =
                    `Resend available in ${remaining} seconds`;
            }

            return;
        }

        clearInterval(
            verificationResendInterval
        );

        timer?.classList.add("hidden");
        button?.classList.remove("hidden");

        if (button) {
            button.disabled = false;
        }
    }

    updateTimer();

    verificationResendInterval =
        setInterval(updateTimer, 1000);
}


async function handleVerificationResend() {
    const email =
        localStorage.getItem(
            VERIFICATION_EMAIL_KEY
        );

    const button =
        document.getElementById(
            "verification-resend-button"
        );

    if (!button) return;

    if (!email) {
        window.location.href =
            "register.html";

        return;
    }

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Sending...
    `;

    try {
        const response =
            await resendVerificationOTP(
                email
            );

        clearEmailOTPInputs();

        showVerifyEmailMessage(
            response.message ||
            "A new verification OTP has been sent.",
            "success"
        );

        setVerificationResendTime(60);

    } catch (error) {
        console.error(
            "Verification resend error:",
            error
        );

        showVerifyEmailMessage(
            error.message ||
            "Unable to resend verification OTP."
        );

    } finally {
        button.disabled = false;
        button.innerHTML = "Resend OTP";
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {
        const email =
            localStorage.getItem(
                VERIFICATION_EMAIL_KEY
            );

        if (!email) {
            window.location.href =
                "register.html";

            return;
        }

        const emailDisplay =
            document.getElementById(
                "verification-email-display"
            );

        if (emailDisplay) {
            emailDisplay.textContent = email;
        }

        initializeEmailOTPInputs();

        const resendButton =
            document.getElementById(
                "verification-resend-button"
            );

        resendButton?.addEventListener(
            "click",
            handleVerificationResend
        );

        const storedResendTime = Number(
            localStorage.getItem(
                VERIFICATION_RESEND_TIME_KEY
            )
        );

        if (!storedResendTime) {
            setVerificationResendTime(60);
        } else {
            startVerificationResendTimer();
        }

        getEmailOTPInputs()[0]?.focus();

        document
            .getElementById(
                "verify-email-form"
            )
            ?.addEventListener(
                "submit",
                async event => {
                    event.preventDefault();

                    const otp = getEmailOTP();

                    if (!/^\d{6}$/.test(otp)) {
                        showVerifyEmailMessage(
                            "Enter the complete 6-digit OTP."
                        );

                        return;
                    }

                    const button =
                        document.getElementById(
                            "verify-email-button"
                        );

                    const buttonText =
                        document.getElementById(
                            "verify-email-button-text"
                        );

                    button.disabled = true;

                    buttonText.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                        Verifying...
                    `;

                    try {
                        const response =
                            await verifyEmail({
                                email,
                                otp
                            });

                        showVerifyEmailMessage(
                            `${response.message} Redirecting to login...`,
                            "success"
                        );

                        localStorage.removeItem(
                            VERIFICATION_EMAIL_KEY
                        );

                        localStorage.removeItem(
                            VERIFICATION_RESEND_TIME_KEY
                        );

                        setTimeout(() => {
                            window.location.href =
                                "login.html?email_verified=1";
                        }, 1200);

                    } catch (error) {
                        console.error(error);

                        showVerifyEmailMessage(
                            error.message ||
                            "Unable to verify email."
                        );

                    } finally {
                        button.disabled = false;

                        buttonText.innerHTML = `
                            <i class="fa-solid fa-circle-check mr-2"></i>
                            Verify Email
                        `;
                    }
                }
            );
    }
);