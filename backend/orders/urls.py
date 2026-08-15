from django.urls import path

from .views import (
    CancelOrderView,
    OrderListCreateView,
    OrderRetrieveUpdateView,
    HideOrderView,
)

urlpatterns = [
    path(
        "",
        OrderListCreateView.as_view(),
        name="orders",
    ),

    path(
        "<int:pk>/",
        OrderRetrieveUpdateView.as_view(),
        name="order-detail"
    ),

    path(
        "<int:pk>/cancel/",
        CancelOrderView.as_view(),
        name="cancel-order",
    ),

    path(
    "<int:pk>/hide/",
    HideOrderView.as_view(),
    name="order-hide"
    ),
]