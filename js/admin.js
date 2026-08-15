// ADMIN PANEL STATE

let adminOrders = [];
let adminBookings = [];
let adminMenuItems = [];

let showAllAdminOrders = false;
let showAllAdminBookings = false;

// SECURITY HELPERS


function clearAdminSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
}


async function protectAdminPage() {
    const accessToken =
        localStorage.getItem("accessToken");

    if (!accessToken) {
        window.location.replace("login.html");
        return false;
    }

    try {
        const user =
            await apiRequest("/accounts/me/");

        if (user.is_admin !== true) {
            alert(
                "Access Denied. This page is only available to administrators."
            );

            window.location.replace("index.html");

            return false;
        }

        return true;

    } catch (error) {
        console.error(
            "Admin verification failed:",
            error
        );

        clearAdminSession();

        window.location.replace("login.html");

        return false;
    }
}



// GENERAL HELPERS


function escapeAdminHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatAdminPrice(value) {
    const price = Number(value || 0);

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }
    ).format(price);
}


function formatAdminDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeAdminHTML(value);
    }

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    );
}


function getOrderStatusClass(status) {
    switch (status) {
        case "Pending":
            return "text-yellow-400";

        case "Preparing":
            return "text-blue-400";

        case "Completed":
            return "text-green-400";

        case "Cancelled":
            return "text-red-400";

        default:
            return "text-gray-400";
    }
}

function getPaymentStatusClass(status) {
    const normalized =
        String(status || "")
            .trim()
            .toLowerCase();

    // Payment successful
    if (normalized === "paid") {
        return "text-green-400 bg-green-500/10 border-green-500/30";
    }

    // Refund successful
    if (
        normalized === "refunded" ||
        normalized === "processed"
    ) {
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }

    // Waiting / processing
    if (
        normalized === "created" ||
        normalized === "pending" ||
        normalized === "refund pending" ||
        normalized === "processing"
    ) {
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }

    // Payment/refund failure
    if (
        normalized === "failed" ||
        normalized === "refund failed"
    ) {
        return "text-red-400 bg-red-500/10 border-red-500/30";
    }

    return "text-gray-400 bg-gray-500/10 border-gray-500/30";
}


function showAdminToast(
    message,
    type = "success"
) {
    if (
        typeof showToast === "function"
    ) {
        showToast(message, type);
        return;
    }

    alert(message);
}


// ORDERS


function showOrdersLoading() {
    const container =
        document.getElementById(
            "orders-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
    <div
        class="col-span-full text-center py-14"
    >
        <i
            class="fa-solid fa-spinner fa-spin text-4xl text-[#D4AF37]"
        ></i>

        <p class="text-gray-400 mt-4">
            Loading orders...
        </p>
    </div>
    `;
}


function createOrderCard(order) {
    const customerName =
        escapeAdminHTML(
            order.customer_name ||
            "Customer"
        );

    const phone =
        escapeAdminHTML(
            order.phone || "—"
        );

    const status =
        escapeAdminHTML(
            order.status || "Pending"
        );

    const paymentStatus =
        escapeAdminHTML(
            order.payment_status || "Unpaid"
        );

    const paymentProvider =
        order.payment_provider
            ? escapeAdminHTML(
                order.payment_provider
            )
            : null;

    const refundStatus =
        escapeAdminHTML(
            order.refund_status || ""
        );

    const normalizedRefundStatus =
        String(
            order.refund_status || ""
        )
            .trim()
            .toLowerCase();

    const refundReason =
        order.refund_reason
            ? escapeAdminHTML(
                order.refund_reason
            )
            : "";

    const refundedAt =
        order.refunded_at || null;

    const hasRefund =
        [
            "pending",
            "processed",
            "failed"
        ].includes(
            normalizedRefundStatus
        );

    const refundLabel =
        normalizedRefundStatus === "processed"
            ? "Refunded"
            : normalizedRefundStatus === "pending"
                ? "Refund Pending"
                : normalizedRefundStatus === "failed"
                    ? "Refund Failed"
                    : "";

    const refundStatusClass =
        normalizedRefundStatus === "processed"
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
            : normalizedRefundStatus === "pending"
                ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                : normalizedRefundStatus === "failed"
                    ? "text-red-400 bg-red-500/10 border-red-500/30"
                    : "text-gray-400 bg-gray-500/10 border-gray-500/30";

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const orderItemsHTML =
        items.length
            ? items
                .map(item => `
                    <p class="mt-2">
                        <i
                            class="
                                fa-solid
                                fa-mug-hot
                                text-[#D4AF37]
                                mr-2
                            "
                        ></i>

                        ${escapeAdminHTML(
                            item.item_name
                        )}

                        × ${Number(
                            item.quantity || 0
                        )}
                    </p>
                `)
                .join("")
            : `
                <p class="text-gray-500">
                    No order items found.
                </p>
            `;

    const statusClass =
        getOrderStatusClass(
            order.status
        );

    const paymentStatusClass =
        getPaymentStatusClass(
            order.payment_status
        );

    const canMoveNext =
        order.status === "Pending" ||
        order.status === "Preparing";

    const statusButtonHTML =
        canMoveNext
            ? `
                <button
                    type="button"

                    onclick="
                        changeStatus(
                            ${Number(order.id)}
                        )
                    "

                    class="
                        bg-[#D4AF37]
                        text-black
                        px-4
                        py-2
                        rounded-lg
                        font-semibold
                        hover:scale-105
                        transition
                    "
                >
                    Next Status
                </button>
            `
            : `
                <button
                    type="button"
                    disabled

                    class="
                        bg-gray-700
                        text-gray-400
                        px-4
                        py-2
                        rounded-lg
                        cursor-not-allowed
                    "
                >
                    ${status}
                </button>
            `;

    const refundDetailsHTML =
        hasRefund
            ? `
                <div
                    class="
                        mt-5
                        rounded-2xl
                        border
                        ${refundStatusClass}
                        p-4
                    "
                >

                    <div
                        class="
                            flex
                            items-start
                            gap-3
                        "
                    >

                        <i
                            class="
                                fa-solid
                                ${
                                    normalizedRefundStatus === "processed"
                                        ? "fa-circle-check"
                                        : normalizedRefundStatus === "failed"
                                            ? "fa-circle-xmark"
                                            : "fa-clock"
                                }
                                mt-1
                            "
                        ></i>

                        <div>

                            <p
                                class="
                                    font-semibold
                                "
                            >
                                ${refundLabel}
                            </p>

                            ${
                                refundReason
                                    ? `
                                        <p
                                            class="
                                                text-gray-400
                                                text-sm
                                                mt-2
                                            "
                                        >
                                            Reason:
                                            ${refundReason}
                                        </p>
                                    `
                                    : ""
                            }

                            ${
                                refundedAt
                                    ? `
                                        <p
                                            class="
                                                text-gray-500
                                                text-xs
                                                mt-2
                                            "
                                        >
                                            Refunded on
                                            ${formatAdminDate(
                                                refundedAt
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                </div>
            `
            : "";

    return `
        <article
            class="
                bg-[#171412]
                p-8
                rounded-3xl
                border
                border-[#D4AF37]/20
                hover:border-[#D4AF37]/60
                transition
            "
        >

            <div
                class="
                    flex
                    justify-between
                    items-start
                    gap-4
                "
            >

                <div>

                    <h3
                        class="
                            text-2xl
                            text-white
                            font-bold
                        "
                    >
                        ${customerName}
                    </h3>

                    <p
                        class="
                            text-gray-400
                            mt-2
                        "
                    >
                        <i
                            class="
                                fa-solid
                                fa-phone
                                text-[#D4AF37]
                                mr-2
                            "
                        ></i>

                        ${phone}
                    </p>

                    <p
                        class="
                            text-gray-500
                            text-sm
                            mt-2
                        "
                    >
                        Order #${Number(order.id)}
                    </p>

                </div>


                <div
                    class="
                        flex
                        flex-col
                        items-end
                        gap-2
                    "
                >

                    <span
                        class="
                            ${statusClass}
                            bg-black/40
                            border
                            border-current/30
                            px-3
                            py-1
                            rounded-full
                            text-sm
                            font-semibold
                        "
                    >
                        ${status}
                    </span>


                    <span
                        class="
                            ${paymentStatusClass}
                            border
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                        "
                    >
                        Payment: ${paymentStatus}
                    </span>


                    ${
                        hasRefund
                            ? `
                                <span
                                    class="
                                        ${refundStatusClass}
                                        border
                                        px-3
                                        py-1
                                        rounded-full
                                        text-xs
                                        font-semibold
                                    "
                                >
                                    ${refundLabel}
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div
                class="
                    mt-6
                    text-gray-300
                    border-t
                    border-[#D4AF37]/10
                    pt-5
                "
            >
                ${orderItemsHTML}
            </div>


            <div
                class="
                    mt-6
                    border-t
                    border-[#D4AF37]/10
                    pt-5
                "
            >

                <p class="text-gray-400 text-sm">
                    Payment Details
                </p>

                <div
                    class="
                        flex
                        flex-wrap
                        gap-3
                        items-center
                        mt-2
                    "
                >

                    <span
                        class="
                            ${paymentStatusClass}
                            border
                            px-3
                            py-1
                            rounded-full
                            text-sm
                            font-semibold
                        "
                    >
                        ${paymentStatus}
                    </span>

                    ${
                        paymentProvider
                            ? `
                                <span
                                    class="
                                        text-gray-400
                                        text-sm
                                    "
                                >
                                    via ${paymentProvider}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${refundDetailsHTML}

            </div>


            <div
                class="
                    mt-6
                    flex
                    flex-wrap
                    justify-between
                    items-end
                    gap-4
                "
            >

                <div>

                    <p
                        class="
                            text-[#D4AF37]
                            text-xl
                            font-bold
                        "
                    >
                        Total:
                        ${formatAdminPrice(
                            order.total
                        )}
                    </p>

                    <p
                        class="
                            text-gray-500
                            text-sm
                            mt-2
                        "
                    >
                        ${formatAdminDate(
                            order.created_at
                        )}
                    </p>

                </div>

                ${statusButtonHTML}

            </div>


            <button
                type="button"

                onclick="
                    deleteOrder(
                        ${Number(order.id)}
                    )
                "

                class="
                    mt-6
                    bg-red-500
                    text-white
                    px-5
                    py-2
                    rounded-full
                    hover:bg-red-600
                    transition
                "
            >

                <i
                    class="
                        fa-solid
                        fa-trash
                        mr-2
                    "
                ></i>

                Delete Order

            </button>

        </article>
    `;
}

async function displayOrders(
    useExistingData = false
) {
    const container =
        document.getElementById(
            "orders-container"
        );

    if (!container) {
        return;
    }

    if (!useExistingData) {
        showOrdersLoading();

        try {
            const response =
                await getOrders();

            adminOrders =
                Array.isArray(response)
                    ? response
                    : [];

        } catch (error) {
            console.error(
                "Orders loading failed:",
                error
            );

            container.innerHTML = `
                <div
                    class="
                        col-span-full
                        text-center
                        text-red-400
                        py-14
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-triangle-exclamation
                            text-4xl
                        "
                    ></i>

                    <h3
                        class="
                            text-2xl
                            font-semibold
                            mt-4
                        "
                    >
                        Failed to load orders
                    </h3>

                    <button
                        type="button"
                        onclick="displayOrders()"
                        class="
                            mt-5
                            bg-[#D4AF37]
                            text-black
                            px-6
                            py-3
                            rounded-full
                            font-semibold
                        "
                    >
                        Try Again
                    </button>
                </div>
            `;

            return;
        }
    }

    if (!adminOrders.length) {
        container.innerHTML = `
            <div
                class="
                    col-span-full
                    text-center
                    text-gray-400
                    py-14
                "
            >
                <i
                    class="
                        fa-solid
                        fa-box-open
                        text-5xl
                        text-[#D4AF37]
                    "
                ></i>

                <h3 class="text-2xl mt-5">
                    No Orders Found
                </h3>
            </div>
        `;

        return;
    }

    const visibleOrders =
        showAllAdminOrders
            ? adminOrders
            : adminOrders.slice(0, 2);

    const cardsHTML =
        visibleOrders
            .map(createOrderCard)
            .join("");

    const buttonHTML =
        adminOrders.length > 2
            ? `
                <div
                    class="
                        col-span-full
                        flex
                        justify-center
                        mt-6
                    "
                >
                    <button
                        type="button"
                        onclick="toggleAdminOrders()"
                        class="
                            bg-[#D4AF37]
                            text-black
                            px-8
                            py-3
                            rounded-full
                            font-bold
                            hover:scale-105
                            transition
                        "
                    >
                        ${
                            showAllAdminOrders
                                ? "Show Less"
                                : `View All Orders (${adminOrders.length})`
                        }

                        <i
                            class="
                                fa-solid
                                ${
                                    showAllAdminOrders
                                        ? "fa-chevron-up"
                                        : "fa-chevron-down"
                                }
                                ml-2
                            "
                        ></i>
                    </button>
                </div>
            `
            : "";

    container.innerHTML =
        cardsHTML + buttonHTML;
}


function toggleAdminOrders() {
    showAllAdminOrders =
        !showAllAdminOrders;

    displayOrders(true);
}

async function deleteOrder(id) {
    const confirmed =
        confirm(
            "Are you sure you want to delete this order?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await deleteOrderAPI(id);

        adminOrders =
            adminOrders.filter(
                order =>
                    Number(order.id) !==
                    Number(id)
            );

        displayOrders(true);
        updateDashboard(true);

        showAdminToast(
            "Order deleted successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Order deletion failed:",
            error
        );

        showAdminToast(
            error.message ||
            "Unable to delete order.",
            "error"
        );
    }
}


async function changeStatus(id) {
    const order =
        adminOrders.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!order) {
        return;
    }

    const statusFlow = {
        Pending: "Preparing",
        Preparing: "Completed",
    };

    const newStatus =
        statusFlow[order.status];

    if (!newStatus) {
        return;
    }

    try {
        const updatedOrder =
            await updateOrder(
                id,
                {
                    status: newStatus,
                }
            );

        const orderIndex =
            adminOrders.findIndex(
                item =>
                    Number(item.id) ===
                    Number(id)
            );

        if (orderIndex !== -1) {
            adminOrders[orderIndex] =
                updatedOrder || {
                    ...order,
                    status: newStatus,
                };
        }

        displayOrders(true);
        updateDashboard(true);

        showAdminToast(
            `Order marked as ${newStatus}.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Order status update failed:",
            error
        );

        showAdminToast(
            error.message ||
            "Unable to update order status.",
            "error"
        );
    }
}



// DASHBOARD

function updateDashboard() {
    const orders =
        Array.isArray(adminOrders)
            ? adminOrders
            : [];

    const bookings =
        Array.isArray(adminBookings)
            ? adminBookings
            : [];

    const menuItems =
        Array.isArray(adminMenuItems)
            ? adminMenuItems
            : [];


     
    // ORDERS
     

    const totalOrders =
        orders.length;

    const pendingOrders =
        orders.filter(
            order =>
                String(
                    order.status || ""
                ).toLowerCase() === "pending"
        ).length;

    const completedOrders =
        orders.filter(
            order =>
                String(
                    order.status || ""
                ).toLowerCase() === "completed"
        ).length;


     
    // REVENUE ORDERS
     

    const revenueOrders =
        orders.filter(order => {
            const paymentStatus =
                String(
                    order.payment_status || ""
                )
                    .trim()
                    .toLowerCase();

            const refundStatus =
                String(
                    order.refund_status || ""
                )
                    .trim()
                    .toLowerCase();

            if (paymentStatus !== "paid") {
                return false;
            }

            if (refundStatus === "processed") {
                return false;
            }

            return true;
        });


     
    // TOTAL REVENUE
     

    const totalRevenue =
        revenueOrders.reduce(
            (total, order) => {
                const amount =
                    Number(order.total);

                if (
                    !Number.isFinite(amount)
                    || amount < 0
                ) {
                    return total;
                }

                return total + amount;
            },
            0
        );


     
    // ITEMS SOLD
     

    const totalItemsSold =
        revenueOrders.reduce(
            (orderTotal, order) => {
                const items =
                    Array.isArray(order.items)
                        ? order.items
                        : [];

                const quantityTotal =
                    items.reduce(
                        (itemTotal, item) => {
                            const quantity =
                                Number(
                                    item.quantity
                                );

                            if (
                                !Number.isFinite(
                                    quantity
                                ) ||
                                quantity <= 0
                            ) {
                                return itemTotal;
                            }

                            return (
                                itemTotal +
                                quantity
                            );
                        },
                        0
                    );

                return (
                    orderTotal +
                    quantityTotal
                );
            },
            0
        );


     
    // BOOKINGS
     

    const totalBookings =
        bookings.length;

    const pendingBookings =
        bookings.filter(
            booking =>
                String(
                    booking.status || ""
                ).toLowerCase() === "pending"
        ).length;


     
    // MENU
     

    const totalMenuItems =
        menuItems.length;

    const availableMenuItems =
        menuItems.filter(
            item =>
                item.available === true
        ).length;


     
    // ELEMENTS
     

    const totalOrdersElement =
        document.getElementById(
            "total-orders"
        );

    const pendingOrdersElement =
        document.getElementById(
            "pending-orders"
        );

    const completedOrdersElement =
        document.getElementById(
            "completed-orders"
        );

    const totalRevenueElement =
        document.getElementById(
            "total-revenue"
        );

    const itemsSoldElement =
        document.getElementById(
            "items-sold"
        );

    const totalBookingsElement =
        document.getElementById(
            "total-bookings"
        );

    const pendingBookingsElement =
        document.getElementById(
            "pending-bookings"
        );

    const totalMenuItemsElement =
        document.getElementById(
            "total-menu-items"
        );

    const availableMenuItemsElement =
        document.getElementById(
            "available-menu-items"
        );


     
    // UPDATE DASHBOARD
     

    if (totalOrdersElement) {
        totalOrdersElement.textContent =
            totalOrders;
    }

    if (pendingOrdersElement) {
        pendingOrdersElement.textContent =
            pendingOrders;
    }

    if (completedOrdersElement) {
        completedOrdersElement.textContent =
            completedOrders;
    }

    if (totalRevenueElement) {
        totalRevenueElement.textContent =
            formatAdminPrice(
                totalRevenue
            );
    }

    if (itemsSoldElement) {
        itemsSoldElement.textContent =
            totalItemsSold;
    }

    if (totalBookingsElement) {
        totalBookingsElement.textContent =
            totalBookings;
    }

    if (pendingBookingsElement) {
        pendingBookingsElement.textContent =
            pendingBookings;
    }

    if (totalMenuItemsElement) {
        totalMenuItemsElement.textContent =
            totalMenuItems;
    }

    if (availableMenuItemsElement) {
        availableMenuItemsElement.textContent =
            availableMenuItems;
    }
}


// BOOKINGS


function createBookingCard(booking) {

    const paymentStatus =
        escapeAdminHTML(
            booking.payment_status || "Unpaid"
        );

    const refundStatus =
        escapeAdminHTML(
            booking.refund_status || "None"
        );

    const paymentAmount =
        Number(
            booking.payment_amount || 500
        );

    const paymentId =
        booking.provider_payment_id
            ? escapeAdminHTML(
                booking.provider_payment_id
            )
            : "";

    const refundReason =
        booking.refund_reason
            ? escapeAdminHTML(
                booking.refund_reason
            )
            : "";

    const cancellationReason =
        booking.cancellation_reason
            ? escapeAdminHTML(
                booking.cancellation_reason
            )
            : "";

    const normalizedPaymentStatus =
        String(
            booking.payment_status || ""
        )
            .trim()
            .toLowerCase();

    const normalizedRefundStatus =
        String(
            booking.refund_status || ""
        )
            .trim()
            .toLowerCase();


     
    // PAYMENT STATUS COLOR
     

    const paymentClass =
        normalizedPaymentStatus === "paid"
            ? "text-green-400 bg-green-500/10 border-green-500/30"
            : normalizedPaymentStatus === "failed"
                ? "text-red-400 bg-red-500/10 border-red-500/30"
                : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";


     
    // REFUND STATUS COLOR
     

    const refundClass =
        normalizedRefundStatus === "processed"
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
            : normalizedRefundStatus === "pending"
                ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                : normalizedRefundStatus === "failed"
                    ? "text-red-400 bg-red-500/10 border-red-500/30"
                    : "text-gray-400 bg-gray-500/10 border-gray-500/30";


     
    // DESCRIPTION
     

    const descriptionHTML =
        booking.description
            ? `
                <p class="text-gray-400 mt-2">
                    <strong class="text-gray-300">
                        Note:
                    </strong>

                    ${escapeAdminHTML(
                        booking.description
                    )}
                </p>
            `
            : "";


     
    // CANCELLATION DETAILS
     

    const cancellationHTML =
        booking.status === "Cancelled"
            ? `
                <div
                    class="
                        mt-5
                        border
                        border-red-500/30
                        bg-red-500/5
                        rounded-xl
                        p-4
                    "
                >
                    <p class="text-red-400 font-semibold">
                        <i
                            class="
                                fa-solid
                                fa-circle-xmark
                                mr-2
                            "
                        ></i>

                        Booking Cancelled
                    </p>

                    ${
                        cancellationReason
                            ? `
                                <p class="text-gray-400 text-sm mt-2">
                                    <strong>Reason:</strong>
                                    ${cancellationReason}
                                </p>
                            `
                            : ""
                    }

                    ${
                        booking.cancelled_at
                            ? `
                                <p class="text-gray-500 text-xs mt-2">
                                    ${formatAdminDate(
                                        booking.cancelled_at
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>
            `
            : "";


     
    // REFUND DETAILS
     

    const refundHTML =
        normalizedRefundStatus !== "" &&
        normalizedRefundStatus !== "none"
            ? `
                <div
                    class="
                        mt-4
                        border
                        ${refundClass}
                        rounded-xl
                        p-4
                    "
                >
                    <p class="font-semibold">
                        <i
                            class="
                                fa-solid
                                fa-rotate-left
                                mr-2
                            "
                        ></i>

                        Refund ${refundStatus}
                    </p>

                    ${
                        refundReason
                            ? `
                                <p class="text-gray-400 text-sm mt-2">
                                    <strong>Reason:</strong>
                                    ${refundReason}
                                </p>
                            `
                            : ""
                    }

                    ${
                        booking.refunded_at
                            ? `
                                <p class="text-gray-500 text-xs mt-2">
                                    ${formatAdminDate(
                                        booking.refunded_at
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>
            `
            : "";


     
    // CARD
     

    return `
        <article
            class="
                bg-[#171412]
                border
                border-[#D4AF37]/30
                rounded-2xl
                p-7
            "
        >

            <div
                class="
                    flex
                    flex-col
                    md:flex-row
                    md:justify-between
                    gap-6
                "
            >

                <!-- CUSTOMER DETAILS -->

                <div class="flex-1">

                    <h3
                        class="
                            text-2xl
                            text-white
                            font-bold
                        "
                    >
                        ${escapeAdminHTML(
                            booking.name
                        )}
                    </h3>


                    <p class="text-gray-500 text-sm mt-2">
                        Booking #${Number(
                            booking.id
                        )}
                    </p>


                    <p class="text-gray-400 mt-4">

                        <strong class="text-gray-300">
                            Phone:
                        </strong>

                        ${escapeAdminHTML(
                            booking.phone
                        )}

                    </p>


                    <p class="text-gray-400 mt-2">

                        <strong class="text-gray-300">
                            Date:
                        </strong>

                        ${escapeAdminHTML(
                            booking.date
                        )}

                    </p>


                    <p class="text-gray-400 mt-2">

                        <strong class="text-gray-300">
                            Time:
                        </strong>

                        ${escapeAdminHTML(
                            booking.time
                        )}

                    </p>


                    <p class="text-gray-400 mt-2">

                        <strong class="text-gray-300">
                            Guests:
                        </strong>

                        ${Number(
                            booking.guests || 0
                        )}

                    </p>


                    ${descriptionHTML}

                </div>


                <!-- BOOKING STATUS -->

                <div
                    class="
                        flex
                        flex-col
                        gap-4
                        md:items-end
                    "
                >

                    <label
                        class="
                            text-gray-400
                            text-sm
                        "
                    >
                        Booking Status
                    </label>


                    <select
                        onchange="
                            updateBookingStatus(
                                ${Number(booking.id)},
                                this.value
                            )
                        "

                        class="
                            bg-[#0f0f0f]
                            border
                            border-[#D4AF37]/40
                            text-white
                            rounded-xl
                            px-4
                            py-3
                            outline-none
                        "
                    >

                        <option
                            value="Pending"
                            ${
                                booking.status === "Pending"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Pending
                        </option>


                        <option
                            value="Confirmed"
                            ${
                                booking.status === "Confirmed"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Confirmed
                        </option>


                        <option
                            value="Completed"
                            ${
                                booking.status === "Completed"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Completed
                        </option>


                        <option
                            value="Cancelled"
                            ${
                                booking.status === "Cancelled"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Cancelled
                        </option>

                    </select>

                </div>

            </div>


            <!-- PAYMENT DETAILS -->

            <div
                class="
                    mt-6
                    pt-5
                    border-t
                    border-[#D4AF37]/20
                "
            >

                <h4
                    class="
                        text-[#D4AF37]
                        font-semibold
                        text-lg
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-credit-card
                            mr-2
                        "
                    ></i>

                    Advance Payment
                </h4>


                <div
                    class="
                        mt-4
                        flex
                        flex-wrap
                        gap-3
                        items-center
                    "
                >

                    <span
                        class="
                            text-white
                            font-semibold
                        "
                    >
                        ₹${paymentAmount.toFixed(2)}
                    </span>


                    <span
                        class="
                            ${paymentClass}
                            border
                            px-3
                            py-1
                            rounded-full
                            text-sm
                            font-semibold
                        "
                    >
                        Payment: ${paymentStatus}
                    </span>


                    <span
                        class="
                            ${refundClass}
                            border
                            px-3
                            py-1
                            rounded-full
                            text-sm
                            font-semibold
                        "
                    >
                        Refund: ${refundStatus}
                    </span>

                </div>


                ${
                    paymentId
                        ? `
                            <p
                                class="
                                    text-gray-400
                                    text-sm
                                    mt-4
                                    break-all
                                "
                            >
                                <strong class="text-gray-300">
                                    Razorpay Payment ID:
                                </strong>

                                ${paymentId}
                            </p>
                        `
                        : ""
                }


                ${
                    booking.paid_at
                        ? `
                            <p
                                class="
                                    text-gray-500
                                    text-xs
                                    mt-2
                                "
                            >
                                Paid:
                                ${formatAdminDate(
                                    booking.paid_at
                                )}
                            </p>
                        `
                        : ""
                }


                ${refundHTML}

            </div>


            ${cancellationHTML}


            ${
                booking.created_at
                    ? `
                        <p
                            class="
                                text-gray-500
                                text-xs
                                mt-5
                            "
                        >
                            Booking created:
                            ${formatAdminDate(
                                booking.created_at
                            )}
                        </p>
                    `
                    : ""
            }

        </article>
    `;
}

async function displayBookings(
    useExistingData = false
) {
    const container =
        document.getElementById(
            "booking-container"
        );

    if (!container) {
        return;
    }

    if (!useExistingData) {
        container.innerHTML = `
            <div
                class="
                    col-span-full
                    text-center
                    text-gray-400
                    py-12
                "
            >
                <i
                    class="
                        fa-solid
                        fa-spinner
                        fa-spin
                        text-4xl
                        text-[#D4AF37]
                    "
                ></i>

                <p class="mt-4">
                    Loading bookings...
                </p>
            </div>
        `;

        try {
            const response =
                await getMyBookings();

            adminBookings =
                Array.isArray(response)
                    ? response
                    : [];

        } catch (error) {
            console.error(
                "Bookings loading failed:",
                error
            );

            container.innerHTML = `
                <div
                    class="
                        col-span-full
                        text-center
                        text-red-400
                        py-12
                    "
                >
                    Failed to load bookings.
                </div>
            `;

            return;
        }
    }

    if (!adminBookings.length) {
        container.innerHTML = `
            <div
                class="
                    col-span-full
                    text-center
                    text-gray-400
                    py-12
                "
            >
                <i
                    class="
                        fa-regular
                        fa-calendar-xmark
                        text-5xl
                        text-[#D4AF37]
                    "
                ></i>

                <h3
                    class="
                        text-2xl
                        font-semibold
                        mt-5
                    "
                >
                    No Bookings Found
                </h3>
            </div>
        `;

        return;
    }

    const visibleBookings =
        showAllAdminBookings
            ? adminBookings
            : adminBookings.slice(0, 2);

    const cardsHTML =
        visibleBookings
            .map(createBookingCard)
            .join("");

    const buttonHTML =
        adminBookings.length > 2
            ? `
                <div
                    class="
                        col-span-full
                        flex
                        justify-center
                        mt-6
                    "
                >
                    <button
                        type="button"
                        onclick="toggleAdminBookings()"
                        class="
                            bg-[#D4AF37]
                            text-black
                            px-8
                            py-3
                            rounded-full
                            font-bold
                            hover:scale-105
                            transition
                        "
                    >
                        ${
                            showAllAdminBookings
                                ? "Show Less"
                                : `View All Bookings (${adminBookings.length})`
                        }

                        <i
                            class="
                                fa-solid
                                ${
                                    showAllAdminBookings
                                        ? "fa-chevron-up"
                                        : "fa-chevron-down"
                                }
                                ml-2
                            "
                        ></i>
                    </button>
                </div>
            `
            : "";

    container.innerHTML =
        cardsHTML + buttonHTML;
}


function toggleAdminBookings() {
    showAllAdminBookings =
        !showAllAdminBookings;

    displayBookings(true);
}


async function updateBookingStatus(
    id,
    status
) {
    try {
        const updatedBooking =
            await updateBooking(
                id,
                {
                    status,
                }
            );

        const bookingIndex =
            adminBookings.findIndex(
                booking =>
                    Number(booking.id) ===
                    Number(id)
            );

        if (bookingIndex !== -1) {
            adminBookings[bookingIndex] =
                updatedBooking || {
                    ...adminBookings[
                    bookingIndex
                    ],
                    status,
                };
        }

        displayBookings(true);

        showAdminToast(
            `Booking ${status.toLowerCase()} successfully.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Booking status update failed:",
            error
        );

        showAdminToast(
            error.message ||
            "Unable to update booking status.",
            "error"
        );

        displayBookings(true);
    }
}



// MENU ITEMS (BACKEND READ-ONLY)


function createAdminMenuCard(item) {
    const image =
        escapeAdminHTML(
            item.image ||
            "images/logo chai.jpeg"
        );

    return `
    <article
        class="
                    bg-[#171412]
                    border
                    border-[#D4AF37]/20
                    rounded-3xl
                    overflow-hidden
                "
    >
        <img
            src="${image}"
            alt="${escapeAdminHTML(
        item.name
    )}"
            onerror="
                        this.onerror=null;
                        this.src='images/logo chai.jpeg';
                    "
            class="
                        w-full
                        h-60
                        object-cover
                    "
        >

            <div class="p-5">
                <h3
                    class="
                            text-2xl
                            text-white
                            font-bold
                        "
                >
                    ${escapeAdminHTML(
        item.name
    )}
                </h3>

                <p
                    class="
                            text-[#D4AF37]
                            font-bold
                            text-xl
                            mt-3
                        "
                >
                    ${formatAdminPrice(
        item.price
    )}
                </p>

                <p class="text-gray-400 mt-2">
                    Category:
                    ${escapeAdminHTML(
        item.category
    )}
                </p>

                <p
                    class="
                            mt-2
                            ${Number(item.stock) > 0
            ? "text-green-400"
            : "text-red-400"
        }
                "
                    >
                ${Number(item.stock) > 0
            ? "Available"
            : "Out of Stock"
        }
            </p>

            <a
                href="http://127.0.0.1:9001/admin/menu/menuitem/${Number(item.id)}/change/"
                target="_blank"
                rel="noopener noreferrer"
                class="
                            inline-flex
                            items-center
                            mt-5
                            bg-[#D4AF37]
                            text-black
                            px-5
                            py-2
                            rounded-full
                            font-semibold
                            hover:scale-105
                            transition
                        "
            >
                <i
                    class="
                                fa-solid
                                fa-pen-to-square
                                mr-2
                            "
                ></i>

                Edit in Django Admin
            </a>
        </div>
    </article>
    `;
}


async function displayMenuItems() {
    const container =
        document.getElementById(
            "menu-items-container"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
    <div
        class="
                    col-span-full
                    text-center
                    py-12
                "
    >
        <i
            class="
                        fa-solid
                        fa-spinner
                        fa-spin
                        text-4xl
                        text-[#D4AF37]
                    "
        ></i>

        <p class="text-gray-400 mt-4">
            Loading menu items...
        </p>
    </div>
    `;

    try {
        const response =
            await getMenuItems();

        adminMenuItems =
            Array.isArray(response)
                ? response
                : [];

    } catch (error) {
        console.error(
            "Menu loading failed:",
            error
        );

        container.innerHTML = `
    <p
        class="
                        text-red-400
                        text-xl
                        col-span-full
                        text-center
                        py-12
                    "
    >
        Failed to load menu items.
    </p>
    `;

        return;
    }

    if (!adminMenuItems.length) {
        container.innerHTML = `
                <p
                    class="
                        text-gray-400
                        text-xl
                        col-span-full
                        text-center
                        py-12
                    "
                >
                    No Menu Items Found
                </p>
            `;

        return;
    }

    container.innerHTML =
        adminMenuItems
            .map(createAdminMenuCard)
            .join("");
}



// CURRENT ADD/DELETE MENU BUTTONS

function openAddItemModal() {
    

    window.open(
        "http://127.0.0.1:9001/admin/menu/menuitem/add/",
        "_blank",
        "noopener,noreferrer"
    );
}


function closeAddItemModal() {
    const modal =
        document.getElementById(
            "add-item-modal"
        );

    modal?.classList.add("hidden");
}


function saveNewItem() {
    alert(
        "Menu items must be added through Django Admin. The backend CRUD dashboard will be added next."
    );
}


function deleteMenuItem() {
    alert(
        "Open the item in Django Admin to delete it safely."
    );
}


function scrollToMenuItems() {
    document.getElementById(
        "menu-items-section"
    )?.scrollIntoView({
        behavior: "smooth",
    });
}



// INITIALIZE ADMIN PANEL


document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const allowed =
            await protectAdminPage();

        if (!allowed) {
            return;
        }

        

        try {
            const response =
                await getOrders();

            adminOrders =
                Array.isArray(response)
                    ? response
                    : [];

            displayOrders(true);
            updateDashboard(true);

        } catch (error) {
            console.error(
                "Initial order loading failed:",
                error
            );

            await displayOrders();
            await updateDashboard();
        }

        await Promise.all([
            displayBookings(),
            displayMenuItems(),
        ]);
    }
);
