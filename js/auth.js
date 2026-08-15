const AUTH_STORAGE_KEYS = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    currentUser: "currentUser"
};


function saveAuthSession(authData) {

    localStorage.setItem(
        AUTH_STORAGE_KEYS.accessToken,
        authData.access
    );

    localStorage.setItem(
        AUTH_STORAGE_KEYS.refreshToken,
        authData.refresh
    );

    localStorage.setItem(
        AUTH_STORAGE_KEYS.currentUser,
        JSON.stringify(authData.user)
    );
}


function clearAuthSession() {

    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.currentUser);
}


function getStoredUser() {

    try {

        const user = localStorage.getItem(
            AUTH_STORAGE_KEYS.currentUser
        );

        return user ? JSON.parse(user) : null;

    } catch (error) {

        console.error("Invalid stored user:", error);

        clearAuthSession();

        return null;
    }
}


function isLoggedIn() {

    return Boolean(
        localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)
    );
}


function showAuthMessage(message, type = "error") {

    const messageBox = document.getElementById("auth-message");

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.classList.remove(
        "hidden",
        "border-red-500/40",
        "bg-red-500/10",
        "text-red-300",
        "border-green-500/40",
        "bg-green-500/10",
        "text-green-300"
    );

    if (type === "success") {

        messageBox.classList.add(
            "border-green-500/40",
            "bg-green-500/10",
            "text-green-300"
        );

    } else {

        messageBox.classList.add(
            "border-red-500/40",
            "bg-red-500/10",
            "text-red-300"
        );
    }
}


const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailInput =
            document.getElementById("login-email");

        const passwordInput =
            document.getElementById("login-password");

        const loginButton =
            document.getElementById("login-button");

        const buttonText =
            document.getElementById("login-button-text");

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {

            showAuthMessage(
                "Please enter your email and password."
            );

            return;
        }

        loginButton.disabled = true;
        buttonText.textContent = "Signing In...";

        try {

            const response = await loginUser({
                email,
                password
            });

            saveAuthSession(response);

            showAuthMessage(
                "Login successful. Redirecting...",
                "success"
            );

            setTimeout(() => {

                if (response.user.is_admin) {

                    window.location.href = "admin.html";

                } else {

                    window.location.href = "index.html";
                }

            }, 700);

        } catch (error) {

            console.error("Login error:", error);

            const verificationMessage =
                "Please verify your email before logging in.";

            if (error.message === verificationMessage) {

                localStorage.setItem(
                    "verificationEmail",
                    email
                );

                showAuthMessage(
                    "Your email is not verified. Redirecting to verification page...",
                    "error"
                );

                setTimeout(() => {
                    window.location.href =
                        "verify-email.html";
                }, 1000);

                return;
            }

            showAuthMessage(
                error.message || "Unable to login."
            );

        } finally {

            loginButton.disabled = false;
            buttonText.textContent = "Sign In";
        }

    });
}


const togglePasswordButton =
    document.getElementById("toggle-password");

if (togglePasswordButton) {

    togglePasswordButton.addEventListener("click", () => {

        const passwordInput =
            document.getElementById("login-password");

        const icon =
            togglePasswordButton.querySelector("i");

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);

        togglePasswordButton.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
}


// Register


const registerForm = document.getElementById("register-form");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullName = document
            .getElementById("register-fullname")
            .value.trim();

        const email = document
            .getElementById("register-email")
            .value.trim()
            .toLowerCase();

        const phone = document
            .getElementById("register-phone")
            .value.trim();

        const password = document
            .getElementById("register-password")
            .value;

        const confirmPassword = document
            .getElementById("register-confirm-password")
            .value;

        const button = document.getElementById("register-button");
        const buttonText = document.getElementById("register-button-text");

        if (!fullName || !email || !phone || !password || !confirmPassword) {

            showAuthMessage("Please fill all fields.");
            return;
        }

        if (password !== confirmPassword) {

            showAuthMessage("Passwords do not match.");
            return;
        }

        button.disabled = true;
        buttonText.textContent = "Creating Account...";

        try {

            await registerUser({
                full_name: fullName,
                email,
                phone,
                password,
                confirm_password: confirmPassword
            });

            localStorage.setItem(
                "verificationEmail",
                email
            );

            showAuthMessage(
                "Account created. Verification OTP sent to your email.",
                "success"
            );

            setTimeout(() => {
                window.location.href =
                    "verify-email.html";
            }, 1200);

        } catch (error) {

            console.error(error);

            showAuthMessage(
                error.message || "Registration failed."
            );

        } finally {

            button.disabled = false;
            buttonText.textContent = "Create Account";
        }

    });

}