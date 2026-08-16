from django.db import transaction

from config.gmail_service import send_gmail_email

from .models import Booking


def _get_user_email(booking):
    email = str(
        getattr(
            booking.user,
            "email",
            ""
        )
        or ""
    ).strip()

    return email


def _send_email(subject, message, recipient):
    send_gmail_email(
        subject=subject,
        message=message,
        recipient=recipient,
    )


def queue_booking_confirmation_email(booking_id):

    transaction.on_commit(
        lambda: send_booking_confirmation_email(
            booking_id
        )
    )


def send_booking_confirmation_email(booking_id):

    try:
        booking = (
            Booking.objects
            .select_related("user")
            .get(pk=booking_id)
        )
    except Booking.DoesNotExist:
        return False

    if booking.booking_confirmation_email_sent:
        return False

    email = _get_user_email(booking)

    if not email:
        return False

    try:
        payment = booking.payment
    except Exception:
        return False

    if str(payment.status).lower() != "paid":
        return False

    subject = (
        f"Table Booking Confirmed - "
        f"G-Class Lounge #{booking.id}"
    )

    message = (
        f"Hi {booking.name},\n\n"
        f"Your table booking at G-Class Lounge "
        f"has been confirmed.\n\n"
        f"Booking ID: #{booking.id}\n"
        f"Date: {booking.date}\n"
        f"Time: {booking.time.strftime('%I:%M %p')}\n"
        f"Guests: {booking.guests}\n"
        f"Advance Paid: ₹{payment.amount}\n"
        f"Payment Status: {payment.status}\n\n"
        f"Please keep your booking details with you "
        f"when you visit.\n\n"
        f"Thank you,\n"
        f"G-Class Lounge"
    )

    try:
        _send_email(
            subject,
            message,
            email,
        )
    except Exception:
        return False

    Booking.objects.filter(
        pk=booking.id,
        booking_confirmation_email_sent=False
    ).update(
        booking_confirmation_email_sent=True
    )

    return True


def queue_booking_cancellation_email(booking_id):

    transaction.on_commit(
        lambda: send_booking_cancellation_email(
            booking_id
        )
    )


def send_booking_cancellation_email(booking_id):

    try:
        booking = (
            Booking.objects
            .select_related("user")
            .get(pk=booking_id)
        )
    except Booking.DoesNotExist:
        return False

    if booking.cancellation_email_sent:
        return False

    email = _get_user_email(booking)

    if not email:
        return False

    if booking.status != Booking.STATUS_CANCELLED:
        return False

    subject = (
        f"Table Booking Cancelled - "
        f"G-Class Lounge #{booking.id}"
    )

    reason = (
        booking.cancellation_reason
        or "No reason provided."
    )

    message = (
        f"Hi {booking.name},\n\n"
        f"Your table booking at G-Class Lounge "
        f"has been cancelled.\n\n"
        f"Booking ID: #{booking.id}\n"
        f"Date: {booking.date}\n"
        f"Time: {booking.time.strftime('%I:%M %p')}\n"
        f"Guests: {booking.guests}\n"
        f"Cancellation Reason: {reason}\n\n"
        f"If an advance payment was successfully made, "
        f"the applicable refund will be processed "
        f"separately.\n\n"
        f"Thank you,\n"
        f"G-Class Lounge"
    )

    try:
        _send_email(
            subject,
            message,
            email,
        )
    except Exception:
        return False

    Booking.objects.filter(
        pk=booking.id,
        cancellation_email_sent=False
    ).update(
        cancellation_email_sent=True
    )

    return True


def queue_booking_refund_email(booking_id):

    transaction.on_commit(
        lambda: send_booking_refund_email(
            booking_id
        )
    )


def send_booking_refund_email(booking_id):

    try:
        booking = (
            Booking.objects
            .select_related("user")
            .get(pk=booking_id)
        )
    except Booking.DoesNotExist:
        return False

    if booking.refund_email_sent:
        return False

    email = _get_user_email(booking)

    if not email:
        return False

    try:
        payment = booking.payment
    except Exception:
        return False

    if (
        str(payment.refund_status).lower()
        != "processed"
    ):
        return False

    subject = (
        f"Booking Advance Refunded - "
        f"G-Class Lounge #{booking.id}"
    )

    message = (
        f"Hi {booking.name},\n\n"
        f"Your booking advance refund has been "
        f"processed successfully.\n\n"
        f"Booking ID: #{booking.id}\n"
        f"Refund Amount: ₹{payment.amount}\n"
        f"Refund Status: {payment.refund_status}\n"
        f"Refund ID: "
        f"{payment.provider_refund_id or '—'}\n\n"
        f"The amount will be credited according to "
        f"your payment provider/bank processing time.\n\n"
        f"Thank you,\n"
        f"G-Class Lounge"
    )

    try:
        _send_email(
            subject,
            message,
            email,
        )
    except Exception:
        return False

    Booking.objects.filter(
        pk=booking.id,
        refund_email_sent=False
    ).update(
        refund_email_sent=True
    )

    return True