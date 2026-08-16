const API_BASE_URL = "https://g-class-lounge-cafe.onrender.com/api";



async function getMenuItems() {

    return await apiRequest("/menu/", {
        skipAuth: true
    });

}

// Orders API


async function createOrder(orderData) {

    return await apiRequest("/orders/", {
        method: "POST",
        body: JSON.stringify(orderData)
    });

}

async function createPaymentOrder(orderId) {
    return await apiRequest(
        `/payments/create/${orderId}/`,
        {
            method: "POST",
            body: JSON.stringify({})
        }
    );
}


async function verifyPayment(paymentData) {
    return await apiRequest(
        "/payments/verify/",
        {
            method: "POST",
            body: JSON.stringify(paymentData)
        }
    );
}

async function getOrders() {

    return await apiRequest("/orders/");

}

async function getOrdersByPhone(phone) {

    return await apiRequest(`/orders/?phone=${phone}`);

}

// Bookings API

async function createBooking(bookingData) {

    return await apiRequest("/bookings/", {
        method: "POST",
        body: JSON.stringify(bookingData)
    });

}

async function getBookingsByPhone(phone) {

    return await apiRequest(`/bookings/?phone=${phone}`);

}

async function apiRequest(endpoint, options = {}) {
    const {
        skipAuth = false,
        retry = true,
        headers: customHeaders = {},
        ...fetchOptions
    } = options;

    const accessToken = localStorage.getItem("accessToken");

    const headers = {
        ...customHeaders
    };

    const isFormData =
        fetchOptions.body instanceof FormData;

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }


    if (accessToken && !skipAuth) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers
        });
    } catch (error) {
        throw new Error("Backend server is not reachable");
    }

    /*
     
    ACCESS TOKEN EXPIRED → REFRESH TOKEN
     
    */

    if (
        response.status === 401 &&
        !skipAuth &&
        retry
    ) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            return apiRequest(endpoint, {
                ...options,
                retry: false
            });
        }

        clearExpiredSession();

        throw new Error(
            "Session expired. Please login again."
        );
    }

    if (response.status === 204) {
        return null;
    }

    let responseData = {};

    try {
        responseData = await response.json();
    } catch {
        responseData = {};
    }

    if (!response.ok) {
        console.error(
            "API Validation Error:",
            responseData
        );

        function getFirstError(value) {
            if (Array.isArray(value)) {
                return value[0];
            }

            if (typeof value === "string") {
                return value;
            }

            return null;
        }

        const firstError =
            getFirstError(responseData.detail) ||
            getFirstError(responseData.non_field_errors) ||
            getFirstError(responseData.email) ||
            getFirstError(responseData.otp) ||
            getFirstError(responseData.current_password) ||
            getFirstError(responseData.new_password) ||
            getFirstError(responseData.password) ||
            getFirstError(responseData.confirm_password) ||
            getFirstError(responseData.username) ||
            getFirstError(responseData.phone) ||
            getFirstError(responseData.full_name) ||
            `Request failed with status ${response.status}`;

        const error = new Error(firstError);

        error.status = response.status;
        error.data = responseData;

        throw error;
    }

    return responseData;
}

async function refreshAccessToken() {
    const refreshToken =
        localStorage.getItem("refreshToken");

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/accounts/token/refresh/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        if (!data.access) {
            return false;
        }

        localStorage.setItem(
            "accessToken",
            data.access
        );

        // Rotated refresh token support
        if (data.refresh) {
            localStorage.setItem(
                "refreshToken",
                data.refresh
            );
        }

        console.log(
            "✅ Access token refreshed"
        );

        return true;

    } catch (error) {
        console.error(
            "Token refresh failed:",
            error
        );

        return false;
    }
}


function clearExpiredSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
}

async function updateOrder(id, data) {

    return await apiRequest(`/orders/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

}

async function deleteOrderAPI(id) {

    return await apiRequest(`/orders/${id}/`, {
        method: "DELETE"
    });

}

async function getBookings() {

    return await apiRequest("/bookings/");

}

async function getMyBookings() {
    return await apiRequest("/bookings/");
}

async function updateBooking(id, data) {

    return await apiRequest(`/bookings/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

}

async function createBooking(data) {
    return await apiRequest("/bookings/", {
        method: "POST",
        body: JSON.stringify(data)
    });
}


// Authentication API


async function registerUser(userData) {

    return await apiRequest("/accounts/register/", {
        method: "POST",
        body: JSON.stringify(userData),
        skipAuth: true
    });

}


async function loginUser(loginData) {

    return await apiRequest("/accounts/login/", {
        method: "POST",
        body: JSON.stringify(loginData),
        skipAuth: true
    });

}


// PROFILE API


async function getCurrentUser() {
    return await apiRequest("/accounts/me/");
}


async function updateCurrentUserProfile(formData) {
    return await apiRequest("/accounts/me/", {
        method: "PATCH",
        body: formData
    });
}

async function changePassword(passwordData) {
    return await apiRequest("/accounts/change-password/", {
        method: "POST",
        body: JSON.stringify(passwordData)
    });
}


// FORGOT PASSWORD API


async function forgotPassword(email) {

    return await apiRequest(
        "/accounts/forgot-password/",
        {
            method: "POST",

            body: JSON.stringify({
                email
            }),

            skipAuth: true,
        }
    );

}


async function verifyResetOTP(data) {

    return await apiRequest(
        "/accounts/verify-reset-otp/",
        {
            method: "POST",

            body: JSON.stringify(data),

            skipAuth: true,
        }
    );

}


async function resetPassword(data) {

    return await apiRequest(
        "/accounts/reset-password/",
        {
            method: "POST",

            body: JSON.stringify(data),

            skipAuth: true,
        }
    );

}

async function verifyEmail(data) {
    return await apiRequest(
        "/accounts/verify-email/",
        {
            method: "POST",
            body: JSON.stringify(data),
            skipAuth: true
        }
    );
}

async function resendVerificationOTP(email) {
    return await apiRequest(
        "/accounts/resend-verification-otp/",
        {
            method: "POST",
            body: JSON.stringify({
                email
            }),
            skipAuth: true
        }
    );
}


// WISHLIST API


async function getWishlist() {

    return await apiRequest("/wishlist/");

}


async function addToWishlist(menuItemId) {

    return await apiRequest("/wishlist/", {
        method: "POST",

        body: JSON.stringify({
            menu_item_id: menuItemId
        })
    });

}


async function removeWishlistItem(id) {

    return await apiRequest(`/wishlist/${id}/`, {
        method: "DELETE"
    });

}


// REVIEWS


async function getReviews() {

    return apiRequest(
        "/reviews/"
    );

}


async function createReview(
    reviewData
) {

    return apiRequest(
        "/reviews/",
        {
            method: "POST",
            body: JSON.stringify(
                reviewData
            ),
            
        }
    );

}

async function getEvents() {
    return apiRequest(
        "/events/",
        {
            skipAuth: true
        }
    );
}



async function getGalleryImages() {

    return apiRequest(
        "/gallery/",
        {
            skipAuth: true
        }
    );

}

async function getContactInfo() {
    return apiRequest(
        "/contact/",
        {
            skipAuth: true
        }
    );
}

async function sendContactMessage(data) {
    return apiRequest(
        "/contact/messages/",
        {
            method: "POST",
            skipAuth: true,
            body: JSON.stringify(data)
        }
    );
}

async function getAboutSection() {

    return apiRequest(
        "/website/about/",
        {
            skipAuth: true
        }
    );

}

async function getHeroSection() {

    return apiRequest(
        "/website/hero/",
        {
            skipAuth: true
        }
    );

}

async function getWebsiteSettings() {

    return apiRequest(
        "/website/settings/",
        {
            skipAuth: true
        }
    );

}

async function cancelOrder(orderId, reason) {
    return await apiRequest(
        `/orders/${orderId}/cancel/`,
        {
            method: "POST",
            body: JSON.stringify({
                reason
            })
        }
    );
}

async function cancelBooking(bookingId, reason) {
    return await apiRequest(
        `/bookings/${bookingId}/cancel/`,
        {
            method: "POST",
            body: JSON.stringify({
                reason
            })
        }
    );
}

async function hideOrder(orderId) {

    return await apiRequest(
        `/orders/${orderId}/hide/`,
        {
            method: "POST"
        }
    );
}

async function hideBooking(bookingId) {

    return await apiRequest(
        `/bookings/${bookingId}/hide/`,
        {
            method: "POST"
        }
    );
}

async function createBookingPaymentOrder(bookingId) {
    return await apiRequest(
        `/payments/booking/create/${bookingId}/`,
        {
            method: "POST",
            body: JSON.stringify({})
        }
    );
}

async function verifyBookingPayment(paymentData) {
    return await apiRequest(
        "/payments/booking/verify/",
        {
            method: "POST",
            body: JSON.stringify(paymentData)
        }
    );
}