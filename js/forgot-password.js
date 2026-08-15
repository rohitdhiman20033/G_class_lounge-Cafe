function showForgotPasswordMessage(
    message,
    type = "error"
) {

    const messageBox = document.getElementById(
        "forgot-password-message"
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


const forgotPasswordForm =
    document.getElementById(
        "forgot-password-form"
    );


if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const email =
                document
                    .getElementById(
                        "forgot-password-email"
                    )
                    .value
                    .trim()
                    .toLowerCase();

            const button =
                document.getElementById(
                    "forgot-password-button"
                );

            const buttonText =
                document.getElementById(
                    "forgot-password-button-text"
                );

            if (!email) {

                showForgotPasswordMessage(
                    "Please enter your email address."
                );

                return;

            }

            button.disabled = true;

            buttonText.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin mr-2"></i>
                Sending OTP...`;

            try {

                await forgotPassword(email);

                localStorage.setItem(
                    "resetEmail",
                    email
                );

                showForgotPasswordMessage(
                    "OTP sent successfully. Redirecting...",
                    "success"
                );

                setTimeout(() => {

                    window.location.href =
                        "verify-otp.html";

                }, 1200);

            } catch (error) {

                console.error(error);

                showForgotPasswordMessage(
                    error.message ||
                    "Unable to send OTP."
                );

            } finally {

                button.disabled = false;

                buttonText.innerHTML =
                    `<i class="fa-solid fa-paper-plane mr-2"></i>
                    Send Verification OTP`;

            }

        }
    );

}