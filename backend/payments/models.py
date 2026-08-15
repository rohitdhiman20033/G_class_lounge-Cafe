from django.conf import settings
from django.db import models

from orders.models import Order


class Payment(models.Model):

    STATUS_CREATED = "Created"
    STATUS_PENDING = "Pending"
    STATUS_PAID = "Paid"
    STATUS_FAILED = "Failed"
    STATUS_REFUNDED = "Refunded"

    STATUS_CHOICES = [
        (STATUS_CREATED, "Created"),
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    REFUND_NONE = "None"
    REFUND_PENDING = "Pending"
    REFUND_PROCESSED = "Processed"
    REFUND_FAILED = "Failed"

    REFUND_STATUS_CHOICES = [
        (REFUND_NONE, "None"),
        (REFUND_PENDING, "Pending"),
        (REFUND_PROCESSED, "Processed"),
        (REFUND_FAILED, "Failed"),
    ]

    PROVIDER_RAZORPAY = "Razorpay"

    PROVIDER_CHOICES = [
        (
            PROVIDER_RAZORPAY,
            "Razorpay"
        ),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments"
    )

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name="payment"
    )

    provider = models.CharField(
        max_length=30,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_RAZORPAY
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    currency = models.CharField(
        max_length=3,
        default="INR"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_CREATED
    )

    provider_order_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    provider_payment_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    provider_signature = models.CharField(
        max_length=255,
        blank=True
    )

    failure_reason = models.TextField(
        blank=True
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # REFUND TRACKING

    provider_refund_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    refund_status = models.CharField(
        max_length=20,
        choices=REFUND_STATUS_CHOICES,
        default=REFUND_NONE
    )

    refund_reason = models.TextField(
        blank=True
    )

    refunded_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "-created_at"
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "status"
                ],
                name="payment_user_status_idx",
            ),

            models.Index(
                fields=[
                    "status",
                    "-created_at"
                ],
                name="payment_status_created_idx",
            ),

            models.Index(
                fields=[
                    "refund_status",
                    "-created_at"
                ],
                name="payment_refund_status_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    amount__gte=0
                ),
                name="payment_amount_non_negative",
            ),
        ]

    def __str__(self):
        return (
            f"Payment #{self.pk} - "
            f"Order #{self.order_id} - "
            f"{self.currency} {self.amount} - "
            f"{self.status}"
        )
    

class BookingPayment(models.Model):

    STATUS_CREATED = "Created"
    STATUS_PENDING = "Pending"
    STATUS_PAID = "Paid"
    STATUS_FAILED = "Failed"
    STATUS_REFUNDED = "Refunded"

    STATUS_CHOICES = [
        (STATUS_CREATED, "Created"),
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    REFUND_NONE = "None"
    REFUND_PENDING = "Pending"
    REFUND_PROCESSED = "Processed"
    REFUND_FAILED = "Failed"

    REFUND_STATUS_CHOICES = [
        (REFUND_NONE, "None"),
        (REFUND_PENDING, "Pending"),
        (REFUND_PROCESSED, "Processed"),
        (REFUND_FAILED, "Failed"),
    ]

    PROVIDER_RAZORPAY = "Razorpay"

    PROVIDER_CHOICES = [
        (
            PROVIDER_RAZORPAY,
            "Razorpay"
        ),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="booking_payments"
    )

    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.PROTECT,
        related_name="payment"
    )

    provider = models.CharField(
        max_length=30,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_RAZORPAY
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=500
    )

    currency = models.CharField(
        max_length=3,
        default="INR"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_CREATED
    )

    provider_order_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    provider_payment_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    provider_signature = models.CharField(
        max_length=255,
        blank=True
    )

    failure_reason = models.TextField(
        blank=True
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )

    provider_refund_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    refund_status = models.CharField(
        max_length=20,
        choices=REFUND_STATUS_CHOICES,
        default=REFUND_NONE
    )

    refund_reason = models.TextField(
        blank=True
    )

    refunded_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "-created_at"
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "status"
                ],
                name="bookpay_user_status_idx",
            ),

            models.Index(
                fields=[
                    "status",
                    "-created_at"
                ],
                name="bookpay_status_created_idx",
            ),

            models.Index(
                fields=[
                    "refund_status",
                    "-created_at"
                ],
                name="bookpay_refund_status_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    amount__gte=0
                ),
                name="bookpay_amount_non_negative",
            ),
        ]

    def __str__(self):
        return (
            f"Booking Payment #{self.pk} - "
            f"Booking #{self.booking_id} - "
            f"{self.currency} {self.amount} - "
            f"{self.status}"
        )    