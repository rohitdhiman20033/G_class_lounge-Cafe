from rest_framework import serializers

from .models import Payment

from .models import BookingPayment


class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment

        fields = [
            "id",
            "order",
            "provider",
            "amount",
            "currency",
            "status",

            "provider_order_id",
            "provider_payment_id",

            "failure_reason",

            "paid_at",

            "provider_refund_id",
            "refund_status",
            "refund_reason",
            "refunded_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = fields





class BookingPaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = BookingPayment

        fields = [
            "id",
            "user",
            "booking",
            "provider",
            "amount",
            "currency",
            "status",

            "provider_order_id",
            "provider_payment_id",

            "failure_reason",
            "paid_at",

            "provider_refund_id",
            "refund_status",
            "refund_reason",
            "refunded_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = fields
