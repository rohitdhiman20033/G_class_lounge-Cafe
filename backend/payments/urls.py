from django.urls import path

from .views import (
    CreatePaymentOrderView,
    VerifyPaymentView,
    RazorpayWebhookView,

    CreateBookingPaymentOrderView,
    VerifyBookingPaymentView,
)


app_name = "payments"


urlpatterns = [
    path(
        "create/<int:order_id>/",
        CreatePaymentOrderView.as_view(),
        name="create-payment-order",
    ),

    path(
        "verify/",
        VerifyPaymentView.as_view(),
        name="verify-payment",
    ),

    path(
        "booking/create/<int:booking_id>/",
        CreateBookingPaymentOrderView.as_view(),
        name="create-booking-payment-order",
    ),

    path(
        "booking/verify/",
        VerifyBookingPaymentView.as_view(),
        name="verify-booking-payment",
    ),

    path(
        "webhook/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),
]