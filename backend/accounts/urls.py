from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterAPIView,
    LoginAPIView,
    LogoutAPIView,
    CurrentUserAPIView,
    ChangePasswordAPIView,
    ForgotPasswordAPIView,
    VerifyPasswordResetOTPAPIView,
    ResetPasswordAPIView,
    VerifyEmailAPIView,
    ResendVerificationOTPAPIView,
)


app_name = "accounts"


urlpatterns = [
    path(
        "register/",
        RegisterAPIView.as_view(),
        name="register",
    ),
    path(
        "login/",
        LoginAPIView.as_view(),
        name="login",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),
    path(
        "logout/",
        LogoutAPIView.as_view(),
        name="logout",
    ),
    path(
        "me/",
        CurrentUserAPIView.as_view(),
        name="current-user",
    ),
    path(
    "change-password/",
    ChangePasswordAPIView.as_view(),
    name="change-password",
    ),
    path(
    "forgot-password/",
    ForgotPasswordAPIView.as_view(),
    name="forgot-password",
    ),

    path(
    "verify-reset-otp/",
    VerifyPasswordResetOTPAPIView.as_view(),
    name="verify-reset-otp",
    ),

    path(
    "reset-password/",
    ResetPasswordAPIView.as_view(),
    name="reset-password",
    ),
    path(
    "verify-email/",
    VerifyEmailAPIView.as_view(),
    name="verify-email",
    ),

    path(
    "resend-verification-otp/",
    ResendVerificationOTPAPIView.as_view(),
    name="resend-verification-otp",
    ),
]