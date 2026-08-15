from rest_framework import generics, permissions

from .models import Wishlist
from .serializers import WishlistSerializer


class WishlistListCreateAPIView(
    generics.ListCreateAPIView
):

    serializer_class = WishlistSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return Wishlist.objects.filter(
            user=self.request.user
        ).select_related(
            "menu_item"
        ).order_by("-created_at")


class WishlistDeleteAPIView(
    generics.DestroyAPIView
):

    serializer_class = WishlistSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return Wishlist.objects.filter(
            user=self.request.user
        )