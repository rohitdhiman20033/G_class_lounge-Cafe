from django.db import transaction
from django.utils import timezone

from decimal import Decimal

import razorpay

from django.conf import settings

from payments.models import Payment

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from menu.models import MenuItem

from .models import Order
from .serializers import OrderSerializer
from .email_service import (
    queue_cancellation_email,
    queue_refund_email,
)


class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser:
            return Order.objects.all()

        return Order.objects.filter(
            user=user,
            hidden_by_user=False
        )

    def perform_create(self, serializer):
        serializer.save()


class OrderRetrieveUpdateView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or user.is_superuser:
            return Order.objects.all()

        return Order.objects.filter(
            user=user
        )

    def update(self, request, *args, **kwargs):
        if not (
            request.user.is_staff
            or request.user.is_superuser
        ):
            return Response(
                {
                    "detail":
                        "Only admin can update orders."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        order = self.get_object()

        new_status = request.data.get(
            "status"
        )

        if not new_status:
            return Response(
                {
                    "detail":
                        "Order status is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_transitions = {
            Order.STATUS_PENDING: [
                Order.STATUS_PREPARING,
            ],

            Order.STATUS_PREPARING: [
                Order.STATUS_COMPLETED,
            ],

            Order.STATUS_COMPLETED: [],

            Order.STATUS_CANCELLED: [],
        }

        allowed_statuses = (
            allowed_transitions.get(
                order.status,
                []
            )
        )

        if new_status not in allowed_statuses:
            return Response(
                {
                    "detail":
                        (
                            "Order status cannot be changed "
                            f"from {order.status} "
                            f"to {new_status}."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().update(
            request,
            *args,
            **kwargs
        )


class CancelOrderView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request, pk):

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
                        "Please provide a cancellation reason."
                },
                status=status.HTTP_400_BAD_REQUEST
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
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            try:
                order = (
                    Order.objects
                    .select_for_update()
                    .get(
                        pk=pk,
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

            if (
                order.status
                == Order.STATUS_CANCELLED
            ):
                return Response(
                    {
                        "detail":
                            "Order is already cancelled."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                order.status
                != Order.STATUS_PENDING
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Only pending orders "
                                "can be cancelled."
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

            if (
                payment
                and payment.refund_status
                == Payment.REFUND_PENDING
            ):
                return Response(
                    {
                        "detail":
                            (
                                "A refund is already "
                                "being processed."
                            )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                payment
                and payment.refund_status
                == Payment.REFUND_PROCESSED
            ):
                return Response(
                    {
                        "detail":
                            (
                                "This payment has already "
                                "been refunded."
                            )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            paid_payment = (
                payment
                and payment.status
                == Payment.STATUS_PAID
            )

            if (
                paid_payment
                and not payment.provider_payment_id
            ):
                return Response(
                    {
                        "detail":
                            (
                                "Paid payment is missing "
                                "provider payment ID."
                            )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


        
        # REFUND PAID PAYMENT
        

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
                                "local_order_id":
                                    str(order.id),

                                "reason":
                                    reason[:250],
                            },

                            "receipt":
                                (
                                    f"refund_order_"
                                    f"{order.id}"
                                ),
                        }
                    )
                )

            except Exception:
                with transaction.atomic():
                    locked_payment = (
                        Payment.objects
                        .select_for_update()
                        .get(
                            id=payment.id
                        )
                    )

                    locked_payment.refund_status = (
                        Payment.REFUND_FAILED
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
                                "initiated. Order was "
                                "not cancelled."
                            )
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )


        
        # FINAL DATABASE UPDATE
        

        with transaction.atomic():

            order = (
                Order.objects
                .select_for_update()
                .get(
                    pk=pk,
                    user=request.user
                )
            )

            payment = (
                Payment.objects
                .select_for_update()
                .filter(
                    order=order
                )
                .first()
            )

            if (
                order.status
                == Order.STATUS_CANCELLED
            ):
                return Response(
                    {
                        "detail":
                            "Order is already cancelled."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # Save refund response
            if paid_payment and refund_data:

                refund_id = refund_data.get(
                    "id"
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
                                    "invalid. Order was "
                                    "not cancelled."
                                )
                        },
                        status=status.HTTP_502_BAD_GATEWAY
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
                        Payment.REFUND_PROCESSED
                    )

                    payment.status = (
                        Payment.STATUS_REFUNDED
                    )

                    payment.refunded_at = (
                        timezone.now()
                    )

                elif (
                    provider_refund_status
                    == "failed"
                ):
                    payment.refund_status = (
                        Payment.REFUND_FAILED
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
                                    "Order was not cancelled."
                                )
                        },
                        status=status.HTTP_502_BAD_GATEWAY
                    )

                else:
                    payment.refund_status = (
                        Payment.REFUND_PENDING
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


            # Restore stock
            order_items = list(
                order.items
                .select_related(
                    "menu_item"
                )
                .all()
            )

            menu_item_ids = sorted({
                item.menu_item_id
                for item in order_items
                if item.menu_item_id
            })

            locked_menu_items = {
                item.id: item
                for item in (
                    MenuItem.objects
                    .select_for_update()
                    .filter(
                        id__in=menu_item_ids
                    )
                )
            }

            for order_item in order_items:
                menu_item = (
                    locked_menu_items.get(
                        order_item.menu_item_id
                    )
                )

                if not menu_item:
                    continue

                menu_item.stock += (
                    order_item.quantity
                )

                menu_item.save(
                    update_fields=[
                        "stock"
                    ]
                )


            order.status = (
                Order.STATUS_CANCELLED
            )

            order.cancellation_reason = (
                reason
            )

            order.cancelled_at = (
                timezone.now()
            )

            order.save(
                update_fields=[
                    "status",
                    "cancellation_reason",
                    "cancelled_at",
                    "updated_at",
                ]
            )



        queue_cancellation_email(
            order.id
        )

        if (
            payment
            and payment.refund_status
            == Payment.REFUND_PROCESSED
        ):
            queue_refund_email(
                order.id
            )

        message = (
            "Order cancelled successfully."
        )

        if (
            payment
            and payment.refund_status
            == Payment.REFUND_PENDING
        ):
            message = (
                "Order cancelled successfully. "
                "Refund is being processed."
            )

        elif (
            payment
            and payment.refund_status
            == Payment.REFUND_PROCESSED
        ):
            message = (
                "Order cancelled and refund "
                "processed successfully."
            )


        return Response(
            {
                "message":
                    message,

                "order":
                    OrderSerializer(
                        order,
                        context={
                            "request":
                                request
                        }
                    ).data
            },
            status=status.HTTP_200_OK
        )

class HideOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(
                pk=pk,
                user=request.user
            )

        except Order.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status not in [
            Order.STATUS_COMPLETED,
            Order.STATUS_CANCELLED,
        ]:
            return Response(
                {
                    "detail":
                        (
                            "Only completed or cancelled "
                            "orders can be removed from history."
                        )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.hidden_by_user:
            return Response(
                {
                    "detail":
                        "Order is already removed from history."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        order.hidden_by_user = True

        order.save(
            update_fields=[
                "hidden_by_user",
                "updated_at",
            ]
        )

        return Response(
            {
                "message":
                    "Order removed from history successfully."
            },
            status=status.HTTP_200_OK
        )