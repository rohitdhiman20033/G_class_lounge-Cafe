from django.db import models


class GalleryImage(models.Model):

    SIZE_CHOICES = [
        ("small", "Small"),
        ("large", "Large"),
    ]

    title = models.CharField(
        max_length=120
    )

    description = models.CharField(
        max_length=200,
        blank=True,
        default=""
    )

    image = models.ImageField(
        upload_to="gallery/"
    )

    card_size = models.CharField(
        max_length=10,
        choices=SIZE_CHOICES,
        default="small"
    )

    is_active = models.BooleanField(
        default=True
    )

    display_order = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = [
            "display_order",
            "-created_at",
        ]

    def __str__(self):
        return self.title