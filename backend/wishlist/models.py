from django.conf import settings
from django.db import models

from menu.models import MenuItem


class Wishlist(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )

    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = (
            "user",
            "menu_item",
        )

    def __str__(self):
        return (
            f"{self.user.email} - "
            f"{self.menu_item.name}"
        )