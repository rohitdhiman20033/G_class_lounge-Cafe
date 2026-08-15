/*
CHECKOUT MODULE
*/

const checkoutModal = getElement("checkout-modal");
const successPopup = getElement("success-popup");
const nameInput = getElement("customer-name");
const phoneInput = getElement("customer-phone");
const placeOrderButton = getElement("place-order-button");

const CHECKOUT_LOGIN_URL =
    "login.html?next=index.html";


function clearCart() {
    cart = [];
    updateCart();
}


function openCheckout() {
    if (!cart?.length) {
        showError("Your cart is empty.");
        return;
    }

    if (!localStorage.getItem("accessToken")) {
        showError("Please login before checkout.");

        setTimeout(
            () => {
                window.location.href =
                    CHECKOUT_LOGIN_URL;
            },
            800
        );

        return;
    }

    if (!checkoutModal) {
        showError("Checkout is unavailable.");
        return;
    }

    fillCustomerDetails();

    checkoutModal.classList.remove(
        "hidden"
    );
}


function closeCheckout() {
    checkoutModal?.classList.add(
        "hidden"
    );
}


function fillCustomerDetails() {
    let user = null;

    try {
        user = JSON.parse(
            localStorage.getItem(
                "currentUser"
            )
        );
    } catch {
        localStorage.removeItem(
            "currentUser"
        );
    }

    if (!user) return;

    if (nameInput) {
        nameInput.value =
            user.full_name ||
            user.name ||
            user.username ||
            "";
    }

    if (phoneInput) {
        phoneInput.value =
            user.phone ||
            user.profile?.phone ||
            "";
    }
}


function validateCheckout() {
    const customerName =
        nameInput?.value.trim() || "";

    const phone =
        phoneInput?.value.trim() || "";

    if (!customerName) {
        nameInput?.focus();
        return "Please enter your name.";
    }

    if (
        !/^[6-9]\d{9}$/.test(phone)
    ) {
        phoneInput?.focus();

        return (
            "Enter a valid 10-digit mobile number."
        );
    }

    if (!cart?.length) {
        return "Your cart is empty.";
    }

    const invalidItem =
        cart.find(
            item =>
                !item.name ||
                Number(item.quantity) <= 0 ||
                Number(item.price) < 0
        );

    if (invalidItem) {
        return (
            "Cart contains an invalid item."
        );
    }

    return null;
}


function getOrderPayload() {
    return {
        customer_name:
            nameInput.value.trim(),

        phone:
            phoneInput.value.trim(),

        items:
            cart.map(item => ({
                menu_item_id:
                    Number(item.id),

                quantity:
                    Number(item.quantity)
            }))
    };
}


function setOrderLoading(
    loading
) {
    if (!placeOrderButton) return;

    placeOrderButton.disabled =
        loading;

    placeOrderButton.innerHTML =
        loading
            ? `
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                Placing Order...
            `
            : "Place Order";
}

async function openRazorpayPayment({
    orderId,
    customerName = "",
    phone = "",
    onSuccess = null
}) {
    if (typeof Razorpay === "undefined") {
        if (typeof showError === "function") {
            showError(
                "Payment service could not be loaded."
            );
        }

        return false;
    }

    try {
        const paymentOrder =
            await createPaymentOrder(
                orderId
            );

        const options = {
            key:
                paymentOrder.key_id,

            amount:
                paymentOrder.amount,

            currency:
                paymentOrder.currency,

            name:
                "G-Class Lounge",

            description:
                `Payment for Order #${orderId}`,

            order_id:
                paymentOrder.razorpay_order_id,

            prefill: {
                name:
                    customerName || "",

                contact:
                    phone || ""
            },

            notes: {
                local_order_id:
                    String(orderId)
            },

            theme: {},

            handler: async function (
                response
            ) {
                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        "Payment received. Finalizing your order...",
                        "success"
                    );
                }

                try {
                    const verification =
                        await verifyPayment({
                            razorpay_order_id:
                                response.razorpay_order_id,

                            razorpay_payment_id:
                                response.razorpay_payment_id,

                            razorpay_signature:
                                response.razorpay_signature
                        });

                    if (
                        typeof onSuccess ===
                        "function"
                    ) {
                        await onSuccess(
                            verification
                        );
                    }

                } catch (error) {
                    console.error(
                        "Payment verification failed:",
                        error
                    );

                    if (
                        typeof showError ===
                        "function"
                    ) {
                        showError(
                            error.message ||
                            (
                                "Payment was received, but " +
                                "verification failed. " +
                                "Please check your order."
                            )
                        );

                    } else if (
                        typeof showToast ===
                        "function"
                    ) {
                        showToast(
                            error.message ||
                            "Payment verification failed.",
                            "error"
                        );
                    }
                }
            },

            modal: {
                ondismiss: function () {
                    if (
                        typeof showError ===
                        "function"
                    ) {
                        showError(
                            (
                                "Payment was not completed. " +
                                `Order #${orderId} is still pending.`
                            )
                        );
                    } else if (
                        typeof showToast ===
                        "function"
                    ) {
                        showToast(
                            (
                                "Payment was not completed. " +
                                `Order #${orderId} is still pending.`
                            ),
                            "error"
                        );
                    }
                }
            }
        };


        const razorpayCheckout =
            new Razorpay(
                options
            );


        razorpayCheckout.on(
            "payment.failed",
            function (response) {
                const message =
                    response?.error?.description ||
                    (
                        "Payment failed. " +
                        "Please try again."
                    );

                if (
                    typeof showError ===
                    "function"
                ) {
                    showError(
                        message
                    );
                } else if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        message,
                        "error"
                    );
                }
            }
        );


        razorpayCheckout.open();

        return true;

    } catch (error) {
        console.error(
            "Payment start failed:",
            error
        );

        if (error.status === 401) {
            clearExpiredSession();

            if (
                typeof showError ===
                "function"
            ) {
                showError(
                    "Session expired. Please login again."
                );
            }

            setTimeout(
                () => {
                    window.location.href =
                        "login.html?next=index.html";
                },
                1000
            );

            return false;
        }


        if (
            typeof showError ===
            "function"
        ) {
            showError(
                error.message ||
                "Payment could not be started."
            );
        } else if (
            typeof showToast ===
            "function"
        ) {
            showToast(
                error.message ||
                "Payment could not be started.",
                "error"
            );
        }

        return false;
    }
}

async function placeOrder() {
    const validationError =
        validateCheckout();

    if (validationError) {
        showError(
            validationError
        );

        if (
            validationError ===
            "Your cart is empty."
        ) {
            closeCheckout();
        }

        return;
    }

    setOrderLoading(true);

    try {
        const createdOrder =
            await createOrder(
                getOrderPayload()
            );

        const started =
            await openRazorpayPayment({
                orderId:
                    createdOrder.id,

                customerName:
                    nameInput?.value.trim() ||
                    "",

                phone:
                    phoneInput?.value.trim() ||
                    "",

                onSuccess:
                    async function () {
                        clearCart();

                        closeCheckout();

                        if (nameInput) {
                            nameInput.value =
                                "";
                        }

                        if (phoneInput) {
                            phoneInput.value =
                                "";
                        }

                        showOrderSuccessPopup(
                            createdOrder
                        );
                    }
            });

        if (!started) {
            showError(
                (
                    "Order was created, but " +
                    "payment could not be started. " +
                    "You can retry payment from " +
                    "My Orders."
                )
            );
        }

    } catch (error) {
        if (error.status === 401) {
            clearExpiredSession();

            showError(
                "Session expired. Please login again."
            );

            setTimeout(
                () => {
                    window.location.href =
                        CHECKOUT_LOGIN_URL;
                },
                1000
            );

            return;
        }

        showError(
            error.message ||
            "Order could not be placed."
        );

    } finally {
        setOrderLoading(
            false
        );
    }
}

function showOrderSuccessPopup(
    order
) {
    if (!successPopup) {
        showSuccess(
            "Order placed successfully."
        );

        return;
    }

    setElementText(
        "success-order-id",
        order?.id
            ? `Order #${order.id}`
            : ""
    );

    successPopup.classList.remove(
        "hidden"
    );

    successPopup.classList.add(
        "flex"
    );
}


function closePopup() {
    successPopup?.classList.remove(
        "flex"
    );

    successPopup?.classList.add(
        "hidden"
    );
}