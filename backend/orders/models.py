from django.conf import settings
from django.db import models

from menu.models import MenuItem


class Order(models.Model):

    STATUS_PENDING = "Pending"
    STATUS_PREPARING = "Preparing"
    STATUS_COMPLETED = "Completed"
    STATUS_CANCELLED = "Cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PREPARING, "Preparing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    customer_name = models.CharField(
        max_length=100
    )

    phone = models.CharField(
        max_length=15
    )

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    cancellation_reason = models.TextField(
        blank=True
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    hidden_by_user = models.BooleanField(
        default=False
    )

    order_confirmation_email_sent = models.BooleanField(
    default=False
    )

    cancellation_email_sent = models.BooleanField(
    default=False
    )

    refund_email_sent = models.BooleanField(
    default=False
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["user", "status"],
                name="order_user_status_idx",
            ),
            models.Index(
                fields=["user", "-created_at"],
                name="order_user_created_idx",
            ),
            models.Index(
                fields=["status", "-created_at"],
                name="order_status_created_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(total__gte=0),
                name="order_total_gte_0",
            ),
        ]

    def __str__(self):
        return (
            f"Order #{self.pk} - "
            f"{self.customer_name} - "
            f"₹{self.total}"
        )


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items"
    )

    item_name = models.CharField(
        max_length=150
    )

    quantity = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="orderitem_quantity_gt_0",
            ),
            models.CheckConstraint(
                condition=models.Q(price__gte=0),
                name="orderitem_price_gte_0",
            ),
        ]

    def __str__(self):
        return (
            f"{self.item_name} "
            f"x {self.quantity}"
        )