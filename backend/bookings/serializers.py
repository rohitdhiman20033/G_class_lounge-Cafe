from django.utils import timezone
from rest_framework import serializers

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):

    payment_status = serializers.SerializerMethodField()
    payment_provider = serializers.SerializerMethodField()
    advance_amount = serializers.SerializerMethodField()

    refund_status = serializers.SerializerMethodField()
    refund_reason = serializers.SerializerMethodField()
    refunded_at = serializers.SerializerMethodField()

    class Meta:
        model = Booking

        fields = [
            "id",
            "user",
            "name",
            "phone",
            "date",
            "time",
            "guests",
            "description",
            "status",

            "payment_status",
            "payment_provider",
            "advance_amount",

            "refund_status",
            "refund_reason",
            "refunded_at",

            "cancellation_reason",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",

            "payment_status",
            "payment_provider",
            "advance_amount",

            "refund_status",
            "refund_reason",
            "refunded_at",

            "cancellation_reason",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]


    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except Exception:
            return "Unpaid"


    def get_payment_provider(self, obj):
        try:
            return obj.payment.provider
        except Exception:
            return None


    def get_advance_amount(self, obj):
        try:
            return obj.payment.amount
        except Exception:
            return "500.00"


    def get_refund_status(self, obj):
        try:
            return obj.payment.refund_status
        except Exception:
            return None


    def get_refund_reason(self, obj):
        try:
            return obj.payment.refund_reason
        except Exception:
            return ""


    def get_refunded_at(self, obj):
        try:
            return obj.payment.refunded_at
        except Exception:
            return None


    def validate_name(self, value):
        name = value.strip()

        if len(name) < 2:
            raise serializers.ValidationError(
                "Please enter a valid name."
            )

        return name


    def validate_phone(self, value):
        phone = value.strip()

        if (
            len(phone) != 10
            or not phone.isdigit()
            or phone[0] not in "6789"
        ):
            raise serializers.ValidationError(
                "Enter a valid 10-digit mobile number."
            )

        return phone


    def validate_guests(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "At least 1 guest is required."
            )

        if value > 20:
            raise serializers.ValidationError(
                "Online booking is limited to 20 guests."
            )

        return value


    def validate(self, attrs):
        booking_date = attrs.get("date")
        booking_time = attrs.get("time")

        if not booking_date or not booking_time:
            return attrs

        booking_datetime = timezone.make_aware(
            timezone.datetime.combine(
                booking_date,
                booking_time
            ),
            timezone.get_current_timezone()
        )

        if booking_datetime <= timezone.now():
            raise serializers.ValidationError(
                {
                    "date":
                        "Booking date and time must be in the future."
                }
            )

        return attrs


    def create(self, validated_data):
        request = self.context.get(
            "request"
        )

        if (
            not request
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                "Authentication is required."
            )

        return Booking.objects.create(
            user=request.user,
            **validated_data
        )