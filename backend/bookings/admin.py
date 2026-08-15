from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "phone",
        "date",
        "time",
        "guests",
        "status",
        "hidden_by_user",
        "user",
        "created_at",
    )

    list_filter = (
        "status",
        "date",
        "hidden_by_user",
        "created_at",
    )

    search_fields = (
        "name",
        "phone",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "user",
        "cancellation_reason",
        "cancelled_at",
        "created_at",
        "hidden_by_user",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )

    list_select_related = (
        "user",
    )

    date_hierarchy = "date"