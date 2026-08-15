from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

from rest_framework.test import APITestCase

from orders.models import Order

from .models import Payment

from unittest.mock import patch

from rest_framework import status

import razorpay

from django.utils import timezone


User = get_user_model()


class PaymentModelTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="customer@example.com",
            email="customer@example.com",
            password="TestPass123!"
        )

        self.order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("500.00")
        )

    def test_payment_can_be_created(self):
        payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00")
        )

        self.assertEqual(
            payment.user,
            self.user
        )

        self.assertEqual(
            payment.order,
            self.order
        )

        self.assertEqual(
            payment.amount,
            Decimal("500.00")
        )

        self.assertEqual(
            payment.currency,
            "INR"
        )

        self.assertEqual(
            payment.provider,
            Payment.PROVIDER_RAZORPAY
        )

        self.assertEqual(
            payment.status,
            Payment.STATUS_CREATED
        )

    def test_payment_amount_cannot_be_negative(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Payment.objects.create(
                    user=self.user,
                    order=self.order,
                    amount=Decimal("-1.00")
                )

    def test_order_cannot_have_two_payments(self):
        Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00")
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Payment.objects.create(
                    user=self.user,
                    order=self.order,
                    amount=Decimal("500.00")
                )

    def test_provider_order_id_must_be_unique(self):
        Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00"),
            provider_order_id="order_test_123"
        )

        second_order = Order.objects.create(
            user=self.user,
            customer_name="Second Customer",
            phone="9813073338",
            total=Decimal("300.00")
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Payment.objects.create(
                    user=self.user,
                    order=second_order,
                    amount=Decimal("300.00"),
                    provider_order_id="order_test_123"
                )

    def test_provider_payment_id_must_be_unique(self):
        Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00"),
            provider_payment_id="pay_test_123"
        )

        second_order = Order.objects.create(
            user=self.user,
            customer_name="Second Customer",
            phone="9813073338",
            total=Decimal("300.00")
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Payment.objects.create(
                    user=self.user,
                    order=second_order,
                    amount=Decimal("300.00"),
                    provider_payment_id="pay_test_123"
                )

    def test_order_cannot_be_deleted_when_payment_exists(self):
        Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00")
        )

        with self.assertRaises(Exception):
            with transaction.atomic():
                self.order.delete()


from unittest.mock import patch

from rest_framework import status

class PaymentAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="paymentuser@example.com",
            email="paymentuser@example.com",
            password="TestPass123!"
        )

        self.other_user = User.objects.create_user(
            username="otherpayment@example.com",
            email="otherpayment@example.com",
            password="TestPass123!"
        )

        self.order = Order.objects.create(
            user=self.user,
            customer_name="Payment Customer",
            phone="8813073338",
            total=Decimal("500.00")
        )

    def authenticate(self, user=None):
        self.client.force_authenticate(
            user=user or self.user
        )

    @patch("payments.views.razorpay.Client")
    def test_user_can_create_payment_order(
        self,
        mock_client
    ):
        mock_client.return_value.order.create.return_value = {
            "id": "order_test_123",
            "amount": 50000,
            "currency": "INR",
        }

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(
            response.data["razorpay_order_id"],
            "order_test_123"
        )

        self.assertEqual(
            response.data["amount"],
            50000
        )

        payment = Payment.objects.get(
            order=self.order
        )

        self.assertEqual(
            payment.user,
            self.user
        )

        self.assertEqual(
            payment.amount,
            Decimal("500.00")
        )

        self.assertEqual(
            payment.provider_order_id,
            "order_test_123"
        )

        mock_client.return_value.order.create.assert_called_once()

    @patch("payments.views.razorpay.Client")
    def test_payment_amount_comes_from_order(
        self,
        mock_client
    ):
        mock_client.return_value.order.create.return_value = {
            "id": "order_test_amount",
        }

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {
                "amount": 1
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        call_data = (
            mock_client
            .return_value
            .order
            .create
            .call_args[0][0]
        )

        self.assertEqual(
            call_data["amount"],
            50000
        )

    @patch("payments.views.razorpay.Client")
    def test_other_user_cannot_create_payment(
        self,
        mock_client
    ):
        self.authenticate(
            self.other_user
        )

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        mock_client.assert_not_called()

        self.assertFalse(
            Payment.objects.filter(
                order=self.order
            ).exists()
        )

    @patch("payments.views.razorpay.Client")
    def test_cancelled_order_cannot_create_payment(
        self,
        mock_client
    ):
        self.order.status = (
            Order.STATUS_CANCELLED
        )

        self.order.save(
            update_fields=[
                "status"
            ]
        )

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        mock_client.assert_not_called()

    @patch("payments.views.razorpay.Client")
    def test_existing_unpaid_payment_can_be_retried(
        self,
        mock_client
    ):
        existing_payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=self.order.total,
            status=Payment.STATUS_CREATED,
            provider_order_id="order_existing_123"
        )

        mock_client.return_value.order.create.return_value = {
            "id": "order_retry_456",
            "amount": 50000,
            "currency": "INR",
        }

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        existing_payment.refresh_from_db()

        self.assertEqual(
            existing_payment.provider_order_id,
            "order_retry_456"
        )

        self.assertEqual(
            existing_payment.status,
            Payment.STATUS_CREATED
        )

        self.assertEqual(
            existing_payment.provider_payment_id,
            None
        )

        self.assertEqual(
            Payment.objects.filter(
                order=self.order
            ).count(),
            1
        )

        mock_client.return_value.order.create.assert_called_once()

    @patch("payments.views.razorpay.Client")
    def test_failed_payment_can_be_retried(
        self,
        mock_client
    ):
        existing_payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=self.order.total,
            status=Payment.STATUS_FAILED,
            provider_order_id="order_failed_123",
            failure_reason="Payment failed."
        )

        mock_client.return_value.order.create.return_value = {
            "id": "order_retry_failed_456",
            "amount": 50000,
            "currency": "INR",
        }

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        existing_payment.refresh_from_db()

        self.assertEqual(
            existing_payment.provider_order_id,
            "order_retry_failed_456"
        )

        self.assertEqual(
            existing_payment.status,
            Payment.STATUS_CREATED
        )

        self.assertEqual(
            existing_payment.failure_reason,
            ""
        )

        self.assertIsNone(
            existing_payment.paid_at
        )

        self.assertEqual(
            Payment.objects.filter(
                order=self.order
            ).count(),
            1
        )

    @patch("payments.views.razorpay.Client")
    def test_paid_payment_cannot_be_retried(
        self,
        mock_client
    ):
        Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=self.order.total,
            status=Payment.STATUS_PAID,
            provider_order_id="order_paid_123",
            provider_payment_id="pay_paid_123",
            provider_signature="signature",
            paid_at=timezone.now()
        )

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            response.data["detail"],
            "Order is already paid."
        )

        mock_client.assert_not_called()

    @patch("payments.views.razorpay.Client")
    def test_razorpay_failure_returns_502(
        self,
        mock_client
    ):
        mock_client.return_value.order.create.side_effect = (
            Exception(
                "Razorpay unavailable"
            )
        )

        self.authenticate()

        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_502_BAD_GATEWAY
        )

        self.assertFalse(
            Payment.objects.filter(
                order=self.order
            ).exists()
        )

    def test_unauthenticated_user_cannot_create_payment(
        self
    ):
        response = self.client.post(
            f"/api/payments/create/{self.order.id}/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class PaymentVerificationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="verify@example.com",
            email="verify@example.com",
            password="TestPass123!"
        )

        self.other_user = User.objects.create_user(
            username="verifyother@example.com",
            email="verifyother@example.com",
            password="TestPass123!"
        )

        self.order = Order.objects.create(
            user=self.user,
            customer_name="Verify Customer",
            phone="8813073338",
            total=Decimal("500.00")
        )

        self.payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00"),
            provider_order_id="order_verify_123"
        )

    def authenticate(self, user=None):
        self.client.force_authenticate(
            user=user or self.user
        )

    @patch("payments.views.razorpay.Client")
    def test_valid_signature_marks_payment_paid(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_payment_signature.return_value = None

        self.authenticate()

        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_verify_123",
                "razorpay_payment_id": "pay_verify_123",
                "razorpay_signature": "valid_signature"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.provider_payment_id,
            "pay_verify_123"
        )

        self.assertEqual(
            self.payment.provider_signature,
            "valid_signature"
        )

        self.assertIsNotNone(
            self.payment.paid_at
        )

        verification_data = (
            mock_client
            .return_value
            .utility
            .verify_payment_signature
            .call_args[0][0]
        )

        self.assertEqual(
            verification_data["razorpay_order_id"],
            self.payment.provider_order_id
        )

    @patch("payments.views.razorpay.Client")
    def test_invalid_signature_does_not_mark_paid(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_payment_signature.side_effect = (
                razorpay.errors.SignatureVerificationError(
                    "Invalid signature"
                )
            )

        self.authenticate()

        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_verify_123",
                "razorpay_payment_id": "pay_invalid_123",
                "razorpay_signature": "invalid_signature"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_FAILED
        )

        self.assertIsNone(
            self.payment.provider_payment_id
        )

        self.assertIsNone(
            self.payment.paid_at
        )

    @patch("payments.views.razorpay.Client")
    def test_other_user_cannot_verify_payment(
        self,
        mock_client
    ):
        self.authenticate(
            self.other_user
        )

        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_verify_123",
                "razorpay_payment_id": "pay_verify_123",
                "razorpay_signature": "signature"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        mock_client.assert_not_called()

        self.payment.refresh_from_db()

        self.assertNotEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

    @patch("payments.views.razorpay.Client")
    def test_already_paid_payment_is_idempotent(
        self,
        mock_client
    ):
        self.payment.status = Payment.STATUS_PAID
        self.payment.provider_payment_id = (
            "pay_existing_123"
        )
        self.payment.provider_signature = (
            "existing_signature"
        )
        self.payment.paid_at = timezone.now()

        self.payment.save()

        self.authenticate()

        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_verify_123",
                "razorpay_payment_id": "pay_different_123",
                "razorpay_signature": "different_signature"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        mock_client.assert_not_called()

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.provider_payment_id,
            "pay_existing_123"
        )

    @patch("payments.views.razorpay.Client")
    def test_duplicate_provider_payment_id_is_rejected(
        self,
        mock_client
    ):
        second_order = Order.objects.create(
            user=self.user,
            customer_name="Second Customer",
            phone="9813073338",
            total=Decimal("300.00")
        )

        Payment.objects.create(
            user=self.user,
            order=second_order,
            amount=Decimal("300.00"),
            status=Payment.STATUS_PAID,
            provider_order_id="order_second_123",
            provider_payment_id="pay_used_123",
            provider_signature="signature"
        )

        mock_client.return_value.utility \
            .verify_payment_signature.return_value = None

        self.authenticate()

        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_verify_123",
                "razorpay_payment_id": "pay_used_123",
                "razorpay_signature": "valid_signature"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.payment.refresh_from_db()

        self.assertNotEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

    def test_missing_verification_fields_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/payments/verify/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_unauthenticated_user_cannot_verify_payment(self):
        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_verify_123",
                "razorpay_payment_id": "pay_verify_123",
                "razorpay_signature": "signature"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )



class RazorpayWebhookTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="webhook@example.com",
            email="webhook@example.com",
            password="TestPass123!"
        )

        self.order = Order.objects.create(
            user=self.user,
            customer_name="Webhook Customer",
            phone="8813073338",
            total=Decimal("500.00")
        )

        self.payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00"),
            provider_order_id="order_webhook_123"
        )

        self.payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_webhook_123",
                        "order_id": "order_webhook_123",
                        "amount": 50000,
                        "currency": "INR",
                        "status": "captured",
                    }
                }
            }
        }

    @patch("payments.views.razorpay.Client")
    def test_valid_webhook_marks_payment_paid(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        response = self.client.post(
            "/api/payments/webhook/",
            self.payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.provider_payment_id,
            "pay_webhook_123"
        )

        self.assertIsNotNone(
            self.payment.paid_at
        )

    @patch("payments.views.razorpay.Client")
    def test_invalid_webhook_signature_is_rejected(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.side_effect = (
                razorpay.errors.SignatureVerificationError(
                    "Invalid webhook signature"
                )
            )

        response = self.client.post(
            "/api/payments/webhook/",
            self.payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="invalid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.payment.refresh_from_db()

        self.assertNotEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

    @patch("payments.views.razorpay.Client")
    def test_missing_webhook_signature_is_rejected(
        self,
        mock_client
    ):
        response = self.client.post(
            "/api/payments/webhook/",
            self.payload,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        mock_client.assert_not_called()

    @patch("payments.views.razorpay.Client")
    def test_duplicate_webhook_is_idempotent(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        response = self.client.post(
            "/api/payments/webhook/",
            self.payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        original_paid_at = self.payment.paid_at

        response = self.client.post(
            "/api/payments/webhook/",
            self.payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.provider_payment_id,
            "pay_webhook_123"
        )

        self.assertEqual(
            self.payment.paid_at,
            original_paid_at
        )

    @patch("payments.views.razorpay.Client")
    def test_unknown_payment_webhook_returns_200(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_unknown_123",
                        "order_id": "order_unknown_123",
                    }
                }
            }
        }

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertNotEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

    @patch("payments.views.razorpay.Client")
    def test_cancelled_order_webhook_is_ignored(
        self,
        mock_client
    ):
        self.order.status = Order.STATUS_CANCELLED

        self.order.save(
            update_fields=["status"]
        )

        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        response = self.client.post(
            "/api/payments/webhook/",
            self.payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertNotEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertIsNone(
            self.payment.provider_payment_id
        )

    @patch("payments.views.razorpay.Client")
    def test_unhandled_event_does_not_change_payment(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = {
            "event": "payment.failed",
            "payload": {}
        }

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_CREATED
        )

        self.assertIsNone(
            self.payment.provider_payment_id
        )        



class RazorpayRefundWebhookTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="refundwebhook@example.com",
            email="refundwebhook@example.com",
            password="TestPass123!"
        )

        self.order = Order.objects.create(
            user=self.user,
            customer_name="Refund Webhook Customer",
            phone="8813073338",
            total=Decimal("500.00"),
            status=Order.STATUS_CANCELLED
        )

        self.payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00"),
            currency="INR",
            status=Payment.STATUS_PAID,
            provider_order_id="order_refund_webhook_123",
            provider_payment_id="pay_refund_webhook_123",
            provider_signature="test_signature",
            paid_at=timezone.now(),
            provider_refund_id="rfnd_webhook_123",
            refund_status=Payment.REFUND_PENDING,
            refund_reason="Customer cancelled order"
        )

    def refund_payload(
        self,
        event,
        refund_id="rfnd_webhook_123",
        payment_id="pay_refund_webhook_123"
    ):
        return {
            "event": event,
            "payload": {
                "refund": {
                    "entity": {
                        "id": refund_id,
                        "payment_id": payment_id,
                        "amount": 50000,
                        "currency": "INR"
                    }
                }
            }
        }

    @patch("payments.views.razorpay.Client")
    def test_refund_processed_marks_payment_refunded(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = self.refund_payload(
            "refund.processed"
        )

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_REFUNDED
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_PROCESSED
        )

        self.assertEqual(
            self.payment.provider_refund_id,
            "rfnd_webhook_123"
        )

        self.assertIsNotNone(
            self.payment.refunded_at
        )

        self.assertEqual(
            self.payment.failure_reason,
            ""
        )

    @patch("payments.views.razorpay.Client")
    def test_refund_failed_keeps_payment_paid(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = self.refund_payload(
            "refund.failed"
        )

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_FAILED
        )

        self.assertEqual(
            self.payment.provider_refund_id,
            "rfnd_webhook_123"
        )

        self.assertEqual(
            self.payment.failure_reason,
            "Refund processing failed."
        )

        self.assertIsNone(
            self.payment.refunded_at
        )

    @patch("payments.views.razorpay.Client")
    def test_unknown_refund_payment_returns_200(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = self.refund_payload(
            "refund.processed",
            refund_id="rfnd_unknown_123",
            payment_id="pay_unknown_123"
        )

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_PENDING
        )

    @patch("payments.views.razorpay.Client")
    def test_duplicate_refund_processed_is_idempotent(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = self.refund_payload(
            "refund.processed"
        )

        first_response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        original_refunded_at = (
            self.payment.refunded_at
        )

        self.assertIsNotNone(
            original_refunded_at
        )

        second_response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_REFUNDED
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_PROCESSED
        )

        self.assertEqual(
            self.payment.refunded_at,
            original_refunded_at
        )

    @patch("payments.views.razorpay.Client")
    def test_mismatched_refund_id_is_rejected(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = self.refund_payload(
            "refund.processed",
            refund_id="rfnd_different_456"
        )

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_PENDING
        )

        self.assertEqual(
            self.payment.provider_refund_id,
            "rfnd_webhook_123"
        )

        self.assertIsNone(
            self.payment.refunded_at
        )

    @patch("payments.views.razorpay.Client")
    def test_refund_webhook_missing_data_returns_400(
        self,
        mock_client
    ):
        mock_client.return_value.utility \
            .verify_webhook_signature.return_value = None

        payload = {
            "event": "refund.processed",
            "payload": {
                "refund": {
                    "entity": {}
                }
            }
        }

        response = self.client.post(
            "/api/payments/webhook/",
            payload,
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="valid_signature"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.payment.refresh_from_db()

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_PENDING
        )




