let myOrders = [];
let myBookings = [];

let showAllOrders = false;
let showAllBookings = false;

let cancellingOrderId = null;
let cancellingBookingId = null;

const ordersList = document.getElementById("orders-list");
const bookingsList = document.getElementById("bookings-list");

// HELPERS

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(+value) ? +value : 0);

const date = (value) => {
  if (!value) {
    return "—";
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return esc(value);
  }

  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function statusClass(status) {
  return (
    {
      Pending: "bg-yellow-400/20 text-yellow-400",

      Preparing: "bg-blue-400/20 text-blue-400",

      Completed: "bg-green-400/20 text-green-400",

      Confirmed: "bg-green-400/20 text-green-400",

      Cancelled: "bg-red-400/20 text-red-400",
    }[status] || "bg-gray-500/20 text-gray-400"
  );
}

function paymentStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid") {
    return "bg-green-400/20 text-green-400";
  }

  if (normalized === "created" || normalized === "pending") {
    return "bg-yellow-400/20 text-yellow-400";
  }

  if (normalized === "failed") {
    return "bg-red-400/20 text-red-400";
  }

  return "bg-gray-500/20 text-gray-400";
}

function refundStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "processed") {
    return "bg-green-400/20 text-green-400";
  }

  if (normalized === "pending") {
    return "bg-yellow-400/20 text-yellow-400";
  }

  if (normalized === "failed") {
    return "bg-red-400/20 text-red-400";
  }

  return "bg-gray-500/20 text-gray-400";
}

// PAGE STATES

function stateHTML(type, state, message = "") {
  const isOrders = type === "Orders";

  const icon =
    state === "loading"
      ? "fa-spinner fa-spin"
      : state === "empty"
        ? isOrders
          ? "fa-box-open"
          : "fa-calendar-xmark"
        : "fa-triangle-exclamation";

  const title =
    state === "loading"
      ? `Loading ${type}`
      : state === "empty"
        ? isOrders
          ? "No Orders Found"
          : "No Table Bookings Found"
        : `${type} Could Not Be Loaded`;

  const text =
    state === "loading"
      ? `Please wait while we load your ${type.toLowerCase()}.`
      : state === "empty"
        ? isOrders
          ? "Your placed orders will appear here."
          : "Your table reservations will appear here."
        : esc(message);

  let action = "";

  if (state === "empty") {
    action = `
            <a
                href="index.html#${isOrders ? "menu" : "booking"}"
                class="
                    inline-flex
                    items-center
                    gap-2
                    mt-7
                    bg-[#D4AF37]
                    text-black
                    px-7
                    py-3
                    rounded-full
                    font-semibold
                    hover:scale-105
                    transition
                "
            >
                ${isOrders ? "Explore Menu" : "Book a Table"}
            </a>
        `;
  }

  if (state === "error") {
    action = `
            <button
                type="button"
                onclick="loadMy${type}()"
                class="
                    mt-7
                    bg-[#D4AF37]
                    text-black
                    px-7
                    py-3
                    rounded-full
                    font-semibold
                "
            >
                Try Again
            </button>
        `;
  }

  return `
        <div
            class="
                col-span-full
                text-center
                py-16
            "
        >

            <i
                class="
                    fa-solid
                    ${icon}
                    text-5xl
                    ${state === "error" ? "text-red-400" : "text-[#D4AF37]"}
                "
            ></i>

            <h2
                class="
                    text-3xl
                    text-white
                    font-bold
                    mt-5
                "
            >
                ${title}
            </h2>

            <p
                class="
                    text-gray-400
                    mt-3
                "
            >
                ${text}
            </p>

            ${action}

        </div>
    `;
}

function showState(type, state, message = "") {
  const element = type === "Orders" ? ordersList : bookingsList;

  if (!element) {
    return;
  }

  element.innerHTML = stateHTML(type, state, message);
}

// ORDER ITEM

function createOrderItemHTML(item) {
  return `
        <div
            class="
                flex
                justify-between
                items-center
                gap-4
                bg-white/5
                rounded-xl
                p-3
            "
        >

            <div
                class="
                    flex
                    items-center
                    gap-3
                "
            >

                <span class="text-xl">
                    ☕
                </span>

                <p class="text-gray-200">
                    ${esc(item.item_name || "Menu Item")}
                </p>

            </div>

            <span
                class="
                    text-[#D4AF37]
                    font-bold
                "
            >
                ×${Number(item.quantity || 0)}
            </span>

        </div>
    `;
}

// ORDER CARD

function createOrderCard(order) {
  const status =
    order.status || "Pending";

  const paymentStatus =
    order.payment_status || "Unpaid";

  const normalizedPaymentStatus =
    String(paymentStatus).toLowerCase();

  const refundStatus =
    order.refund_status || null;

  const normalizedRefundStatus =
    String(
      refundStatus || ""
    ).toLowerCase();

  const hasRefund =
    normalizedRefundStatus === "pending" ||
    normalizedRefundStatus === "processed" ||
    normalizedRefundStatus === "failed";

  const refundLabel =
    normalizedRefundStatus === "processed"
      ? "Refunded"
      : normalizedRefundStatus === "pending"
        ? "Refund Pending"
        : normalizedRefundStatus === "failed"
          ? "Refund Failed"
          : "";

  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  const itemsHTML =
    items.length
      ? items
          .map(createOrderItemHTML)
          .join("")
      : `
          <p class="text-gray-500">
            No order items found.
          </p>
        `;


  const canRetryPayment =
    ![
      "paid",
      "refunded"
    ].includes(
      normalizedPaymentStatus
    ) &&
    status !== "Cancelled";


  const retryPaymentButton =
    canRetryPayment
      ? `
          <button
            type="button"

            id="retry-payment-${Number(
              order.id
            )}"

            onclick="
              retryOrderPayment(
                ${Number(order.id)}
              )
            "

            class="
              mt-6
              w-full
              rounded-xl
              bg-[#D4AF37]
              text-black
              py-3
              font-bold
              transition-all
              duration-300
              hover:scale-[1.02]
              hover:bg-yellow-400
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >

            <i
              class="
                fa-solid
                fa-credit-card
                mr-2
              "
            ></i>

            Retry Payment

          </button>
        `
      : "";


  const cancelButton =
    status === "Pending"
      ? `
          <button
            type="button"

            onclick="
              openCancelOrderModal(
                ${Number(order.id)}
              )
            "

            class="
              mt-4
              w-full
              rounded-xl
              border
              border-red-500/40
              bg-red-500/10
              py-3
              font-semibold
              text-red-400
              transition
              hover:bg-red-500
              hover:text-white
            "
          >

            <i
              class="
                fa-solid
                fa-ban
                mr-2
              "
            ></i>

            Cancel Order

          </button>
        `
      : "";


  const hideButton =
    status === "Completed" ||
    status === "Cancelled"
      ? `
          <button
            type="button"

            onclick="
              removeOrderFromHistory(
                ${Number(order.id)}
              )
            "

            class="
              mt-4
              w-full
              rounded-xl
              border
              border-gray-600
              bg-white/5
              py-3
              font-semibold
              text-gray-300
              transition-all
              duration-300
              hover:border-[#D4AF37]
              hover:text-[#D4AF37]
              hover:bg-[#D4AF37]/5
            "
          >

            <i
              class="
                fa-solid
                fa-eye-slash
                mr-2
              "
            ></i>

            Remove from History

          </button>
        `
      : "";


  const cancellationDetails =
    status === "Cancelled"
      ? `
          <div
            class="
              mt-6
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/5
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
                  fa-circle-xmark
                  text-red-400
                  mt-1
                "
              ></i>

              <div>

                <p
                  class="
                    text-red-400
                    font-semibold
                  "
                >
                  Order Cancelled
                </p>

                <p
                  class="
                    text-gray-400
                    text-sm
                    mt-2
                  "
                >
                  ${
                    order.cancellation_reason
                      ? esc(
                          order.cancellation_reason
                        )
                      : (
                          "No cancellation " +
                          "reason provided."
                        )
                  }
                </p>

                ${
                  order.cancelled_at
                    ? `
                        <p
                          class="
                            text-gray-500
                            text-xs
                            mt-2
                          "
                        >
                          Cancelled on
                          ${date(
                            order.cancelled_at
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


  const refundDetails =
    hasRefund
      ? `
          <div
            class="
              mt-4
              rounded-2xl
              border

              ${
                normalizedRefundStatus ===
                "processed"
                  ? (
                      "border-green-500/20 " +
                      "bg-green-500/5"
                    )
                  : normalizedRefundStatus ===
                    "failed"
                    ? (
                        "border-red-500/20 " +
                        "bg-red-500/5"
                      )
                    : (
                        "border-yellow-500/20 " +
                        "bg-yellow-500/5"
                      )
              }

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
                    normalizedRefundStatus ===
                    "processed"
                      ? (
                          "fa-circle-check " +
                          "text-green-400"
                        )
                      : normalizedRefundStatus ===
                        "failed"
                        ? (
                            "fa-circle-xmark " +
                            "text-red-400"
                          )
                        : (
                            "fa-clock " +
                            "text-yellow-400"
                          )
                  }

                  mt-1
                "
              ></i>


              <div>

                <p
                  class="
                    font-semibold

                    ${
                      normalizedRefundStatus ===
                      "processed"
                        ? "text-green-400"
                        : normalizedRefundStatus ===
                          "failed"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }
                  "
                >
                  ${esc(refundLabel)}
                </p>


                <p
                  class="
                    text-gray-400
                    text-sm
                    mt-2
                  "
                >
                  ${
                    normalizedRefundStatus ===
                    "processed"
                      ? (
                          "Your payment has been " +
                          "refunded successfully."
                        )
                      : normalizedRefundStatus ===
                        "failed"
                        ? (
                            "Your refund could not " +
                            "be processed."
                          )
                        : (
                            "Your refund is being " +
                            "processed."
                          )
                  }
                </p>


                ${
                  order.refund_reason
                    ? `
                        <p
                          class="
                            text-gray-500
                            text-sm
                            mt-2
                          "
                        >
                          Reason:
                          ${esc(
                            order.refund_reason
                          )}
                        </p>
                      `
                    : ""
                }


                ${
                  order.refunded_at
                    ? `
                        <p
                          class="
                            text-gray-500
                            text-xs
                            mt-2
                          "
                        >
                          Refunded on
                          ${date(
                            order.refunded_at
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
        bg-gradient-to-br
        from-[#171412]
        to-black
        border
        border-[#D4AF37]/30
        rounded-3xl
        p-6
        transition-all
        duration-500
        hover:-translate-y-2
        hover:border-[#D4AF37]
        hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)]
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

          <h2
            class="
              text-2xl
              text-[#D4AF37]
              font-bold
            "
          >
            Order #${Number(order.id)}
          </h2>

          <p
            class="
              text-gray-400
              mt-2
            "
          >
            ${date(order.created_at)}
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
              px-4
              py-1
              rounded-full
              text-sm
              font-bold
              ${statusClass(status)}
            "
          >
            ${esc(status)}
          </span>


          <span
            class="
              px-4
              py-1
              rounded-full
              text-xs
              font-bold
              ${paymentStatusClass(
                paymentStatus
              )}
            "
          >
            Payment:
            ${esc(paymentStatus)}
          </span>


          ${
            hasRefund
              ? `
                  <span
                    class="
                      px-4
                      py-1
                      rounded-full
                      text-xs
                      font-bold
                      ${refundStatusClass(
                        refundStatus
                      )}
                    "
                  >
                    ${esc(refundLabel)}
                  </span>
                `
              : ""
          }

        </div>

      </div>


      <div
        class="
          mt-6
          border-t
          border-[#D4AF37]/20
          pt-5
        "
      >

        <div class="mb-5">

          <p
            class="
              text-gray-400
              text-sm
            "
          >
            Customer
          </p>

          <p
            class="
              text-white
              font-semibold
              mt-1
            "
          >
            ${esc(
              order.customer_name ||
              "Customer"
            )}
          </p>

        </div>


        <div class="space-y-3">
          ${itemsHTML}
        </div>

      </div>


      ${cancellationDetails}

      ${refundDetails}

      ${retryPaymentButton}

      ${cancelButton}

      ${hideButton}


      <div
        class="
          mt-6
          border-t
          border-[#D4AF37]/20
          pt-4
          flex
          justify-between
          items-center
          gap-4
        "
      >

        <span class="text-gray-400">
          Total Amount
        </span>

        <span
          class="
            text-2xl
            font-bold
            text-[#D4AF37]
          "
        >
          ${money(order.total)}
        </span>

      </div>

    </article>
  `;
}

async function retryOrderPayment(orderId) {
  const order = myOrders.find((item) => Number(item.id) === Number(orderId));

  if (!order) {
    showToast("Order not found.", "error");
    return;
  }

  const paymentStatus = String(order.payment_status || "Unpaid").toLowerCase();

  if (paymentStatus === "paid") {
    showToast("This order is already paid.", "success");

    await loadMyOrders();
    return;
  }

  if (order.status === "Cancelled") {
    showToast("Payment cannot be made for a cancelled order.", "error");
    return;
  }

  const button = document.getElementById(`retry-payment-${Number(orderId)}`);

  const originalHTML = button?.innerHTML;

  if (button) {
    button.disabled = true;

    button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Opening Payment...
        `;
  }

  try {
    if (typeof openRazorpayPayment !== "function") {
      throw new Error("Payment service is unavailable.");
    }

    const started = await openRazorpayPayment({
      orderId: Number(order.id),

      customerName: order.customer_name || "",

      phone: order.phone || "",

      onSuccess: async function () {
        const currentOrder = myOrders.find(
          (item) => Number(item.id) === Number(orderId),
        );

        if (currentOrder) {
          currentOrder.payment_status = "Paid";
        }

        renderMyOrders();

        showToast("Payment successful.", "success");

        try {
          await loadMyOrders();
        } catch (error) {
          console.error("Could not refresh orders:", error);
        }
      },
    });

    if (!started && button) {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  } catch (error) {
    console.error("Retry payment failed:", error);

    showToast(error.message || "Unable to retry payment.", "error");

    if (button) {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }
}

async function removeOrderFromHistory(orderId) {
  const confirmed = window.confirm("Remove this order from your history?");

  if (!confirmed) {
    return;
  }

  try {
    await hideOrder(orderId);

    myOrders = myOrders.filter((order) => Number(order.id) !== Number(orderId));

    renderMyOrders();

    showToast("Order removed from history.", "success");
  } catch (error) {
    console.error("Remove order failed:", error);

    showToast(error.message || "Unable to remove order from history.", "error");
  }
}

// CANCEL ORDER MODAL

function createCancelOrderModal() {
  if (document.getElementById("cancel-order-modal")) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
            <div
                id="cancel-order-modal"

                class="
                    hidden
                    fixed
                    inset-0
                    z-[99999]
                    bg-black/80
                    backdrop-blur-sm
                    items-center
                    justify-center
                    px-5
                "
            >

                <div
                    class="
                        w-full
                        max-w-md
                        bg-[#171412]
                        border
                        border-red-500/30
                        rounded-3xl
                        p-7
                        shadow-2xl
                    "
                >

                    <h3
                        class="
                            text-2xl
                            font-bold
                            text-white
                        "
                    >
                        Cancel Order
                    </h3>


                    <p
                        class="
                            text-gray-400
                            mt-2
                        "
                    >
                        Please tell us why you want
                        to cancel this order.
                    </p>


                    <textarea
                        id="cancel-order-reason"

                        rows="4"

                        maxlength="500"

                        placeholder="
                            Enter cancellation reason...
                        "

                        class="
                            w-full
                            mt-5
                            bg-black/40
                            border
                            border-[#D4AF37]/25
                            rounded-xl
                            p-4
                            text-white
                            outline-none
                            focus:border-[#D4AF37]
                            resize-none
                        "
                    ></textarea>


                    <p
                        id="cancel-order-error"

                        class="
                            hidden
                            text-red-400
                            text-sm
                            mt-2
                        "
                    ></p>


                    <div
                        class="
                            grid
                            grid-cols-2
                            gap-3
                            mt-6
                        "
                    >

                        <button
                            id="cancel-order-close"

                            type="button"

                            class="
                                border
                                border-gray-600
                                text-gray-300
                                py-3
                                rounded-xl
                                hover:bg-white/5
                                transition
                            "
                        >
                            Keep Order
                        </button>


                        <button
                            id="cancel-order-confirm"

                            type="button"

                            class="
                                bg-red-500
                                text-white
                                py-3
                                rounded-xl
                                font-semibold
                                hover:bg-red-600
                                transition
                            "
                        >
                            Cancel Order
                        </button>

                    </div>

                </div>

            </div>
        `,
  );
}

// OPEN CANCEL MODAL

function openCancelOrderModal(orderId) {
  createCancelOrderModal();

  cancellingOrderId = Number(orderId);

  const modal = document.getElementById("cancel-order-modal");

  const reason = document.getElementById("cancel-order-reason");

  const error = document.getElementById("cancel-order-error");

  if (reason) {
    reason.value = "";
  }

  error?.classList.add("hidden");

  modal?.classList.remove("hidden");

  modal?.classList.add("flex");

  document.body.style.overflow = "hidden";
}

// CLOSE CANCEL MODAL

function closeCancelOrderModal() {
  const modal = document.getElementById("cancel-order-modal");

  modal?.classList.add("hidden");

  modal?.classList.remove("flex");

  cancellingOrderId = null;

  document.body.style.overflow = "";
}

// SUBMIT ORDER CANCELLATION

async function submitOrderCancellation() {
  const reasonInput = document.getElementById("cancel-order-reason");

  const errorBox = document.getElementById("cancel-order-error");

  const confirmButton = document.getElementById("cancel-order-confirm");

  const reason = reasonInput?.value.trim() || "";

  const orderId = cancellingOrderId;

  function showCancelError(message) {
    if (errorBox) {
      errorBox.textContent = message;

      errorBox.classList.remove("hidden");
    }

    reasonInput?.focus();
  }

  if (!orderId) {
    return;
  }

  if (!reason) {
    showCancelError("Please enter a cancellation reason.");

    return;
  }

  if (reason.length > 500) {
    showCancelError("Reason cannot exceed 500 characters.");

    return;
  }

  if (confirmButton) {
    confirmButton.disabled = true;

    confirmButton.textContent = "Cancelling...";
  }

  try {
    const response = await cancelOrder(orderId, reason);

    const freshOrder = response?.order;

    const localOrder = myOrders.find(
      (order) => Number(order.id) === Number(orderId),
    );

    if (localOrder) {
      Object.assign(
        localOrder,

        freshOrder || {
          status: "Cancelled",

          cancellation_reason: reason,

          cancelled_at: new Date().toISOString(),
        },
      );
    }

    // Instant UI update
    renderMyOrders();

    closeCancelOrderModal();

    // Toast
    if (typeof showToast === "function") {
      showToast("Order cancelled successfully.", "success");
    }

    // Backend se fresh sync
    loadMyOrders().catch((error) => {
      console.error("Orders refresh failed:", error);
    });
  } catch (error) {
    console.error("Order cancellation failed:", error);

    const message = error.message || "Unable to cancel order.";

    showCancelError(message);

    if (typeof showToast === "function") {
      showToast(message, "error");
    }
  } finally {
    if (confirmButton) {
      confirmButton.disabled = false;

      confirmButton.textContent = "Cancel Order";
    }
  }
}

// BOOKING CARD

function createBookingCard(booking) {
    const status = booking.status || "Pending";

    const paymentStatus =
        booking.payment_status || "Unpaid";

    const normalizedPaymentStatus =
        String(paymentStatus).toLowerCase();

    const refundStatus =
        booking.refund_status || "None";

    const normalizedRefundStatus =
        String(refundStatus).toLowerCase();

    const advanceAmount =
        booking.advance_amount ?? 500;

    const hasRefund =
        normalizedRefundStatus === "pending" ||
        normalizedRefundStatus === "processed" ||
        normalizedRefundStatus === "failed";

    const refundLabel =
        normalizedRefundStatus === "processed"
            ? "Refunded"
            : normalizedRefundStatus === "pending"
                ? "Refund Pending"
                : normalizedRefundStatus === "failed"
                    ? "Refund Failed"
                    : "No Refund";


    function row(
        icon,
        value,
        css = "text-gray-400"
    ) {
        return `
            <p class="${css}">
                <i
                    class="
                        fa-solid
                        ${icon}
                        text-[#D4AF37]
                        w-6
                    "
                ></i>

                ${value}
            </p>
        `;
    }


    /*
    ========================================
    PAYMENT DETAILS
    ========================================
    */

    const paymentDetails = `
        <div
            class="
                mt-6
                rounded-2xl
                border
                border-[#D4AF37]/20
                bg-white/5
                p-4
            "
        >
            <div
                class="
                    flex
                    justify-between
                    items-center
                    gap-3
                "
            >
                <div>
                    <p
                        class="
                            text-gray-400
                            text-xs
                            uppercase
                            tracking-wide
                        "
                    >
                        Advance Payment
                    </p>

                    <p
                        class="
                            text-[#D4AF37]
                            text-xl
                            font-bold
                            mt-1
                        "
                    >
                        ${money(advanceAmount)}
                    </p>
                </div>

                <span
                    class="
                        px-4
                        py-1
                        rounded-full
                        text-xs
                        font-bold
                        ${paymentStatusClass(
                            paymentStatus
                        )}
                    "
                >
                    Payment:
                    ${esc(paymentStatus)}
                </span>
            </div>

            ${
                booking.payment_provider
                    ? `
                        <p
                            class="
                                text-gray-500
                                text-xs
                                mt-3
                            "
                        >
                            Paid via
                            ${esc(
                                booking.payment_provider
                            )}
                        </p>
                    `
                    : ""
            }
        </div>
    `;


    /*
    ========================================
    REFUND DETAILS
    ========================================
    */

    const refundDetails =
        hasRefund
            ? `
                <div
                    class="
                        mt-4
                        rounded-2xl
                        border

                        ${
                            normalizedRefundStatus ===
                            "processed"
                                ? (
                                    "border-green-500/20 " +
                                    "bg-green-500/5"
                                )
                                : normalizedRefundStatus ===
                                  "failed"
                                    ? (
                                        "border-red-500/20 " +
                                        "bg-red-500/5"
                                    )
                                    : (
                                        "border-yellow-500/20 " +
                                        "bg-yellow-500/5"
                                    )
                        }

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
                                    normalizedRefundStatus ===
                                    "processed"
                                        ? (
                                            "fa-circle-check " +
                                            "text-green-400"
                                        )
                                        : normalizedRefundStatus ===
                                          "failed"
                                            ? (
                                                "fa-circle-xmark " +
                                                "text-red-400"
                                            )
                                            : (
                                                "fa-clock " +
                                                "text-yellow-400"
                                            )
                                }

                                mt-1
                            "
                        ></i>

                        <div>
                            <p
                                class="
                                    font-semibold

                                    ${
                                        normalizedRefundStatus ===
                                        "processed"
                                            ? "text-green-400"
                                            : normalizedRefundStatus ===
                                              "failed"
                                                ? "text-red-400"
                                                : "text-yellow-400"
                                    }
                                "
                            >
                                ${esc(refundLabel)}
                            </p>

                            <p
                                class="
                                    text-gray-400
                                    text-sm
                                    mt-2
                                "
                            >
                                ${
                                    normalizedRefundStatus ===
                                    "processed"
                                        ? (
                                            "Your ₹500 booking advance " +
                                            "has been refunded successfully."
                                        )
                                        : normalizedRefundStatus ===
                                          "failed"
                                            ? (
                                                "Your booking advance " +
                                                "refund could not be processed."
                                            )
                                            : (
                                                "Your ₹500 booking advance " +
                                                "refund is being processed."
                                            )
                                }
                            </p>

                            ${
                                booking.refund_reason
                                    ? `
                                        <p
                                            class="
                                                text-gray-500
                                                text-sm
                                                mt-2
                                            "
                                        >
                                            Reason:
                                            ${esc(
                                                booking.refund_reason
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                            ${
                                booking.refunded_at
                                    ? `
                                        <p
                                            class="
                                                text-gray-500
                                                text-xs
                                                mt-2
                                            "
                                        >
                                            Refunded on
                                            ${date(
                                                booking.refunded_at
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


    /*
    ========================================
    CANCEL BUTTON
    ========================================
    */

    const canCancel =
        status === "Pending";

    const cancelButton =
        canCancel
            ? `
                <button
                    type="button"

                    onclick="
                        openCancelBookingModal(
                            ${Number(booking.id)}
                        )
                    "

                    class="
                        mt-6
                        w-full
                        rounded-xl
                        border
                        border-red-500/40
                        bg-red-500/10
                        py-3
                        font-semibold
                        text-red-400
                        transition-all
                        duration-300
                        hover:bg-red-500
                        hover:text-white
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-ban
                            mr-2
                        "
                    ></i>

                    Cancel Booking
                </button>
            `
            : "";


    /*
    ========================================
    REMOVE FROM HISTORY
    ========================================
    */

    const hideButton =
        status === "Completed" ||
        status === "Cancelled"
            ? `
                <button
                    type="button"

                    onclick="
                        removeBookingFromHistory(
                            ${Number(booking.id)}
                        )
                    "

                    class="
                        mt-4
                        w-full
                        rounded-xl
                        border
                        border-gray-600
                        bg-white/5
                        py-3
                        font-semibold
                        text-gray-300
                        transition-all
                        duration-300
                        hover:border-[#D4AF37]
                        hover:text-[#D4AF37]
                        hover:bg-[#D4AF37]/5
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-eye-slash
                            mr-2
                        "
                    ></i>

                    Remove from History
                </button>
            `
            : "";


    /*
    ========================================
    CANCELLATION DETAILS
    ========================================
    */

    const cancellationDetails =
        status === "Cancelled"
            ? `
                <div
                    class="
                        mt-6
                        rounded-2xl
                        border
                        border-red-500/20
                        bg-red-500/5
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
                                fa-circle-xmark
                                text-red-400
                                mt-1
                            "
                        ></i>

                        <div>
                            <p
                                class="
                                    text-red-400
                                    font-semibold
                                "
                            >
                                Booking Cancelled
                            </p>

                            <p
                                class="
                                    text-gray-400
                                    text-sm
                                    mt-2
                                "
                            >
                                ${
                                    booking.cancellation_reason
                                        ? esc(
                                            booking.cancellation_reason
                                        )
                                        : (
                                            "No cancellation " +
                                            "reason provided."
                                        )
                                }
                            </p>

                            ${
                                booking.cancelled_at
                                    ? `
                                        <p
                                            class="
                                                text-gray-500
                                                text-xs
                                                mt-2
                                            "
                                        >
                                            Cancelled on
                                            ${date(
                                                booking.cancelled_at
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


    /*
    ========================================
    CARD
    ========================================
    */

    return `
        <article
            class="
                bg-gradient-to-br
                from-[#171412]
                to-black
                border
                border-[#D4AF37]/30
                rounded-3xl
                p-6
                transition-all
                duration-500
                hover:-translate-y-2
                hover:border-[#D4AF37]
                hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)]
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
                    <h2
                        class="
                            text-2xl
                            text-[#D4AF37]
                            font-bold
                        "
                    >
                        Table Booking
                    </h2>

                    <p
                        class="
                            text-gray-500
                            text-sm
                            mt-1
                        "
                    >
                        Booking #${Number(booking.id)}
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
                            px-4
                            py-1
                            rounded-full
                            text-sm
                            font-bold
                            ${statusClass(status)}
                        "
                    >
                        ${esc(status)}
                    </span>

                    <span
                        class="
                            px-4
                            py-1
                            rounded-full
                            text-xs
                            font-bold
                            ${paymentStatusClass(
                                paymentStatus
                            )}
                        "
                    >
                        Payment:
                        ${esc(paymentStatus)}
                    </span>

                    ${
                        hasRefund
                            ? `
                                <span
                                    class="
                                        px-4
                                        py-1
                                        rounded-full
                                        text-xs
                                        font-bold
                                        ${refundStatusClass(
                                            refundStatus
                                        )}
                                    "
                                >
                                    ${esc(refundLabel)}
                                </span>
                            `
                            : ""
                    }
                </div>
            </div>


            <div
                class="
                    mt-5
                    space-y-3
                "
            >
                ${row(
                    "fa-user",
                    esc(
                        booking.name ||
                        "Customer"
                    ),
                    "text-white"
                )}

                ${row(
                    "fa-phone",
                    esc(
                        booking.phone ||
                        "—"
                    )
                )}

                ${row(
                    "fa-calendar-day",
                    esc(
                        booking.date ||
                        "—"
                    )
                )}

                ${row(
                    "fa-clock",
                    esc(
                        booking.time ||
                        "—"
                    )
                )}

                ${row(
                    "fa-users",
                    `${Number(
                        booking.guests || 0
                    )} Guests`
                )}

                ${row(
                    "fa-note-sticky",
                    esc(
                        booking.description ||
                        "No Special Request"
                    )
                )}
            </div>


            ${paymentDetails}

            ${cancellationDetails}

            ${refundDetails}

            ${cancelButton}

            ${hideButton}

        </article>
    `;
}

async function removeBookingFromHistory(bookingId) {
  const confirmed = window.confirm("Remove this booking from your history?");

  if (!confirmed) {
    return;
  }

  try {
    await hideBooking(bookingId);

    myBookings = myBookings.filter(
      (booking) => Number(booking.id) !== Number(bookingId),
    );

    renderMyBookings();

    showToast("Booking removed from history.", "success");
  } catch (error) {
    console.error("Remove booking failed:", error);

    showToast(
      error.message || "Unable to remove booking from history.",
      "error",
    );
  }
}

function createCancelBookingModal() {
  if (document.getElementById("cancel-booking-modal")) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div
            id="cancel-booking-modal"
            class="hidden fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm items-center justify-center px-5"
        >

            <div
                class="w-full max-w-md bg-[#171412] border border-red-500/30 rounded-3xl p-7 shadow-2xl"
            >

                <h3 class="text-2xl font-bold text-white">
                    Cancel Booking
                </h3>

                <p class="text-gray-400 mt-2">
                    Please tell us why you want to cancel this booking.
                </p>

                <textarea
                    id="cancel-booking-reason"
                    rows="4"
                    maxlength="500"
                    placeholder="Enter cancellation reason..."
                    class="w-full mt-5 bg-black/40 border border-[#D4AF37]/25 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37] resize-none"
                ></textarea>

                <p
                    id="cancel-booking-error"
                    class="hidden text-red-400 text-sm mt-2"
                ></p>

                <div class="grid grid-cols-2 gap-3 mt-6">

                    <button
                        id="cancel-booking-close"
                        type="button"
                        class="border border-gray-600 text-gray-300 py-3 rounded-xl hover:bg-white/5 transition"
                    >
                        Keep Booking
                    </button>

                    <button
                        id="cancel-booking-confirm"
                        type="button"
                        class="bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition"
                    >
                        Cancel Booking
                    </button>

                </div>

            </div>

        </div>
        `,
  );
}

function openCancelBookingModal(bookingId) {
  createCancelBookingModal();

  cancellingBookingId = Number(bookingId);

  const modal = document.getElementById("cancel-booking-modal");

  const reason = document.getElementById("cancel-booking-reason");

  const error = document.getElementById("cancel-booking-error");

  if (reason) {
    reason.value = "";
  }

  error?.classList.add("hidden");

  modal?.classList.remove("hidden");

  modal?.classList.add("flex");

  document.body.style.overflow = "hidden";
}

function closeCancelBookingModal() {
  const modal = document.getElementById("cancel-booking-modal");

  modal?.classList.add("hidden");

  modal?.classList.remove("flex");

  cancellingBookingId = null;

  document.body.style.overflow = "";
}

async function submitBookingCancellation() {
  const reasonInput = document.getElementById("cancel-booking-reason");

  const errorBox = document.getElementById("cancel-booking-error");

  const confirmButton = document.getElementById("cancel-booking-confirm");

  const reason = reasonInput?.value.trim() || "";

  const bookingId = cancellingBookingId;

  function showBookingCancelError(message) {
    if (errorBox) {
      errorBox.textContent = message;

      errorBox.classList.remove("hidden");
    }

    reasonInput?.focus();
  }

  if (!bookingId) {
    return;
  }

  if (!reason) {
    showBookingCancelError("Please enter a cancellation reason.");

    return;
  }

  if (reason.length > 500) {
    showBookingCancelError("Reason cannot exceed 500 characters.");

    return;
  }

  if (confirmButton) {
    confirmButton.disabled = true;

    confirmButton.textContent = "Cancelling...";
  }

  try {
    const response = await cancelBooking(bookingId, reason);

    const localBooking = myBookings.find(
      (booking) => Number(booking.id) === Number(bookingId),
    );

    if (localBooking) {
      Object.assign(
        localBooking,
        response?.booking || {
          status: "Cancelled",

          cancellation_reason: reason,

          cancelled_at: new Date().toISOString(),
        },
      );
    }

    renderMyBookings();

    closeCancelBookingModal();

    showToast("Booking cancelled successfully.", "success");

    loadMyBookings().catch((error) => {
      console.error("Bookings refresh failed:", error);
    });
  } catch (error) {
    console.error("Booking cancellation failed:", error);

    const message = error.message || "Unable to cancel booking.";

    showBookingCancelError(message);

    showToast(message, "error");
  } finally {
    if (confirmButton) {
      confirmButton.disabled = false;

      confirmButton.textContent = "Cancel Booking";
    }
  }
}

function getCardsPerRow(container) {
    if (!container) {
        return 1;
    }

    const style =
        window.getComputedStyle(container);

    const columns =
        style.gridTemplateColumns;

    if (
        !columns ||
        columns === "none"
    ) {
        return 1;
    }

    return columns
        .split(" ")
        .filter(Boolean)
        .length || 1;
}


function toggleOrdersView() {
    showAllOrders =
        !showAllOrders;

    renderMyOrders();
}


function toggleBookingsView() {
    showAllBookings =
        !showAllBookings;

    renderMyBookings();
}

// RENDER ORDERS

function renderMyOrders() {
    if (!ordersList) {
        return;
    }

    if (!myOrders.length) {
        ordersList.innerHTML =
            stateHTML(
                "Orders",
                "empty"
            );

        return;
    }

    const cardsPerRow =
        getCardsPerRow(
            ordersList
        );

    const visibleOrders =
        showAllOrders
            ? myOrders
            : myOrders.slice(
                0,
                cardsPerRow
            );

    const hasMore =
        myOrders.length >
        cardsPerRow;

    const buttonHTML =
        hasMore
            ? `
                <div
                    class="
                        col-span-full
                        flex
                        justify-center
                        mt-3
                    "
                >
                    <button
                        type="button"

                        onclick="
                            toggleOrdersView()
                        "

                        class="
                            inline-flex
                            items-center
                            gap-2
                            border
                            border-[#D4AF37]/40
                            text-[#D4AF37]
                            px-7
                            py-3
                            rounded-full
                            font-semibold
                            transition-all
                            duration-300
                            hover:bg-[#D4AF37]
                            hover:text-black
                        "
                    >
                        ${
                            showAllOrders
                                ? `
                                    <i
                                        class="
                                            fa-solid
                                            fa-chevron-up
                                        "
                                    ></i>

                                    Show Less
                                `
                                : `
                                    <i
                                        class="
                                            fa-solid
                                            fa-chevron-down
                                        "
                                    ></i>

                                    View All Orders
                                `
                        }
                    </button>
                </div>
            `
            : "";

    ordersList.innerHTML =
        visibleOrders
            .map(
                createOrderCard
            )
            .join("")
        + buttonHTML;
}

// RENDER BOOKINGS

function renderMyBookings() {
    if (!bookingsList) {
        return;
    }

    if (!myBookings.length) {
        bookingsList.innerHTML =
            stateHTML(
                "Bookings",
                "empty"
            );

        return;
    }

    const cardsPerRow =
        getCardsPerRow(
            bookingsList
        );

    const visibleBookings =
        showAllBookings
            ? myBookings
            : myBookings.slice(
                0,
                cardsPerRow
            );

    const hasMore =
        myBookings.length >
        cardsPerRow;

    const buttonHTML =
        hasMore
            ? `
                <div
                    class="
                        col-span-full
                        flex
                        justify-center
                        mt-3
                    "
                >
                    <button
                        type="button"

                        onclick="
                            toggleBookingsView()
                        "

                        class="
                            inline-flex
                            items-center
                            gap-2
                            border
                            border-[#D4AF37]/40
                            text-[#D4AF37]
                            px-7
                            py-3
                            rounded-full
                            font-semibold
                            transition-all
                            duration-300
                            hover:bg-[#D4AF37]
                            hover:text-black
                        "
                    >
                        ${
                            showAllBookings
                                ? `
                                    <i
                                        class="
                                            fa-solid
                                            fa-chevron-up
                                        "
                                    ></i>

                                    Show Less
                                `
                                : `
                                    <i
                                        class="
                                            fa-solid
                                            fa-chevron-down
                                        "
                                    ></i>

                                    View All Bookings
                                `
                        }
                    </button>
                </div>
            `
            : "";

    bookingsList.innerHTML =
        visibleBookings
            .map(
                createBookingCard
            )
            .join("")
        + buttonHTML;
}

// COMMON DATA LOADER

async function loadData(type, getter) {
  const element = type === "Orders" ? ordersList : bookingsList;

  if (!element) {
    return;
  }

  showState(type, "loading");

  try {
    const response = await getter();

    if (type === "Orders") {
      myOrders = Array.isArray(response) ? response : [];

      renderMyOrders();
    } else {
      myBookings = Array.isArray(response) ? response : [];

      renderMyBookings();
    }
  } catch (error) {
    console.error(`${type} loading failed:`, error);

    if (error.status === 401) {
      localStorage.setItem("loginRedirect", "myorders.html");

      window.location.replace("login.html?next=myorders.html");

      return;
    }

    showState(
      type,
      "error",
      error.message || `Unable to load your ${type.toLowerCase()}.`,
    );
  }
}

// LOAD ORDERS / BOOKINGS

function loadMyOrders() {
  return loadData("Orders", getOrders);
}

function loadMyBookings() {
  return loadData("Bookings", getBookings);
}

// INITIALIZE PAGE

async function initializeMyOrdersPage() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    localStorage.setItem("loginRedirect", "myorders.html");

    window.location.replace("login.html?next=myorders.html");

    return;
  }

  await Promise.all([loadMyOrders(), loadMyBookings()]);
}

document.addEventListener("click", (event) => {
  // ORDER MODAL CLOSE
  if (event.target.closest("#cancel-order-close")) {
    closeCancelOrderModal();
    return;
  }

  // ORDER CANCEL CONFIRM
  if (event.target.closest("#cancel-order-confirm")) {
    submitOrderCancellation();
    return;
  }

  // BOOKING MODAL CLOSE
  if (event.target.closest("#cancel-booking-close")) {
    closeCancelBookingModal();
    return;
  }

  // BOOKING CANCEL CONFIRM
  if (event.target.closest("#cancel-booking-confirm")) {
    submitBookingCancellation();
    return;
  }
});

document.addEventListener("DOMContentLoaded", initializeMyOrdersPage);
