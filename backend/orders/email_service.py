import logging
import resend

from django.conf import settings
from django.db import transaction

from .models import Order


logger = logging.getLogger(__name__)


def _get_user_email(order):
    email = str(
        getattr(order.user, "email", "") or ""
    ).strip()

    return email


def _send_email(subject, message, recipient):
    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [recipient],
        "subject": subject,
        "text": message,
    })


def send_order_confirmation_email(order_id):
    try:
        order = (
            Order.objects
            .select_related("user")
            .prefetch_related("items")
            .get(id=order_id)
        )

        if order.order_confirmation_email_sent:
            return

        email = _get_user_email(order)

        if not email:
            logger.warning(
                "Order #%s has no customer email.",
                order.id,
            )
            return

        items_text = "\n".join(
            (
                f"- {item.item_name} "
                f"x {item.quantity} "
                f"(₹{item.price})"
            )
            for item in order.items.all()
        )

        subject = (
            f"G-Class Lounge - "
            f"Order #{order.id} Confirmed"
        )

        message = f"""
Hello {order.customer_name},

Your payment has been received successfully and your order is confirmed.

Order ID: #{order.id}

Items:
{items_text}

Total Amount: ₹{order.total}
Order Status: {order.status}

Thank you for ordering from G-Class Lounge.

Regards,
G-Class Lounge
""".strip()

        _send_email(
            subject,
            message,
            email,
        )

        Order.objects.filter(
            id=order.id,
            order_confirmation_email_sent=False,
        ).update(
            order_confirmation_email_sent=True
        )

    except Exception:
        logger.exception(
            "Could not send confirmation email "
            "for order #%s.",
            order_id,
        )


def send_cancellation_email(order_id):
    try:
        order = (
            Order.objects
            .select_related("user")
            .get(id=order_id)
        )

        if order.cancellation_email_sent:
            return

        email = _get_user_email(order)

        if not email:
            logger.warning(
                "Order #%s has no customer email.",
                order.id,
            )
            return

        subject = (
            f"G-Class Lounge - "
            f"Order #{order.id} Cancelled"
        )

        message = f"""
Hello {order.customer_name},

Your order #{order.id} has been cancelled successfully.

Total Amount: ₹{order.total}

Cancellation Reason:
{order.cancellation_reason or "Not provided"}

If your payment is eligible for a refund, you will receive a separate refund confirmation once the refund is successfully processed.

Regards,
G-Class Lounge
""".strip()

        _send_email(
            subject,
            message,
            email,
        )

        Order.objects.filter(
            id=order.id,
            cancellation_email_sent=False,
        ).update(
            cancellation_email_sent=True
        )

    except Exception:
        logger.exception(
            "Could not send cancellation email "
            "for order #%s.",
            order_id,
        )


def send_refund_email(order_id):
    try:
        order = (
            Order.objects
            .select_related(
                "user",
                "payment",
            )
            .get(id=order_id)
        )

        if order.refund_email_sent:
            return

        payment = order.payment

        if (
            payment.refund_status
            != payment.REFUND_PROCESSED
        ):
            return

        email = _get_user_email(order)

        if not email:
            logger.warning(
                "Order #%s has no customer email.",
                order.id,
            )
            return

        subject = (
            f"G-Class Lounge - "
            f"Refund for Order #{order.id}"
        )

        message = f"""
Hello {order.customer_name},

Your refund has been processed successfully.

Order ID: #{order.id}
Refund Amount: ₹{payment.amount}
Refund Status: {payment.refund_status}
Refund ID: {payment.provider_refund_id or "N/A"}

Refund Reason:
{payment.refund_reason or order.cancellation_reason or "Order cancellation"}

The time taken for the amount to appear in your account may depend on your bank or payment method.

Regards,
G-Class Lounge
""".strip()

        _send_email(
            subject,
            message,
            email,
        )

        Order.objects.filter(
            id=order.id,
            refund_email_sent=False,
        ).update(
            refund_email_sent=True
        )

    except Exception:
        logger.exception(
            "Could not send refund email "
            "for order #%s.",
            order_id,
        )


def queue_order_confirmation_email(order_id):
    transaction.on_commit(
        lambda: send_order_confirmation_email(
            order_id
        )
    )


def queue_cancellation_email(order_id):
    transaction.on_commit(
        lambda: send_cancellation_email(
            order_id
        )
    )


def queue_refund_email(order_id):
    transaction.on_commit(
        lambda: send_refund_email(
            order_id
        )
    )