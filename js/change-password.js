const CHANGE_PASSWORD_STORAGE_KEYS = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    currentUser: "currentUser"
};


// ========================================
// ELEMENT HELPER
// ========================================

function getChangePasswordElement(id) {
    return document.getElementById(id);
}


// ========================================
// SESSION
// ========================================

function clearChangePasswordSession() {
    localStorage.removeItem(
        CHANGE_PASSWORD_STORAGE_KEYS.accessToken
    );

    localStorage.removeItem(
        CHANGE_PASSWORD_STORAGE_KEYS.refreshToken
    );

    localStorage.removeItem(
        CHANGE_PASSWORD_STORAGE_KEYS.currentUser
    );
}


function redirectToChangePasswordLogin() {
    window.location.href =
        "login.html?next=change-password.html";
}


function logoutFromChangePasswordPage() {
    clearChangePasswordSession();
    window.location.href = "index.html";
}


// ========================================
// MESSAGE
// ========================================

function showChangePasswordMessage(
    message,
    type = "error"
) {
    const messageBox =
        getChangePasswordElement(
            "change-password-message"
        );

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

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


function hideChangePasswordMessage() {
    getChangePasswordElement(
        "change-password-message"
    )?.classList.add("hidden");
}


// ========================================
// BUTTON LOADING
// ========================================

function setChangePasswordLoading(isLoading) {
    const button =
        getChangePasswordElement(
            "change-password-button"
        );

    const buttonText =
        getChangePasswordElement(
            "change-password-button-text"
        );

    if (!button || !buttonText) return;

    button.disabled = isLoading;

    if (isLoading) {
        buttonText.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Updating Password...
        `;
    } else {
        buttonText.innerHTML = `
            <i class="fa-solid fa-shield-halved mr-2"></i>
            Change Password
        `;
    }
}


// ========================================
// PASSWORD TOGGLE
// ========================================

function initializePasswordToggles() {
    document
        .querySelectorAll(".password-toggle")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const input =
                    getChangePasswordElement(
                        button.dataset.target
                    );

                const icon =
                    button.querySelector("i");

                if (!input || !icon) return;

                const isPassword =
                    input.type === "password";

                input.type =
                    isPassword
                        ? "text"
                        : "password";

                icon.classList.toggle(
                    "fa-eye",
                    !isPassword
                );

                icon.classList.toggle(
                    "fa-eye-slash",
                    isPassword
                );

                button.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );
            });

        });
}


// ========================================
// PASSWORD RULES
// ========================================

function getPasswordRules(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}


function updateRequirement(
    elementId,
    isValid
) {
    const element =
        getChangePasswordElement(elementId);

    if (!element) return;

    element.classList.remove(
        "text-gray-400",
        "text-green-400"
    );

    element.classList.add(
        isValid
            ? "text-green-400"
            : "text-gray-400"
    );

    const icon =
        element.querySelector("i");

    if (!icon) return;

    icon.className =
        isValid
            ? "fa-solid fa-circle-check mt-1"
            : "fa-solid fa-circle text-[7px] mt-2";
}


function calculatePasswordStrength(password) {
    if (!password) {
        return {
            score: 0,
            label: "Not entered"
        };
    }

    const rules =
        getPasswordRules(password);

    let score = 0;

    Object.values(rules).forEach((passed) => {
        if (passed) score += 1;
    });

    if (password.length >= 12) {
        score += 1;
    }

    if (score <= 2) {
        return {
            score: 25,
            label: "Weak"
        };
    }

    if (score <= 4) {
        return {
            score: 55,
            label: "Medium"
        };
    }

    if (score === 5) {
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


function updatePasswordStrength() {
    const password =
        getChangePasswordElement(
            "new-password"
        )?.value || "";

    const rules =
        getPasswordRules(password);

    updateRequirement(
        "requirement-length",
        rules.length
    );

    updateRequirement(
        "requirement-uppercase",
        rules.uppercase
    );

    updateRequirement(
        "requirement-lowercase",
        rules.lowercase
    );

    updateRequirement(
        "requirement-number",
        rules.number
    );

    updateRequirement(
        "requirement-special",
        rules.special
    );

    const strength =
        calculatePasswordStrength(password);

    const strengthBar =
        getChangePasswordElement(
            "password-strength-bar"
        );

    const strengthText =
        getChangePasswordElement(
            "password-strength-text"
        );

    if (strengthBar) {
        strengthBar.style.width =
            `${strength.score}%`;

        strengthBar.className =
            "h-full transition-all duration-300";

        if (strength.score <= 25) {
            strengthBar.classList.add(
                "bg-red-500"
            );
        } else if (strength.score <= 55) {
            strengthBar.classList.add(
                "bg-yellow-500"
            );
        } else if (strength.score <= 80) {
            strengthBar.classList.add(
                "bg-blue-500"
            );
        } else {
            strengthBar.classList.add(
                "bg-green-500"
            );
        }
    }

    if (strengthText) {
        strengthText.textContent =
            strength.label;
    }

    updatePasswordMatch();
}


// ========================================
// PASSWORD MATCH
// ========================================

function updatePasswordMatch() {
    const newPassword =
        getChangePasswordElement(
            "new-password"
        )?.value || "";

    const confirmPassword =
        getChangePasswordElement(
            "confirm-new-password"
        )?.value || "";

    const message =
        getChangePasswordElement(
            "password-match-message"
        );

    if (!message) return;

    if (!confirmPassword) {
        message.classList.add("hidden");
        return;
    }

    message.classList.remove(
        "hidden",
        "text-red-400",
        "text-green-400"
    );

    if (newPassword === confirmPassword) {
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


// ========================================
// VALIDATION
// ========================================

function validateChangePasswordForm() {
    const currentPassword =
        getChangePasswordElement(
            "current-password"
        ).value;

    const newPassword =
        getChangePasswordElement(
            "new-password"
        ).value;

    const confirmPassword =
        getChangePasswordElement(
            "confirm-new-password"
        ).value;

    if (!currentPassword) {
        throw new Error(
            "Please enter your current password."
        );
    }

    if (!newPassword) {
        throw new Error(
            "Please enter a new password."
        );
    }

    if (newPassword.length < 8) {
        throw new Error(
            "New password must contain at least 8 characters."
        );
    }

    const rules =
        getPasswordRules(newPassword);

    if (
        !rules.uppercase ||
        !rules.lowercase ||
        !rules.number ||
        !rules.special
    ) {
        throw new Error(
            "New password must include uppercase, lowercase, number and special character."
        );
    }

    if (currentPassword === newPassword) {
        throw new Error(
            "New password must be different from your current password."
        );
    }

    if (newPassword !== confirmPassword) {
        throw new Error(
            "New password and confirm password do not match."
        );
    }

    return {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
    };
}


// ========================================
// SUBMIT
// ========================================

async function handleChangePasswordSubmit(event) {
    event.preventDefault();

    hideChangePasswordMessage();

    let passwordData;

    try {
        passwordData =
            validateChangePasswordForm();

    } catch (error) {
        showChangePasswordMessage(
            error.message
        );

        return;
    }

    setChangePasswordLoading(true);

    try {
        const response =
            await changePassword(
                passwordData
            );

        showChangePasswordMessage(
            `${response.message} Redirecting to login...`,
            "success"
        );

        getChangePasswordElement(
            "change-password-form"
        )?.reset();

        updatePasswordStrength();
        updatePasswordMatch();

        setTimeout(() => {
            clearChangePasswordSession();

            window.location.href =
                "login.html?password_changed=1";
        }, 1800);

    } catch (error) {
        console.error(
            "Change password error:",
            error
        );

        if (error.status === 401) {
            clearChangePasswordSession();
            redirectToChangePasswordLogin();
            return;
        }

        showChangePasswordMessage(
            error.message ||
            "Unable to change password."
        );

    } finally {
        setChangePasswordLoading(false);
    }
}


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const accessToken =
            localStorage.getItem(
                CHANGE_PASSWORD_STORAGE_KEYS.accessToken
            );

        if (!accessToken) {
            redirectToChangePasswordLogin();
            return;
        }

        initializePasswordToggles();

        getChangePasswordElement(
            "new-password"
        )?.addEventListener(
            "input",
            updatePasswordStrength
        );

        getChangePasswordElement(
            "confirm-new-password"
        )?.addEventListener(
            "input",
            updatePasswordMatch
        );

        getChangePasswordElement(
            "change-password-form"
        )?.addEventListener(
            "submit",
            handleChangePasswordSubmit
        );

        getChangePasswordElement(
            "change-password-logout-button"
        )?.addEventListener(
            "click",
            logoutFromChangePasswordPage
        );
    }
);