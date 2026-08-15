from rest_framework import serializers

from .models import (
    AboutSection,
    HeroSection,
    WebsiteSettings,
)


class AboutSectionSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = AboutSection
        fields = "__all__"


class HeroSectionSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = HeroSection
        fields = "__all__"



class WebsiteSettingsSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = WebsiteSettings
        fields = "__all__"        