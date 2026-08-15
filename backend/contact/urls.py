from django.urls import path

from .views import (
    ContactInfoAPIView,
    ContactMessageCreateAPIView,
)


urlpatterns = [
    path(
        "",
        ContactInfoAPIView.as_view(),
        name="contact-info",
    ),

    path(
        "messages/",
        ContactMessageCreateAPIView.as_view(),
        name="contact-message-create",
    ),
]