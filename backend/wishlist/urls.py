from django.urls import path

from .views import (
    WishlistListCreateAPIView,
    WishlistDeleteAPIView,
)

urlpatterns = [

    path(
        "",
        WishlistListCreateAPIView.as_view(),
    ),

    path(
        "<int:pk>/",
        WishlistDeleteAPIView.as_view(),
    ),

]