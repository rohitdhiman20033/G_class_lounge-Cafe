from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import GalleryImage
from .serializers import GalleryImageSerializer


class GalleryListAPIView(
    generics.ListAPIView
):

    serializer_class = GalleryImageSerializer

    permission_classes = [
        AllowAny
    ]

    def get_queryset(self):

        return GalleryImage.objects.filter(
            is_active=True
        )