from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AboutSection,
    HeroSection,
    WebsiteSettings
)

from .serializers import (
    AboutSectionSerializer,
    HeroSectionSerializer,
    WebsiteSettingsSerializer,
)


class AboutSectionAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        about = (
            AboutSection.objects
            .order_by("-updated_at")
            .first()
        )

        if not about:
            return Response(
                {
                    "detail": (
                        "About section is not available."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AboutSectionSerializer(
            about,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class HeroSectionAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hero = (
            HeroSection.objects
            .filter(is_active=True)
            .order_by("-updated_at")
            .first()
        )

        if not hero:
            return Response(
                {
                    "detail": (
                        "Hero section is not available."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = HeroSectionSerializer(
            hero,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
class WebsiteSettingsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        website_settings = (
            WebsiteSettings.objects
            .filter(is_active=True)
            .order_by("-updated_at")
            .first()
        )

        if not website_settings:
            return Response(
                {
                    "detail": "Website settings are not available."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WebsiteSettingsSerializer(
            website_settings,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )