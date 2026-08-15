const bookingForm = document.getElementById("booking-form");

const bookingFields = {
    name: document.getElementById("name"),
    phone: document.getElementById("phone"),
    date: document.getElementById("date"),
    time: document.getElementById("time"),
    guests: document.getElementById("guests"),
    description: document.getElementById("description")
};

const BOOKING_LOGIN_URL = "login.html?next=index.html#booking";

let bookingPaymentInProgress = false;


function setBookingLoading(loading) {
    const button = bookingForm?.querySelector(
        'button[type="submit"]'
    );

    if (!button) return;

    button.disabled = loading;

    button.innerHTML = loading
        ? '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...'
        : "Pay ₹500 & Reserve Table";
}


function getBookingData() {
    return {
        name: bookingFields.name?.value.trim() || "",
        phone: bookingFields.phone?.value.trim() || "",
        date: bookingFields.date?.value || "",
        time: bookingFields.time?.value || "",
        guests: Number(bookingFields.guests?.value || 0),
        description: bookingFields.description?.value.trim() || ""
    };
}


function validateBooking(data) {
    if (!data.name) {
        bookingFields.name?.focus();
        return "Please enter your name.";
    }

    if (!/^[6-9]\d{9}$/.test(data.phone)) {
        bookingFields.phone?.focus();
        return "Enter a valid 10-digit mobile number.";
    }

    if (!data.date) {
        bookingFields.date?.focus();
        return "Please select a booking date.";
    }

    if (!data.time) {
        bookingFields.time?.focus();
        return "Please select a booking time.";
    }

    if (data.guests < 1 || data.guests > 20) {
        bookingFields.guests?.focus();
        return "Please select between 1 and 20 guests.";
    }

    const bookingDateTime = new Date(
        `${data.date}T${data.time}`
    );

    if (
        Number.isNaN(bookingDateTime.getTime()) ||
        bookingDateTime <= new Date()
    ) {
        bookingFields.date?.focus();
        return "Please select a future date and time.";
    }

    return null;
}


function clearBookingSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
}


function openBookingPayment(paymentOrder, booking) {
    return new Promise((resolve, reject) => {
        if (typeof Razorpay === "undefined") {
            reject(
                new Error(
                    "Payment gateway could not be loaded."
                )
            );
            return;
        }

        const options = {
            key: paymentOrder.key_id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,

            name: "G-Class Lounge",
            description: "₹500 Table Booking Advance",

            order_id: paymentOrder.razorpay_order_id,

            prefill: {
                name: booking.name,
                contact: booking.phone
            },

            notes: {
                local_booking_id: String(booking.id),
                payment_type: "booking_advance"
            },

            theme: {
                color: "#D4AF37"
            },

            handler: async function (response) {
                try {
                    const result = await verifyBookingPayment({
                        razorpay_order_id:
                            response.razorpay_order_id,

                        razorpay_payment_id:
                            response.razorpay_payment_id,

                        razorpay_signature:
                            response.razorpay_signature
                    });

                    resolve(result);

                } catch (error) {
                    reject(error);
                }
            },

            modal: {
                ondismiss: function () {
                    reject(
                        new Error("Payment cancelled.")
                    );
                }
            }
        };

        const razorpay = new Razorpay(options);

        razorpay.on(
            "payment.failed",
            function (response) {
                const description =
                    response?.error?.description;

                reject(
                    new Error(
                        description || "Payment failed."
                    )
                );
            }
        );

        razorpay.open();
    });
}


async function handleBookingSubmit(event) {
    event.preventDefault();

    if (bookingPaymentInProgress) {
        return;
    }

    if (!localStorage.getItem("accessToken")) {
        showToast(
            "Please login before booking a table.",
            "error"
        );

        setTimeout(() => {
            window.location.href = BOOKING_LOGIN_URL;
        }, 800);

        return;
    }

    const bookingData = getBookingData();

    const validationError = validateBooking(
        bookingData
    );

    if (validationError) {
        showToast(validationError, "error");
        return;
    }

    bookingPaymentInProgress = true;
    setBookingLoading(true);

    try {
        // STEP 1: Create Pending booking
        const booking = await createBooking(
            bookingData
        );

        if (!booking || !booking.id) {
            throw new Error(
                "Booking could not be created."
            );
        }

        // STEP 2: Create Razorpay order
        const paymentOrder =
            await createBookingPaymentOrder(
                booking.id
            );

        if (
            !paymentOrder ||
            !paymentOrder.razorpay_order_id
        ) {
            throw new Error(
                "Booking payment could not be started."
            );
        }

        // STEP 3: Open Razorpay checkout
        await openBookingPayment(
            paymentOrder,
            booking
        );

        // STEP 4: Payment verified successfully
        bookingForm.reset();

        showToast(
            "₹500 advance paid. Your table is confirmed.",
            "success"
        );

        setTimeout(() => {
            window.location.href =
                "myorders.html";
        }, 1200);

    } catch (error) {
        console.error(
            "Booking/payment failed:",
            error
        );

        if (error.status === 401) {
            clearBookingSession();

            showToast(
                "Session expired. Please login again.",
                "error"
            );

            setTimeout(() => {
                window.location.href =
                    BOOKING_LOGIN_URL;
            }, 1000);

            return;
        }

        if (error.message === "Payment cancelled.") {
            showToast(
                "Payment cancelled. Your booking remains pending.",
                "error"
            );

            return;
        }

        showToast(
            error.message ||
                "Table booking payment failed.",
            "error"
        );

    } finally {
        bookingPaymentInProgress = false;
        setBookingLoading(false);
    }
}


bookingForm?.addEventListener(
    "submit",
    handleBookingSubmit
);