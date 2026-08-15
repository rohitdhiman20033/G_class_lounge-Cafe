from django.contrib import admin

from .models import (
    EmailVerificationOTP,
    PasswordResetOTP,
    Profile,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "phone",
        "role",
        "is_verified",
        "created_at",
    )

    list_filter = (
        "role",
        "is_verified",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "phone",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "otp",
        "is_used",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_used",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "otp",
        "created_at",
        "expires_at",
    )

    ordering = (
        "-created_at",
    )    


@admin.register(EmailVerificationOTP)
class EmailVerificationOTPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "otp",
        "is_used",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_used",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "created_at",
        "expires_at",
    )

    ordering = ("-created_at",)    