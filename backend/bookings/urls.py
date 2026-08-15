from django.urls import path

from .views import (
    BookingListCreateView,
    BookingRetrieveUpdateView,
    CancelBookingView,
    HideBookingView,
)


urlpatterns = [
    path(
        "",
        BookingListCreateView.as_view(),
        name="booking-list-create"
    ),

    path(
        "<int:pk>/",
        BookingRetrieveUpdateView.as_view(),
        name="booking-detail"
    ),

    path(
        "<int:pk>/cancel/",
        CancelBookingView.as_view(),
        name="booking-cancel"
    ),

    path(
    "<int:pk>/hide/",
    HideBookingView.as_view(),
    name="booking-hide"
    ),
]