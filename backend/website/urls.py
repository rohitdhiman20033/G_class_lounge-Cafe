from django.urls import path

from .views import (
    AboutSectionAPIView,
    HeroSectionAPIView,
    WebsiteSettingsAPIView
)


urlpatterns = [
    path(
        "about/",
        AboutSectionAPIView.as_view(),
        name="about-section",
    ),

    path(
        "hero/",
        HeroSectionAPIView.as_view(),
        name="hero-section",
    ),

    path(
    "settings/",
    WebsiteSettingsAPIView.as_view(),
    name="website-settings",
    ),
]