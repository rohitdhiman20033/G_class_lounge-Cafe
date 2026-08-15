from django.db import models


class ContactInfo(models.Model):

    address = models.TextField()

    phone = models.CharField(
        max_length=20
    )

    email = models.EmailField()

    opening_hours = models.CharField(
        max_length=100
    )

    google_map_url = models.URLField(
        blank=True
    )

    whatsapp_number = models.CharField(
        max_length=20,
        blank=True
    )

    instagram_url = models.URLField(
        blank=True
    )

    facebook_url = models.URLField(
        blank=True
    )

    youtube_url = models.URLField(
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        verbose_name = "Contact Information"

        verbose_name_plural = "Contact Information"

    def __str__(self):

        return "Cafe Contact Information"


class ContactMessage(models.Model):

    name = models.CharField(
        max_length=150
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    subject = models.CharField(
        max_length=200
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        ordering = [
            "-created_at"
        ]

    def __str__(self):

        return f"{self.name} - {self.subject}"