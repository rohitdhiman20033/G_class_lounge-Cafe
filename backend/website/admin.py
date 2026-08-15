from django.contrib import admin

from .models import (
    AboutSection,
    HeroSection,
    WebsiteSettings,
)


@admin.register(AboutSection)
class AboutSectionAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "customers",
        "menu_items",
        "rating",
    )


@admin.register(HeroSection)
class HeroSectionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "eyebrow",
        "is_active",
        "updated_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "title",
        "eyebrow",
        "description",
    )

    readonly_fields = (
        "updated_at",
    )    


@admin.register(WebsiteSettings)
class WebsiteSettingsAdmin(admin.ModelAdmin):

    list_display = (
        "site_name",
        "phone",
        "email",
        "is_active",
        "updated_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "site_name",
        "phone",
        "email",
        "address",
    )

    readonly_fields = (
        "updated_at",
    )

    def has_add_permission(self, request):
        return not WebsiteSettings.objects.exists()