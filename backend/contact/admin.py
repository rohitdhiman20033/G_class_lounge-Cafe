from django.contrib import admin

from .models import (
    ContactInfo,
    ContactMessage,
)


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):

    list_display = (
        "email",
        "phone",
        "opening_hours",
        "is_active",
        "updated_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "email",
        "phone",
        "address",
    )

    readonly_fields = (
        "updated_at",
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "email",
        "phone",
        "subject",
        "is_read",
        "created_at",
    )

    list_filter = (
        "is_read",
        "created_at",
    )

    search_fields = (
        "name",
        "email",
        "phone",
        "subject",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    actions = [
        "mark_as_read",
        "mark_as_unread",
    ]

    @admin.action(description="Mark selected messages as Read")
    def mark_as_read(
        self,
        request,
        queryset,
    ):
        queryset.update(
            is_read=True
        )

    @admin.action(description="Mark selected messages as Unread")
    def mark_as_unread(
        self,
        request,
        queryset,
    ):
        queryset.update(
            is_read=False
        )