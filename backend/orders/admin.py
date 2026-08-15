from zoneinfo import ZoneInfo

from django.contrib import admin
from django.utils import timezone

from .models import Order, OrderItem


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


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False

    readonly_fields = (
        "menu_item",
        "item_name",
        "quantity",
        "price",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customer_name",
        "phone",
        "total",
        "status",
        "hidden_by_user",
        "created_at_ist",
    )

    list_filter = (
        "status",
        "hidden_by_user",
        "created_at",
    )

    search_fields = (
        "customer_name",
        "phone",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "user",
        "customer_name",
        "phone",
        "total",
        "hidden_by_user",
        "cancellation_reason",

        "cancelled_at_ist",
        "created_at_ist",
        "updated_at_ist",

        "order_confirmation_email_sent",
        "cancellation_email_sent",
        "refund_email_sent",
    )

    inlines = [
        OrderItemInline
    ]

    list_select_related = (
        "user",
    )

    ordering = (
        "-created_at",
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

    @admin.display(
        description="Cancelled At (IST)",
        ordering="cancelled_at",
    )
    def cancelled_at_ist(self, obj):
        return format_ist(
            obj.cancelled_at
        )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):

    list_display = (
        "order",
        "item_name",
        "quantity",
        "price",
    )

    search_fields = (
        "item_name",
        "order__customer_name",
        "order__phone",
    )

    readonly_fields = (
        "order",
        "menu_item",
        "item_name",
        "quantity",
        "price",
    )