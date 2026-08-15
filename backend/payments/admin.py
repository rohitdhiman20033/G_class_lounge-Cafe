from zoneinfo import ZoneInfo

from django.contrib import admin
from django.utils import timezone

from .models import Payment


IST = ZoneInfo("Asia/Kolkata")


def format_ist(value):
    if not value:
        return "—"

    local_value = timezone.localtime(
        value,
        IST
    )

    return local_value.strftime(
        "%d %b %Y, %I:%M:%S %p"
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "order",
        "user",
        "provider",
        "amount",
        "currency",
        "status",
        "refund_status",
        "provider_payment_id",
        "provider_refund_id",
        "paid_at_ist",
        "refunded_at_ist",
        "created_at_ist",
    ]

    list_filter = [
        "provider",
        "status",
        "refund_status",
        "currency",
        "created_at",
        "paid_at",
        "refunded_at",
    ]

    search_fields = [
        "id",
        "order__id",
        "user__username",
        "user__email",
        "provider_order_id",
        "provider_payment_id",
        "provider_refund_id",
    ]

    readonly_fields = [
        "id",
        "user",
        "order",
        "provider",
        "amount",
        "currency",
        "status",

        "provider_order_id",
        "provider_payment_id",
        "provider_signature",
        "failure_reason",

        "paid_at_ist",

        "provider_refund_id",
        "refund_status",
        "refund_reason",

        "refunded_at_ist",

        "created_at_ist",
        "updated_at_ist",
    ]

    ordering = [
        "-created_at"
    ]

    list_per_page = 50

    fieldsets = (
        (
            "Payment",
            {
                "fields": (
                    "id",
                    "order",
                    "user",
                    "provider",
                    "amount",
                    "currency",
                    "status",
                )
            },
        ),

        (
            "Razorpay Details",
            {
                "fields": (
                    "provider_order_id",
                    "provider_payment_id",
                    "provider_signature",
                    "failure_reason",
                    "paid_at_ist",
                )
            },
        ),

        (
            "Refund Details",
            {
                "fields": (
                    "provider_refund_id",
                    "refund_status",
                    "refund_reason",
                    "refunded_at_ist",
                )
            },
        ),

        (
            "Timestamps",
            {
                "fields": (
                    "created_at_ist",
                    "updated_at_ist",
                )
            },
        ),
    )

    @admin.display(
        description="Paid At (IST)",
        ordering="paid_at",
    )
    def paid_at_ist(self, obj):
        return format_ist(
            obj.paid_at
        )

    @admin.display(
        description="Refunded At (IST)",
        ordering="refunded_at",
    )
    def refunded_at_ist(self, obj):
        return format_ist(
            obj.refunded_at
        )

    @admin.display(
        description="Created At (IST)",
        ordering="created_at",
    )
    def created_at_ist(self, obj):
        return format_ist(
            obj.created_at
        )

    @admin.display(
        description="Updated At (IST)",
        ordering="updated_at",
    )
    def updated_at_ist(self, obj):
        return format_ist(
            obj.updated_at
        )

    def has_add_permission(
        self,
        request
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None
    ):
        return False