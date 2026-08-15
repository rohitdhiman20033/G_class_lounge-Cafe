from rest_framework import generics
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
)

from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):
        return Review.objects.filter(
            is_approved=True
        ).select_related(
            "user",
            "user__profile",
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )