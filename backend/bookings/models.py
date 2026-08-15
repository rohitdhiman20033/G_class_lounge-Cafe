from django.conf import settings
from django.db import models


class Booking(models.Model):

    STATUS_PENDING = "Pending"
    STATUS_CONFIRMED = "Confirmed"
    STATUS_COMPLETED = "Completed"
    STATUS_CANCELLED = "Cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings"
    )

    name = models.CharField(
        max_length=150
    )

    phone = models.CharField(
        max_length=20
    )

    date = models.DateField()

    time = models.TimeField()

    guests = models.PositiveIntegerField()

    description = models.TextField(
        blank=True
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

    booking_confirmation_email_sent = models.BooleanField(
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
                name="booking_user_status_idx",
            ),
            models.Index(
                fields=["user", "-created_at"],
                name="booking_user_created_idx",
            ),
            models.Index(
                fields=["status", "-created_at"],
                name="booking_status_created_idx",
            ),
            models.Index(
                fields=["date", "time"],
                name="booking_date_time_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(guests__gt=0),
                name="booking_guests_gt_0",
            ),
        ]

    def __str__(self):
        return (
            f"Booking #{self.pk} - "
            f"{self.name} - "
            f"{self.date} {self.time}"
        )