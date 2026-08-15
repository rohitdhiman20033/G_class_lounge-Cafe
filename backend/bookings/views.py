from decimal import Decimal

import razorpay

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.models import BookingPayment

from .email_service import (
    queue_booking_cancellation_email,
    queue_booking_refund_email,
)

from .models import Booking
from .serializers import BookingSerializer


class BookingListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = BookingSerializer
    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):
        user = self.request.user

        if (
            user.is_staff
            or user.is_superuser
        ):
            return Booking.objects.all()

        return Booking.objects.filter(
            user=user,
            hidden_by_user=False
        )

    def perform_create(
        self,
        serializer
    ):
        serializer.save()


class BookingRetrieveUpdateView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = BookingSerializer
    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):
        user = self.request.user

        if (
            user.is_staff
            or user.is_superuser
        ):
            return Booking.objects.all()

        return Booking.objects.filter(
            user=user
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):
        if not (
            request.user.is_staff
            or request.user.is_superuser
        ):
            return Response(
                {
                    "detail":
                        "Only admin can update bookings."
                },
                status=
                    status.HTTP_403_FORBIDDEN
            )

        booking = self.get_object()

        new_status = request.data.get(
            "status"
        )

        if not new_status:
            return Response(
                {
                    "detail":
                        "Booking status is required."
                },
                status=
                    status.HTTP_400_BAD_REQUEST
            )

        # Payment success keeps the booking Pending.
        # Admin can confirm it after reviewing the booking.
        allowed_transitions = {
            Booking.STATUS_PENDING: [
                Booking.STATUS_CONFIRMED,
            ],

            Booking.STATUS_CONFIRMED: [
                Booking.STATUS_COMPLETED,
            ],

            Booking.STATUS_COMPLETED: [],

            Booking.STATUS_CANCELLED: [],
        }

        allowed_statuses = (
            allowed_transitions.get(
                booking.status,
                []
            )
        )

        if new_status not in allowed_statuses:

            if (
                new_status
                == Booking.STATUS_CANCELLED
            ):
                detail = (
                    "Use the booking cancellation "
                    "endpoint to cancel this booking."
                )

            else:
                detail = (
                    "Booking status cannot be changed "
                    f"from {booking.status} "
                    f"to {new_status}."
                )

            return Response(
                {
                    "detail": detail
                },
                status=
                    status.HTTP_400_BAD_REQUEST
            )

        return super().update(
            request,
            *args,
            **kwargs
        )


class CancelBookingView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
        pk
    ):
        reason = str(
            request.data.get(
                "reason",
                ""
            )
        ).strip()

        if not reason:
            return Response(
                {
                    "reason":
                        (
                            "Please provide a "
                            "cancellation reason."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST
            )

        if len(reason) > 500:
            return Response(
                {
                    "reason":
                        (
                            "Cancellation reason cannot "
                            "exceed 500 characters."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST
            )

        is_admin = (
            request.user.is_staff
            or request.user.is_superuser
        )

        # =====================================
        # LOCK + VALIDATE BOOKING
        # =====================================

        with transaction.atomic():

            try:
                queryset = (
                    Booking.objects
                    .select_for_update()
                )

                if is_admin:
                    booking = queryset.get(
                        pk=pk
                    )
                else:
                    booking = queryset.get(
                        pk=pk,
                        user=request.user
                    )

            except Booking.DoesNotExist:
                return Response(
                    {
                        "detail":
                            "Booking not found."
                    },
                    status=
                        status.HTTP_404_NOT_FOUND
                )

            if (
                booking.status
                == Booking.STATUS_CANCELLED
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Booking is already "
                                "cancelled."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
                )

            # USER:
            # only Pending booking can be cancelled.
            if (
                not is_admin
                and booking.status
                != Booking.STATUS_PENDING
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Only pending bookings "
                                "can be cancelled by user."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
                )

            # ADMIN:
            # Pending or Confirmed booking can cancel.
            if (
                is_admin
                and booking.status
                not in [
                    Booking.STATUS_PENDING,
                    Booking.STATUS_CONFIRMED,
                ]
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Only pending or confirmed "
                                "bookings can be cancelled."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
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
                and payment.refund_status
                == BookingPayment.REFUND_PENDING
            ):
                return Response(
                    {
                        "detail":
                            (
                                "A booking refund is "
                                "already being processed."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
                )

            if (
                payment
                and payment.refund_status
                == BookingPayment.REFUND_PROCESSED
            ):
                return Response(
                    {
                        "detail":
                            (
                                "This booking payment "
                                "has already been refunded."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
                )

            paid_payment = (
                payment
                and payment.status
                == BookingPayment.STATUS_PAID
            )

            # A paid booking may still be Pending.
            # User is allowed to cancel it while Pending;
            # the paid ₹500 advance will be refunded.

            if (
                paid_payment
                and not payment.provider_payment_id
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Paid booking payment "
                                "is missing provider "
                                "payment ID."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
                )

            payment_id = (
                payment.id
                if payment
                else None
            )

        # =====================================
        # REFUND ₹500 PAID ADVANCE
        # =====================================

        refund_data = None

        if paid_payment:

            client = razorpay.Client(
                auth=(
                    settings.RAZORPAY_KEY_ID,
                    settings.RAZORPAY_KEY_SECRET,
                )
            )

            amount_in_paise = int(
                payment.amount
                * Decimal("100")
            )

            try:
                refund_data = (
                    client.payment.refund(
                        payment.provider_payment_id,
                        {
                            "amount":
                                amount_in_paise,

                            "speed":
                                "normal",

                            "notes": {
                                "local_booking_id":
                                    str(booking.id),

                                "reason":
                                    reason[:250],

                                "payment_type":
                                    "booking_advance",
                            },

                            "receipt":
                                (
                                    "refund_booking_"
                                    f"{booking.id}"
                                ),
                        }
                    )
                )

            except Exception:

                if payment_id:
                    with transaction.atomic():

                        locked_payment = (
                            BookingPayment.objects
                            .select_for_update()
                            .get(
                                id=payment_id
                            )
                        )

                        locked_payment.refund_status = (
                            BookingPayment
                            .REFUND_FAILED
                        )

                        locked_payment.refund_reason = (
                            reason
                        )

                        locked_payment.save(
                            update_fields=[
                                "refund_status",
                                "refund_reason",
                                "updated_at",
                            ]
                        )

                return Response(
                    {
                        "detail":
                            (
                                "Refund could not be "
                                "initiated. Booking was "
                                "not cancelled."
                            )
                    },
                    status=
                        status.HTTP_502_BAD_GATEWAY
                )

        # =====================================
        # FINAL DATABASE UPDATE
        # =====================================

        with transaction.atomic():

            booking = (
                Booking.objects
                .select_for_update()
                .get(
                    pk=pk
                )
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
                booking.status
                == Booking.STATUS_CANCELLED
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Booking is already "
                                "cancelled."
                            )
                    },
                    status=
                        status.HTTP_400_BAD_REQUEST
                )

            # =================================
            # SAVE RAZORPAY REFUND RESPONSE
            # =================================

            if (
                paid_payment
                and refund_data
                and payment
            ):
                refund_id = (
                    refund_data.get(
                        "id"
                    )
                )

                provider_refund_status = str(
                    refund_data.get(
                        "status",
                        ""
                    )
                ).lower()

                if not refund_id:
                    return Response(
                        {
                            "detail":
                                (
                                    "Refund response was "
                                    "invalid. Booking was "
                                    "not cancelled."
                                )
                        },
                        status=
                            status.HTTP_502_BAD_GATEWAY
                    )

                payment.provider_refund_id = (
                    refund_id
                )

                payment.refund_reason = (
                    reason
                )

                if (
                    provider_refund_status
                    == "processed"
                ):
                    payment.refund_status = (
                        BookingPayment
                        .REFUND_PROCESSED
                    )

                    payment.status = (
                        BookingPayment
                        .STATUS_REFUNDED
                    )

                    payment.refunded_at = (
                        timezone.now()
                    )

                elif (
                    provider_refund_status
                    == "failed"
                ):
                    payment.refund_status = (
                        BookingPayment
                        .REFUND_FAILED
                    )

                    payment.save(
                        update_fields=[
                            "provider_refund_id",
                            "refund_status",
                            "refund_reason",
                            "updated_at",
                        ]
                    )

                    return Response(
                        {
                            "detail":
                                (
                                    "Refund failed. "
                                    "Booking was not "
                                    "cancelled."
                                )
                        },
                        status=
                            status.HTTP_502_BAD_GATEWAY
                    )

                else:
                    payment.refund_status = (
                        BookingPayment
                        .REFUND_PENDING
                    )

                payment.save(
                    update_fields=[
                        "provider_refund_id",
                        "refund_status",
                        "refund_reason",
                        "status",
                        "refunded_at",
                        "updated_at",
                    ]
                )

            # =================================
            # CANCEL BOOKING
            # =================================

            booking.status = (
                Booking.STATUS_CANCELLED
            )

            booking.cancellation_reason = (
                reason
            )

            booking.cancelled_at = (
                timezone.now()
            )

            booking.save(
                update_fields=[
                    "status",
                    "cancellation_reason",
                    "cancelled_at",
                    "updated_at",
                ]
            )

            # Send only AFTER DB commit.
            queue_booking_cancellation_email(
                booking.id
            )

            if (
                payment
                and payment.refund_status
                == BookingPayment.REFUND_PROCESSED
            ):
                queue_booking_refund_email(
                    booking.id
                )

        # =====================================
        # RESPONSE
        # =====================================

        message = (
            "Booking cancelled successfully."
        )

        if (
            payment
            and payment.refund_status
            == BookingPayment.REFUND_PENDING
        ):
            message = (
                "Booking cancelled successfully. "
                "₹500 advance refund is being processed."
            )

        elif (
            payment
            and payment.refund_status
            == BookingPayment.REFUND_PROCESSED
        ):
            message = (
                "Booking cancelled and ₹500 "
                "advance refund processed successfully."
            )

        return Response(
            {
                "message":
                    message,

                "booking":
                    BookingSerializer(
                        booking,
                        context={
                            "request":
                                request
                        }
                    ).data
            },
            status=status.HTTP_200_OK
        )


class HideBookingView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
        pk
    ):
        try:
            booking = (
                Booking.objects.get(
                    pk=pk,
                    user=request.user
                )
            )

        except Booking.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Booking not found."
                },
                status=
                    status.HTTP_404_NOT_FOUND
            )

        if booking.status not in [
            Booking.STATUS_COMPLETED,
            Booking.STATUS_CANCELLED,
        ]:
            return Response(
                {
                    "detail":
                        (
                            "Only completed or cancelled "
                            "bookings can be removed "
                            "from history."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST
            )

        if booking.hidden_by_user:
            return Response(
                {
                    "detail":
                        (
                            "Booking is already "
                            "removed from history."
                        )
                },
                status=
                    status.HTTP_400_BAD_REQUEST
            )

        booking.hidden_by_user = True

        booking.save(
            update_fields=[
                "hidden_by_user",
                "updated_at",
            ]
        )

        return Response(
            {
                "message":
                    (
                        "Booking removed from "
                        "history successfully."
                    )
            },
            status=status.HTTP_200_OK
        )  