from decimal import Decimal

import json

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

import razorpay

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.email_service import (
    queue_order_confirmation_email,
    queue_refund_email,
)

from bookings.models import Booking
from bookings.email_service import (
    queue_booking_confirmation_email,
    queue_booking_refund_email,
)

from .models import (
    Payment,
    BookingPayment,
)

from .serializers import (
    PaymentSerializer,
    BookingPaymentSerializer,
)

class CreatePaymentOrderView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    @transaction.atomic
    def post(self, request, order_id):

        try:
            order = (
                Order.objects
                .select_for_update()
                .get(
                    id=order_id,
                    user=request.user
                )
            )

        except Order.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status == Order.STATUS_CANCELLED:
            return Response(
                {
                    "detail":
                        (
                            "Payment cannot be created "
                            "for a cancelled order."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.total <= Decimal("0.00"):
            return Response(
                {
                    "detail":
                        (
                            "Order amount must be "
                            "greater than zero."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = (
            Payment.objects
            .select_for_update()
            .filter(
                order=order
            )
            .first()
        )

        # Never allow another payment
        # attempt after successful payment.
        if (
            payment
            and payment.status
            == Payment.STATUS_PAID
        ):
            return Response(
                {
                    "detail":
                        "Order is already paid.",

                    "payment":
                        PaymentSerializer(
                            payment
                        ).data
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

        amount_in_paise = int(
            order.total * Decimal("100")
        )

        # Unique receipt for retries too.
        receipt = (
            f"order_{order.id}_"
            f"{int(timezone.now().timestamp())}"
        )

        try:
            razorpay_order = (
                client.order.create(
                    {
                        "amount":
                            amount_in_paise,

                        "currency":
                            "INR",

                        "receipt":
                            receipt,

                        "notes": {
                            "local_order_id":
                                str(order.id),

                            "user_id":
                                str(
                                    request.user.id
                                ),
                        },
                    }
                )
            )

        except Exception:
            return Response(
                {
                    "detail":
                        (
                            "Unable to create payment "
                            "order. Please try again."
                        )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        if payment:
            # Reuse existing DB payment record
            # with a fresh Razorpay order.
            payment.provider_order_id = (
                razorpay_order["id"]
            )

            payment.provider_payment_id = None
            payment.provider_signature = ""

            payment.status = (
                Payment.STATUS_CREATED
            )

            payment.failure_reason = ""
            payment.paid_at = None

            payment.amount = order.total
            payment.currency = "INR"

            payment.save(
                update_fields=[
                    "provider_order_id",
                    "provider_payment_id",
                    "provider_signature",
                    "status",
                    "failure_reason",
                    "paid_at",
                    "amount",
                    "currency",
                    "updated_at",
                ]
            )

            response_status = (
                status.HTTP_200_OK
            )

            message = (
                "Payment retry order "
                "created successfully."
            )

        else:
            payment = Payment.objects.create(
                user=request.user,
                order=order,
                amount=order.total,
                currency="INR",
                status=Payment.STATUS_CREATED,
                provider_order_id=(
                    razorpay_order["id"]
                ),
            )

            response_status = (
                status.HTTP_201_CREATED
            )

            message = (
                "Payment order "
                "created successfully."
            )

        return Response(
            {
                "message":
                    message,

                "key_id":
                    settings.RAZORPAY_KEY_ID,

                "razorpay_order_id":
                    payment.provider_order_id,

                "amount":
                    amount_in_paise,

                "currency":
                    payment.currency,

                "local_order_id":
                    order.id,

                "payment":
                    PaymentSerializer(
                        payment
                    ).data,
            },
            status=response_status
        )


class VerifyPaymentView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    @transaction.atomic
    def post(self, request):

        razorpay_order_id = str(
            request.data.get(
                "razorpay_order_id",
                ""
            )
        ).strip()

        razorpay_payment_id = str(
            request.data.get(
                "razorpay_payment_id",
                ""
            )
        ).strip()

        razorpay_signature = str(
            request.data.get(
                "razorpay_signature",
                ""
            )
        ).strip()

        if not razorpay_order_id:
            return Response(
                {
                    "razorpay_order_id":
                        "Razorpay order ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not razorpay_payment_id:
            return Response(
                {
                    "razorpay_payment_id":
                        "Razorpay payment ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not razorpay_signature:
            return Response(
                {
                    "razorpay_signature":
                        "Razorpay signature is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = (
                Payment.objects
                .select_for_update()
                .select_related(
                    "order",
                    "user"
                )
                .get(
                    provider_order_id=razorpay_order_id,
                    user=request.user
                )
            )

        except Payment.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Payment not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if payment.status == Payment.STATUS_PAID:
            return Response(
                {
                    "message":
                        "Payment is already verified.",

                    "payment":
                        PaymentSerializer(
                            payment
                        ).data
                },
                status=status.HTTP_200_OK
            )

        if payment.order.status == Order.STATUS_CANCELLED:
            return Response(
                {
                    "detail":
                        "Cancelled order cannot be marked as paid."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

        verification_data = {
            # Important:
            # Use the Razorpay order ID stored
            # in OUR database.
            "razorpay_order_id":
                payment.provider_order_id,

            "razorpay_payment_id":
                razorpay_payment_id,

            "razorpay_signature":
                razorpay_signature,
        }

        try:
            client.utility.verify_payment_signature(
                verification_data
            )

        except razorpay.errors.SignatureVerificationError:
            payment.status = Payment.STATUS_FAILED

            payment.failure_reason = (
                "Payment signature verification failed."
            )

            payment.save(
                update_fields=[
                    "status",
                    "failure_reason",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail":
                        "Payment verification failed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            return Response(
                {
                    "detail":
                        (
                            "Unable to verify payment. "
                            "Please try again."
                        )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        existing_payment = (
            Payment.objects
            .filter(
                provider_payment_id=
                    razorpay_payment_id
            )
            .exclude(
                id=payment.id
            )
            .exists()
        )

        if existing_payment:
            return Response(
                {
                    "detail":
                        (
                            "This Razorpay payment ID "
                            "has already been used."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.provider_payment_id = (
            razorpay_payment_id
        )

        payment.provider_signature = (
            razorpay_signature
        )

        payment.status = Payment.STATUS_PAID
        payment.failure_reason = ""

        payment.paid_at = timezone.now()

        payment.save(
            update_fields=[
                "provider_payment_id",
                "provider_signature",
                "status",
                "failure_reason",
                "paid_at",
                "updated_at",
            ]
        )

        queue_order_confirmation_email(
            payment.order_id
        )

        return Response(
            {
                "message":
                    "Payment verified successfully.",

                "payment":
                    PaymentSerializer(
                        payment
                    ).data
            },
            status=status.HTTP_200_OK
        )


@method_decorator(csrf_exempt, name="dispatch")
class RazorpayWebhookView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        signature = request.headers.get(
            "X-Razorpay-Signature"
        )

        if not signature:
            return Response(
                {
                    "detail":
                        "Webhook signature is missing."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        raw_body = request.body

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

        try:
            client.utility.verify_webhook_signature(
                raw_body.decode("utf-8"),
                signature,
                settings.RAZORPAY_WEBHOOK_SECRET,
            )

        except razorpay.errors.SignatureVerificationError:
            return Response(
                {
                    "detail":
                        "Invalid webhook signature."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            return Response(
                {
                    "detail":
                        "Unable to verify webhook."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payload = json.loads(
                raw_body.decode("utf-8")
            )

        except (
            json.JSONDecodeError,
            UnicodeDecodeError
        ):
            return Response(
                {
                    "detail":
                        "Invalid webhook payload."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        event = payload.get("event")


         
        # PAYMENT CAPTURED
         

        if event == "payment.captured":

            payment_entity = (
                payload
                .get("payload", {})
                .get("payment", {})
                .get("entity", {})
            )

            provider_payment_id = (
                payment_entity.get("id")
            )

            provider_order_id = (
                payment_entity.get("order_id")
            )

            if (
                not provider_payment_id
                or not provider_order_id
            ):
                return Response(
                    {
                        "detail":
                            "Payment data is missing."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():

                try:
                    payment = (
                        Payment.objects
                        .select_for_update()
                        .select_related("order")
                        .get(
                            provider_order_id=
                                provider_order_id
                        )
                    )

                except Payment.DoesNotExist:

                    try:
                        booking_payment = (
                            BookingPayment.objects
                            .select_for_update()
                            .select_related(
                                "booking"
                            )
                            .get(
                                provider_order_id=
                                    provider_order_id
                            )
                        )

                    except BookingPayment.DoesNotExist:
                        return Response(
                            {
                                "message":
                                    "Payment not found."
                            },
                            status=status.HTTP_200_OK
                        )

                    if (
                        booking_payment.status
                        == BookingPayment.STATUS_PAID
                    ):
                        return Response(
                            {
                                "message":
                                    (
                                        "Booking payment "
                                        "already processed."
                                    )
                            },
                            status=status.HTTP_200_OK
                        )

                    if (
                        booking_payment.booking.status
                        == Booking.STATUS_CANCELLED
                    ):
                        return Response(
                            {
                                "message":
                                    (
                                        "Cancelled booking "
                                        "payment ignored."
                                    )
                            },
                            status=status.HTTP_200_OK
                        )

                    duplicate_payment = (
                        BookingPayment.objects
                        .filter(
                            provider_payment_id=
                                provider_payment_id
                        )
                        .exclude(
                            id=booking_payment.id
                        )
                        .exists()
                    )

                    if duplicate_payment:
                        return Response(
                            {
                                "detail":
                                    (
                                        "Razorpay booking "
                                        "payment ID already exists."
                                    )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    booking_payment.provider_payment_id = (
                        provider_payment_id
                    )

                    booking_payment.status = (
                        BookingPayment.STATUS_PAID
                    )

                    booking_payment.failure_reason = ""

                    booking_payment.paid_at = (
                        timezone.now()
                    )

                    booking_payment.save(
                        update_fields=[
                            "provider_payment_id",
                            "status",
                            "failure_reason",
                            "paid_at",
                            "updated_at",
                        ]
                    )

                    booking = booking_payment.booking

                    # Advance payment successful.
                    # Booking intentionally remains Pending
                    # until admin confirms it.
                    queue_booking_confirmation_email(
                        booking.id
                    )

                    return Response(
                        {
                            "message":
                                (
                                    "Booking payment webhook "
                                    "processed successfully."
                                )
                        },
                        status=status.HTTP_200_OK
                    )

                if (
                    payment.status
                    == Payment.STATUS_PAID
                ):
                    return Response(
                        {
                            "message":
                                "Payment already processed."
                        },
                        status=status.HTTP_200_OK
                    )

                if (
                    payment.order.status
                    == Order.STATUS_CANCELLED
                ):
                    return Response(
                        {
                            "message":
                                "Cancelled order ignored."
                        },
                        status=status.HTTP_200_OK
                    )

                duplicate_payment = (
                    Payment.objects
                    .filter(
                        provider_payment_id=
                            provider_payment_id
                    )
                    .exclude(
                        id=payment.id
                    )
                    .exists()
                )

                if duplicate_payment:
                    return Response(
                        {
                            "detail":
                                (
                                    "Razorpay payment ID "
                                    "already exists."
                                )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                payment.provider_payment_id = (
                    provider_payment_id
                )

                payment.status = (
                    Payment.STATUS_PAID
                )

                payment.failure_reason = ""

                payment.paid_at = (
                    timezone.now()
                )

                payment.save(
                    update_fields=[
                        "provider_payment_id",
                        "status",
                        "failure_reason",
                        "paid_at",
                        "updated_at",
                    ]
                )

                queue_order_confirmation_email(
                    payment.order_id
                )

            return Response(
                {
                    "message":
                        "Payment webhook processed successfully."
                },
                status=status.HTTP_200_OK
            )


         
        # REFUND PROCESSED
         

        if event == "refund.processed":

            refund_entity = (
                payload
                .get("payload", {})
                .get("refund", {})
                .get("entity", {})
            )

            provider_refund_id = (
                refund_entity.get("id")
            )

            provider_payment_id = (
                refund_entity.get(
                    "payment_id"
                )
            )

            if (
                not provider_refund_id
                or not provider_payment_id
            ):
                return Response(
                    {
                        "detail":
                            "Refund data is missing."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():

                try:
                    payment = (
                        Payment.objects
                        .select_for_update()
                        .get(
                            provider_payment_id=
                                provider_payment_id
                        )
                    )

                except Payment.DoesNotExist:

                    try:
                        booking_payment = (
                            BookingPayment.objects
                            .select_for_update()
                            .select_related("booking")
                            .get(
                                provider_payment_id=
                                    provider_payment_id
                            )
                        )

                    except BookingPayment.DoesNotExist:
                        return Response(
                            {
                                "message":
                                    "Payment not found."
                            },
                            status=status.HTTP_200_OK
                        )

                    if (
                        booking_payment.refund_status
                        == BookingPayment.REFUND_PROCESSED
                    ):
                        return Response(
                            {
                                "message":
                                    "Booking refund already processed."
                            },
                            status=status.HTTP_200_OK
                        )

                    if (
                        booking_payment.provider_refund_id
                        and booking_payment.provider_refund_id
                        != provider_refund_id
                    ):
                        return Response(
                            {
                                "detail":
                                    "Booking refund ID does not match."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    booking_payment.provider_refund_id = (
                        provider_refund_id
                    )

                    booking_payment.refund_status = (
                        BookingPayment.REFUND_PROCESSED
                    )

                    booking_payment.status = (
                        BookingPayment.STATUS_REFUNDED
                    )

                    booking_payment.refunded_at = (
                        timezone.now()
                    )

                    booking_payment.failure_reason = ""

                    booking_payment.save(
                        update_fields=[
                            "provider_refund_id",
                            "refund_status",
                            "status",
                            "refunded_at",
                            "failure_reason",
                            "updated_at",
                        ]
                    )

                    queue_booking_refund_email(
                        booking_payment.booking_id
                    )

                    return Response(
                        {
                            "message":
                                (
                                    "Booking refund processed "
                                    "successfully."
                                )
                        },
                        status=status.HTTP_200_OK
                    )

                if (
                    payment.refund_status
                    == Payment.REFUND_PROCESSED
                ):
                    return Response(
                        {
                            "message":
                                "Refund already processed."
                        },
                        status=status.HTTP_200_OK
                    )

                if (
                    payment.provider_refund_id
                    and payment.provider_refund_id
                    != provider_refund_id
                ):
                    return Response(
                        {
                            "detail":
                                "Refund ID does not match."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                payment.provider_refund_id = (
                    provider_refund_id
                )

                payment.refund_status = (
                    Payment.REFUND_PROCESSED
                )

                payment.status = (
                    Payment.STATUS_REFUNDED
                )

                payment.refunded_at = (
                    timezone.now()
                )

                payment.failure_reason = ""

                payment.save(
                    update_fields=[
                        "provider_refund_id",
                        "refund_status",
                        "status",
                        "refunded_at",
                        "failure_reason",
                        "updated_at",
                    ]
                )

                queue_refund_email(
                    payment.order_id
                )

            return Response(
                {
                    "message":
                        "Refund processed successfully."
                },
                status=status.HTTP_200_OK
            )


         
        # REFUND FAILED
         

        if event == "refund.failed":

            refund_entity = (
                payload
                .get("payload", {})
                .get("refund", {})
                .get("entity", {})
            )

            provider_refund_id = (
                refund_entity.get("id")
            )

            provider_payment_id = (
                refund_entity.get(
                    "payment_id"
                )
            )

            if (
                not provider_refund_id
                or not provider_payment_id
            ):
                return Response(
                    {
                        "detail":
                            "Refund data is missing."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():

                try:
                    payment = (
                        Payment.objects
                        .select_for_update()
                        .get(
                            provider_payment_id=
                                provider_payment_id
                        )
                    )

                except Payment.DoesNotExist:

                    try:
                        booking_payment = (
                            BookingPayment.objects
                            .select_for_update()
                            .get(
                                provider_payment_id=
                                    provider_payment_id
                            )
                        )

                    except BookingPayment.DoesNotExist:
                        return Response(
                            {
                                "message":
                                    "Payment not found."
                            },
                            status=status.HTTP_200_OK
                        )

                    if (
                        booking_payment.refund_status
                        == BookingPayment.REFUND_PROCESSED
                    ):
                        return Response(
                            {
                                "message":
                                    (
                                        "Booking refund is already "
                                        "processed."
                                    )
                            },
                            status=status.HTTP_200_OK
                        )

                    if (
                        booking_payment.provider_refund_id
                        and booking_payment.provider_refund_id
                        != provider_refund_id
                    ):
                        return Response(
                            {
                                "detail":
                                    "Booking refund ID does not match."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    booking_payment.provider_refund_id = (
                        provider_refund_id
                    )

                    booking_payment.refund_status = (
                        BookingPayment.REFUND_FAILED
                    )

                    booking_payment.status = (
                        BookingPayment.STATUS_PAID
                    )

                    booking_payment.failure_reason = (
                        "Refund processing failed."
                    )

                    booking_payment.refunded_at = None

                    booking_payment.save(
                        update_fields=[
                            "provider_refund_id",
                            "refund_status",
                            "status",
                            "failure_reason",
                            "refunded_at",
                            "updated_at",
                        ]
                    )

                    return Response(
                        {
                            "message":
                                "Booking refund failure recorded."
                        },
                        status=status.HTTP_200_OK
                    )

                if (
                    payment.refund_status
                    == Payment.REFUND_PROCESSED
                ):
                    return Response(
                        {
                            "message":
                                (
                                    "Refund is already "
                                    "processed."
                                )
                        },
                        status=status.HTTP_200_OK
                    )

                if (
                    payment.provider_refund_id
                    and payment.provider_refund_id
                    != provider_refund_id
                ):
                    return Response(
                        {
                            "detail":
                                "Refund ID does not match."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                payment.provider_refund_id = (
                    provider_refund_id
                )

                payment.refund_status = (
                    Payment.REFUND_FAILED
                )

                # Payment stays Paid because
                # refund did not succeed.
                payment.status = (
                    Payment.STATUS_PAID
                )

                payment.failure_reason = (
                    "Refund processing failed."
                )

                payment.refunded_at = None

                payment.save(
                    update_fields=[
                        "provider_refund_id",
                        "refund_status",
                        "status",
                        "failure_reason",
                        "refunded_at",
                        "updated_at",
                    ]
                )

            return Response(
                {
                    "message":
                        "Refund failure recorded."
                },
                status=status.HTTP_200_OK
            )


         
        # OTHER EVENTS
         

        return Response(
            {
                "message":
                    "Webhook received."
            },
            status=status.HTTP_200_OK
        )


class CreateBookingPaymentOrderView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    ADVANCE_AMOUNT = Decimal("500.00")

    @transaction.atomic
    def post(self, request, booking_id):

        try:
            booking = (
                Booking.objects
                .select_for_update()
                .get(
                    id=booking_id,
                    user=request.user
                )
            )

        except Booking.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Booking not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.status == Booking.STATUS_CANCELLED:
            return Response(
                {
                    "detail":
                        "Payment cannot be created for a cancelled booking."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = (
            BookingPayment.objects
            .select_for_update()
            .filter(
                booking=booking
            )
            .first()
        )

        if (
            payment
            and payment.status
            == BookingPayment.STATUS_PAID
        ):
            return Response(
                {
                    "detail":
                        "Booking advance is already paid.",

                    "payment":
                        BookingPaymentSerializer(
                            payment
                        ).data
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

        amount_in_paise = int(
            self.ADVANCE_AMOUNT
            * Decimal("100")
        )

        receipt = (
            f"booking_{booking.id}_"
            f"{int(timezone.now().timestamp())}"
        )

        try:
            razorpay_order = (
                client.order.create(
                    {
                        "amount":
                            amount_in_paise,

                        "currency":
                            "INR",

                        "receipt":
                            receipt,

                        "notes": {
                            "local_booking_id":
                                str(booking.id),

                            "user_id":
                                str(request.user.id),

                            "payment_type":
                                "booking_advance",
                        },
                    }
                )
            )

        except Exception:
            return Response(
                {
                    "detail":
                        (
                            "Unable to create booking "
                            "payment order. Please try again."
                        )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        if payment:
            payment.provider_order_id = (
                razorpay_order["id"]
            )

            payment.provider_payment_id = None
            payment.provider_signature = ""

            payment.status = (
                BookingPayment.STATUS_CREATED
            )

            payment.failure_reason = ""
            payment.paid_at = None

            payment.amount = self.ADVANCE_AMOUNT
            payment.currency = "INR"

            payment.save(
                update_fields=[
                    "provider_order_id",
                    "provider_payment_id",
                    "provider_signature",
                    "status",
                    "failure_reason",
                    "paid_at",
                    "amount",
                    "currency",
                    "updated_at",
                ]
            )

            response_status = (
                status.HTTP_200_OK
            )

            message = (
                "Booking payment retry order "
                "created successfully."
            )

        else:
            payment = (
                BookingPayment.objects.create(
                    user=request.user,
                    booking=booking,
                    amount=self.ADVANCE_AMOUNT,
                    currency="INR",
                    status=(
                        BookingPayment.STATUS_CREATED
                    ),
                    provider_order_id=(
                        razorpay_order["id"]
                    ),
                )
            )

            response_status = (
                status.HTTP_201_CREATED
            )

            message = (
                "Booking payment order "
                "created successfully."
            )

        return Response(
            {
                "message":
                    message,

                "key_id":
                    settings.RAZORPAY_KEY_ID,

                "razorpay_order_id":
                    payment.provider_order_id,

                "amount":
                    amount_in_paise,

                "currency":
                    payment.currency,

                "local_booking_id":
                    booking.id,

                "payment":
                    BookingPaymentSerializer(
                        payment
                    ).data,
            },
            status=response_status
        )


class VerifyBookingPaymentView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    @transaction.atomic
    def post(self, request):

        razorpay_order_id = str(
            request.data.get(
                "razorpay_order_id",
                ""
            )
        ).strip()

        razorpay_payment_id = str(
            request.data.get(
                "razorpay_payment_id",
                ""
            )
        ).strip()

        razorpay_signature = str(
            request.data.get(
                "razorpay_signature",
                ""
            )
        ).strip()

        if not razorpay_order_id:
            return Response(
                {
                    "razorpay_order_id":
                        "Razorpay order ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not razorpay_payment_id:
            return Response(
                {
                    "razorpay_payment_id":
                        "Razorpay payment ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not razorpay_signature:
            return Response(
                {
                    "razorpay_signature":
                        "Razorpay signature is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = (
                BookingPayment.objects
                .select_for_update()
                .select_related(
                    "booking",
                    "user"
                )
                .get(
                    provider_order_id=
                        razorpay_order_id,

                    user=request.user
                )
            )

        except BookingPayment.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Booking payment not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if (
            payment.status
            == BookingPayment.STATUS_PAID
        ):
            return Response(
                {
                    "message":
                        "Booking payment is already verified.",

                    "payment":
                        BookingPaymentSerializer(
                            payment
                        ).data
                },
                status=status.HTTP_200_OK
            )

        if (
            payment.booking.status
            == Booking.STATUS_CANCELLED
        ):
            return Response(
                {
                    "detail":
                        (
                            "Cancelled booking cannot "
                            "be marked as paid."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

        verification_data = {
            "razorpay_order_id":
                payment.provider_order_id,

            "razorpay_payment_id":
                razorpay_payment_id,

            "razorpay_signature":
                razorpay_signature,
        }

        try:
            client.utility.verify_payment_signature(
                verification_data
            )

        except razorpay.errors.SignatureVerificationError:
            payment.status = (
                BookingPayment.STATUS_FAILED
            )

            payment.failure_reason = (
                "Payment signature verification failed."
            )

            payment.save(
                update_fields=[
                    "status",
                    "failure_reason",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail":
                        "Booking payment verification failed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            return Response(
                {
                    "detail":
                        (
                            "Unable to verify booking payment. "
                            "Please try again."
                        )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        duplicate_payment = (
            BookingPayment.objects
            .filter(
                provider_payment_id=
                    razorpay_payment_id
            )
            .exclude(
                id=payment.id
            )
            .exists()
        )

        if duplicate_payment:
            return Response(
                {
                    "detail":
                        (
                            "This Razorpay payment ID "
                            "has already been used."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.provider_payment_id = (
            razorpay_payment_id
        )

        payment.provider_signature = (
            razorpay_signature
        )

        payment.status = (
            BookingPayment.STATUS_PAID
        )

        payment.failure_reason = ""

        payment.paid_at = (
            timezone.now()
        )

        payment.save(
            update_fields=[
                "provider_payment_id",
                "provider_signature",
                "status",
                "failure_reason",
                "paid_at",
                "updated_at",
            ]
        )

        booking = payment.booking

        # Advance payment successful.
        # Booking intentionally remains Pending
        # until admin confirms it.
        queue_booking_confirmation_email(
            booking.id
        )

        return Response(
            {
                "message":
                    (
                        "Booking advance payment "
                        "verified successfully."
                    ),

                "payment":
                    BookingPaymentSerializer(
                        payment
                    ).data
            },
            status=status.HTTP_200_OK
        )    