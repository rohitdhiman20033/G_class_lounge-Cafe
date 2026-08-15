const RESET_EMAIL_STORAGE_KEY = "resetEmail";
const RESET_OTP_STORAGE_KEY = "resetOTP";
const RESET_RESEND_STORAGE_KEY = "resetOtpResendAvailableAt";


function getResetElement(id) {
    return document.getElementById(id);
}


function showResetMessage(message, type = "error") {
    const box =
        getResetElement("reset-password-message");

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


function hideResetMessage() {
    getResetElement(
        "reset-password-message"
    )?.classList.add("hidden");
}


function initializeResetPasswordToggles() {
    document
        .querySelectorAll(".reset-password-toggle")
        .forEach(button => {

            button.addEventListener("click", () => {
                const input =
                    getResetElement(
                        button.dataset.target
                    );

                const icon =
                    button.querySelector("i");

                if (!input || !icon) return;

                const isHidden =
                    input.type === "password";

                input.type =
                    isHidden ? "text" : "password";

                icon.classList.toggle(
                    "fa-eye",
                    !isHidden
                );

                icon.classList.toggle(
                    "fa-eye-slash",
                    isHidden
                );

                button.setAttribute(
                    "aria-label",
                    isHidden
                        ? "Hide password"
                        : "Show password"
                );
            });

        });
}


function getResetPasswordRules(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}


function updateResetRequirement(id, valid) {
    const element = getResetElement(id);

    if (!element) return;

    element.classList.remove(
        "text-gray-400",
        "text-green-400"
    );

    element.classList.add(
        valid
            ? "text-green-400"
            : "text-gray-400"
    );

    const icon = element.querySelector("i");

    if (icon) {
        icon.className =
            valid
                ? "fa-solid fa-circle-check mt-1"
                : "fa-solid fa-circle text-[7px] mt-2";
    }
}


function calculateResetStrength(password) {
    if (!password) {
        return {
            score: 0,
            label: "Not entered"
        };
    }

    const rules =
        getResetPasswordRules(password);

    let passed =
        Object.values(rules)
            .filter(Boolean)
            .length;

    if (password.length >= 12) {
        passed += 1;
    }

    if (passed <= 2) {
        return {
            score: 25,
            label: "Weak"
        };
    }

    if (passed <= 4) {
        return {
            score: 55,
            label: "Medium"
        };
    }

    if (passed === 5) {
        return {
            score: 80,
            label: "Strong"
        };
    }

    return {
        score: 100,
        label: "Very Strong"
    };
}


function updateResetStrength() {
    const password =
        getResetElement(
            "reset-new-password"
        )?.value || "";

    const rules =
        getResetPasswordRules(password);

    updateResetRequirement(
        "reset-requirement-length",
        rules.length
    );

    updateResetRequirement(
        "reset-requirement-uppercase",
        rules.uppercase
    );

    updateResetRequirement(
        "reset-requirement-lowercase",
        rules.lowercase
    );

    updateResetRequirement(
        "reset-requirement-number",
        rules.number
    );

    updateResetRequirement(
        "reset-requirement-special",
        rules.special
    );

    const strength =
        calculateResetStrength(password);

    const bar =
        getResetElement("reset-strength-bar");

    const text =
        getResetElement("reset-strength-text");

    if (bar) {
        bar.style.width =
            `${strength.score}%`;

        bar.className =
            "h-full transition-all duration-300";

        if (strength.score <= 25) {
            bar.classList.add("bg-red-500");
        } else if (strength.score <= 55) {
            bar.classList.add("bg-yellow-500");
        } else if (strength.score <= 80) {
            bar.classList.add("bg-blue-500");
        } else {
            bar.classList.add("bg-green-500");
        }
    }

    if (text) {
        text.textContent = strength.label;
    }

    updateResetPasswordMatch();
}


function updateResetPasswordMatch() {
    const password =
        getResetElement(
            "reset-new-password"
        )?.value || "";

    const confirmPassword =
        getResetElement(
            "reset-confirm-password"
        )?.value || "";

    const message =
        getResetElement(
            "reset-password-match-message"
        );

    if (!message) return;

    if (!confirmPassword) {
        message.classList.add("hidden");
        return;
    }

    message.classList.remove(
        "hidden",
        "text-green-400",
        "text-red-400"
    );

    if (password === confirmPassword) {
        message.textContent =
            "Passwords match.";

        message.classList.add(
            "text-green-400"
        );
    } else {
        message.textContent =
            "Passwords do not match.";

        message.classList.add(
            "text-red-400"
        );
    }
}


function setResetLoading(loading) {
    const button =
        getResetElement(
            "reset-password-button"
        );

    const text =
        getResetElement(
            "reset-password-button-text"
        );

    if (!button || !text) return;

    button.disabled = loading;

    if (loading) {
        text.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Resetting Password...
        `;
    } else {
        text.innerHTML = `
            <i class="fa-solid fa-shield-halved mr-2"></i>
            Reset Password
        `;
    }
}


function validateResetForm() {
    const password =
        getResetElement(
            "reset-new-password"
        ).value;

    const confirmPassword =
        getResetElement(
            "reset-confirm-password"
        ).value;

    const rules =
        getResetPasswordRules(password);

    if (!password) {
        throw new Error(
            "Please enter a new password."
        );
    }

    if (
        !rules.length ||
        !rules.uppercase ||
        !rules.lowercase ||
        !rules.number ||
        !rules.special
    ) {
        throw new Error(
            "Password must include uppercase, lowercase, number and special character."
        );
    }

    if (password !== confirmPassword) {
        throw new Error(
            "Passwords do not match."
        );
    }

    return {
        newPassword: password,
        confirmPassword
    };
}


async function handleResetSubmit(event) {
    event.preventDefault();

    hideResetMessage();

    const email =
        localStorage.getItem(
            RESET_EMAIL_STORAGE_KEY
        );

    const otp =
        localStorage.getItem(
            RESET_OTP_STORAGE_KEY
        );

    if (!email || !otp) {
        showResetMessage(
            "Reset session expired. Start again."
        );

        setTimeout(() => {
            window.location.href =
                "forgot-password.html";
        }, 1200);

        return;
    }

    let validated;

    try {
        validated =
            validateResetForm();
    } catch (error) {
        showResetMessage(error.message);
        return;
    }

    setResetLoading(true);

    try {
        const response =
            await resetPassword({
                email,
                otp,
                new_password:
                    validated.newPassword,
                confirm_password:
                    validated.confirmPassword
            });

        showResetMessage(
            `${response.message} Redirecting to login...`,
            "success"
        );

        localStorage.removeItem(
            RESET_EMAIL_STORAGE_KEY
        );

        localStorage.removeItem(
            RESET_OTP_STORAGE_KEY
        );

        localStorage.removeItem(
            RESET_RESEND_STORAGE_KEY
        );

        localStorage.removeItem(
            "accessToken"
        );

        localStorage.removeItem(
            "refreshToken"
        );

        localStorage.removeItem(
            "currentUser"
        );

        getResetElement(
            "reset-password-form"
        )?.reset();

        setTimeout(() => {
            window.location.href =
                "login.html?password_reset=1";
        }, 1600);

    } catch (error) {
        console.error(
            "Reset password error:",
            error
        );

        showResetMessage(
            error.message ||
            "Unable to reset password."
        );

    } finally {
        setResetLoading(false);
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {
        const email =
            localStorage.getItem(
                RESET_EMAIL_STORAGE_KEY
            );

        const otp =
            localStorage.getItem(
                RESET_OTP_STORAGE_KEY
            );

        if (!email || !otp) {
            window.location.href =
                "forgot-password.html";

            return;
        }

        initializeResetPasswordToggles();

        getResetElement(
            "reset-new-password"
        )?.addEventListener(
            "input",
            updateResetStrength
        );

        getResetElement(
            "reset-confirm-password"
        )?.addEventListener(
            "input",
            updateResetPasswordMatch
        );

        getResetElement(
            "reset-password-form"
        )?.addEventListener(
            "submit",
            handleResetSubmit
        );
    }
);