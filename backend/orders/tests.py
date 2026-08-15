from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from menu.models import MenuItem
from payments.models import Payment

from .models import Order, OrderItem


User = get_user_model()


class OrderAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="customer@example.com",
            email="customer@example.com",
            password="TestPass123!"
        )

        self.other_user = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="TestPass123!"
        )

        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="AdminPass123!",
            is_staff=True
        )

        self.menu_item = MenuItem.objects.create(
            name="Masala Tea",
            description="Fresh masala tea",
            price=Decimal("100.00"),
            category="Tea",
            available=True,
            stock=10
        )

    def authenticate(self, user=None):
        self.client.force_authenticate(
            user=user or self.user
        )

    def create_order_via_api(self, quantity=2):
        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "8813073338",
                "items": [
                    {
                        "menu_item_id": self.menu_item.id,
                        "quantity": quantity
                    }
                ]
            },
            format="json"
        )

        return response

    def test_user_can_create_order(self):
        response = self.create_order_via_api(
            quantity=2
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        order = Order.objects.get()

        self.assertEqual(
            order.user,
            self.user
        )

        self.assertEqual(
            order.total,
            Decimal("200.00")
        )

        self.assertEqual(
            order.status,
            Order.STATUS_PENDING
        )

        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.menu_item.stock,
            8
        )

    def test_user_only_sees_own_orders(self):
        Order.objects.create(
            user=self.user,
            customer_name="User Order",
            phone="8813073338",
            total=Decimal("100.00")
        )

        Order.objects.create(
            user=self.other_user,
            customer_name="Other Order",
            phone="9813073338",
            total=Decimal("200.00")
        )

        self.authenticate()

        response = self.client.get(
            "/api/orders/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            len(response.data),
            1
        )

        self.assertEqual(
            response.data[0]["customer_name"],
            "User Order"
        )

    def test_cancel_order_restores_stock(self):
        create_response = self.create_order_via_api(
            quantity=3
        )

        self.assertEqual(
            create_response.status_code,
            status.HTTP_201_CREATED
        )

        order_id = create_response.data["id"]

        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.menu_item.stock,
            7
        )

        response = self.client.post(
            f"/api/orders/{order_id}/cancel/",
            {
                "reason": "Changed my mind"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        order = Order.objects.get(
            id=order_id
        )

        self.assertEqual(
            order.status,
            Order.STATUS_CANCELLED
        )

        self.assertEqual(
            order.cancellation_reason,
            "Changed my mind"
        )

        self.assertIsNotNone(
            order.cancelled_at
        )

        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.menu_item.stock,
            10
        )

    def test_other_user_cannot_cancel_order(self):
        create_response = self.create_order_via_api(
            quantity=1
        )

        order_id = create_response.data["id"]

        self.authenticate(
            self.other_user
        )

        response = self.client.post(
            f"/api/orders/{order_id}/cancel/",
            {
                "reason": "Trying to cancel"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_pending_order_cannot_jump_to_completed(self):
        order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("100.00")
        )

        self.authenticate(
            self.admin
        )

        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {
                "status": Order.STATUS_COMPLETED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.STATUS_PENDING
        )

    def test_valid_order_status_flow(self):
        order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("100.00")
        )

        self.authenticate(
            self.admin
        )

        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {
                "status": Order.STATUS_PREPARING
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.STATUS_PREPARING
        )

        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {
                "status": Order.STATUS_COMPLETED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.STATUS_COMPLETED
        )

    def test_completed_order_can_be_hidden(self):
        order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("100.00"),
            status=Order.STATUS_COMPLETED
        )

        self.authenticate()

        response = self.client.post(
            f"/api/orders/{order.id}/hide/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        order.refresh_from_db()

        self.assertTrue(
            order.hidden_by_user
        )

        response = self.client.get(
            "/api/orders/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            len(response.data),
            0
        )

    # ==================================================
    # API VALIDATION TESTS
    # ==================================================

    def test_order_quantity_zero_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "8813073338",
                "items": [
                    {
                        "menu_item_id": self.menu_item.id,
                        "quantity": 0
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

    def test_invalid_phone_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "12345",
                "items": [
                    {
                        "menu_item_id": self.menu_item.id,
                        "quantity": 1
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

    def test_empty_items_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "8813073338",
                "items": []
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

    def test_nonexistent_menu_item_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "8813073338",
                "items": [
                    {
                        "menu_item_id": 999999,
                        "quantity": 1
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

    def test_unavailable_menu_item_returns_400(self):
        self.menu_item.available = False

        self.menu_item.save(
            update_fields=[
                "available"
            ]
        )

        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "8813073338",
                "items": [
                    {
                        "menu_item_id": self.menu_item.id,
                        "quantity": 1
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

    def test_insufficient_stock_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/orders/",
            {
                "customer_name": "Test Customer",
                "phone": "8813073338",
                "items": [
                    {
                        "menu_item_id": self.menu_item.id,
                        "quantity": 11
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )

        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.menu_item.stock,
            10
        )

    # ==================================================
    # PERMISSION / SECURITY TESTS
    # ==================================================

    def test_unauthenticated_user_cannot_access_orders(self):
        response = self.client.get(
            "/api/orders/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_normal_user_cannot_update_order_status(self):
        order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("100.00")
        )

        self.authenticate(
            self.user
        )

        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {
                "status": Order.STATUS_PREPARING
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.STATUS_PENDING
        )

    def test_user_cannot_retrieve_other_users_order(self):
        order = Order.objects.create(
            user=self.other_user,
            customer_name="Other User Order",
            phone="9813073338",
            total=Decimal("100.00")
        )

        self.authenticate(
            self.user
        )

        response = self.client.get(
            f"/api/orders/{order.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_admin_can_update_other_users_order(self):
        order = Order.objects.create(
            user=self.other_user,
            customer_name="Other User Order",
            phone="9813073338",
            total=Decimal("100.00")
        )

        self.authenticate(
            self.admin
        )

        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {
                "status": Order.STATUS_PREPARING
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        order.refresh_from_db()

        self.assertEqual(
            order.status,
            Order.STATUS_PREPARING
        )

    # ==================================================
    # DATABASE CONSTRAINT TESTS
    # ==================================================

    def test_order_total_cannot_be_negative(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Order.objects.create(
                    user=self.user,
                    customer_name="Invalid Order",
                    phone="8813073338",
                    total=Decimal("-1.00")
                )

    def test_order_item_quantity_cannot_be_zero(self):
        order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("100.00")
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                OrderItem.objects.create(
                    order=order,
                    menu_item=self.menu_item,
                    item_name=self.menu_item.name,
                    quantity=0,
                    price=Decimal("100.00")
                )

    def test_order_item_price_cannot_be_negative(self):
        order = Order.objects.create(
            user=self.user,
            customer_name="Test Customer",
            phone="8813073338",
            total=Decimal("100.00")
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                OrderItem.objects.create(
                    order=order,
                    menu_item=self.menu_item,
                    item_name=self.menu_item.name,
                    quantity=1,
                    price=Decimal("-10.00")
                )



class PaidOrderRefundTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="refunduser@example.com",
            email="refunduser@example.com",
            password="TestPass123!"
        )

        self.menu_item = MenuItem.objects.create(
            name="Refund Test Item",
            description="Refund test item",
            price=Decimal("250.00"),
            category="Food",
            available=True,
            stock=10
        )

        self.order = Order.objects.create(
            user=self.user,
            customer_name="Refund Customer",
            phone="8813073338",
            total=Decimal("500.00"),
            status=Order.STATUS_PENDING
        )

        OrderItem.objects.create(
            order=self.order,
            menu_item=self.menu_item,
            item_name=self.menu_item.name,
            quantity=2,
            price=self.menu_item.price
        )

        # Simulate stock already consumed
        # when the order was originally created.
        self.menu_item.stock = 8

        self.menu_item.save(
            update_fields=[
                "stock"
            ]
        )

        self.payment = Payment.objects.create(
            user=self.user,
            order=self.order,
            amount=Decimal("500.00"),
            currency="INR",
            status=Payment.STATUS_PAID,
            provider_order_id="order_refund_test",
            provider_payment_id="pay_refund_test",
            provider_signature="test_signature",
            paid_at=timezone.now()
        )

        self.client.force_authenticate(
            user=self.user
        )


    @patch("orders.views.razorpay.Client")
    def test_paid_order_cancel_initiates_refund(
        self,
        mock_client
    ):
        mock_client.return_value.payment.refund.return_value = {
            "id": "rfnd_test_123",
            "status": "pending",
            "amount": 50000,
            "currency": "INR",
        }

        response = self.client.post(
            f"/api/orders/{self.order.id}/cancel/",
            {
                "reason":
                    "Customer changed mind"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.order.refresh_from_db()
        self.payment.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.STATUS_CANCELLED
        )

        self.assertEqual(
            self.order.cancellation_reason,
            "Customer changed mind"
        )

        self.assertIsNotNone(
            self.order.cancelled_at
        )

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
            "rfnd_test_123"
        )

        self.assertEqual(
            self.payment.refund_reason,
            "Customer changed mind"
        )

        self.assertEqual(
            self.menu_item.stock,
            10
        )

        mock_client.return_value.payment.refund.assert_called_once()

        call_args = (
            mock_client
            .return_value
            .payment
            .refund
            .call_args
        )

        self.assertEqual(
            call_args.args[0],
            "pay_refund_test"
        )

        self.assertEqual(
            call_args.args[1]["amount"],
            50000
        )


    @patch("orders.views.razorpay.Client")
    def test_immediately_processed_refund_marks_payment_refunded(
        self,
        mock_client
    ):
        mock_client.return_value.payment.refund.return_value = {
            "id": "rfnd_processed_123",
            "status": "processed",
            "amount": 50000,
            "currency": "INR",
        }

        response = self.client.post(
            f"/api/orders/{self.order.id}/cancel/",
            {
                "reason":
                    "Refund immediately processed"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.order.refresh_from_db()
        self.payment.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.STATUS_CANCELLED
        )

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
            "rfnd_processed_123"
        )

        self.assertIsNotNone(
            self.payment.refunded_at
        )

        self.assertEqual(
            self.menu_item.stock,
            10
        )


    @patch("orders.views.razorpay.Client")
    def test_refund_api_failure_does_not_cancel_order(
        self,
        mock_client
    ):
        mock_client.return_value.payment.refund.side_effect = (
            Exception(
                "Razorpay refund unavailable"
            )
        )

        response = self.client.post(
            f"/api/orders/{self.order.id}/cancel/",
            {
                "reason":
                    "Cancel and refund"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_502_BAD_GATEWAY
        )

        self.order.refresh_from_db()
        self.payment.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.STATUS_PENDING
        )

        self.assertIsNone(
            self.order.cancelled_at
        )

        self.assertEqual(
            self.payment.status,
            Payment.STATUS_PAID
        )

        self.assertEqual(
            self.payment.refund_status,
            Payment.REFUND_FAILED
        )

        # Stock must NOT be restored because
        # cancellation did not happen.
        self.assertEqual(
            self.menu_item.stock,
            8
        )


    @patch("orders.views.razorpay.Client")
    def test_provider_failed_refund_does_not_cancel_order(
        self,
        mock_client
    ):
        mock_client.return_value.payment.refund.return_value = {
            "id": "rfnd_failed_123",
            "status": "failed",
            "amount": 50000,
            "currency": "INR",
        }

        response = self.client.post(
            f"/api/orders/{self.order.id}/cancel/",
            {
                "reason":
                    "Refund provider failure"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_502_BAD_GATEWAY
        )

        self.order.refresh_from_db()
        self.payment.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.STATUS_PENDING
        )

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
            "rfnd_failed_123"
        )

        self.assertEqual(
            self.menu_item.stock,
            8
        )


    @patch("orders.views.razorpay.Client")
    def test_existing_pending_refund_blocks_duplicate_refund(
        self,
        mock_client
    ):
        self.payment.refund_status = (
            Payment.REFUND_PENDING
        )

        self.payment.provider_refund_id = (
            "rfnd_existing_123"
        )

        self.payment.save(
            update_fields=[
                "refund_status",
                "provider_refund_id",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/orders/{self.order.id}/cancel/",
            {
                "reason":
                    "Trying refund again"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            response.data["detail"],
            "A refund is already being processed."
        )

        self.order.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.STATUS_PENDING
        )

        self.assertEqual(
            self.menu_item.stock,
            8
        )

        mock_client.assert_not_called()


    @patch("orders.views.razorpay.Client")
    def test_paid_payment_without_provider_payment_id_cannot_cancel(
        self,
        mock_client
    ):
        self.payment.provider_payment_id = None

        self.payment.save(
            update_fields=[
                "provider_payment_id",
                "updated_at",
            ]
        )

        response = self.client.post(
            f"/api/orders/{self.order.id}/cancel/",
            {
                "reason":
                    "Missing provider payment ID"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.order.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(
            self.order.status,
            Order.STATUS_PENDING
        )

        self.assertEqual(
            self.menu_item.stock,
            8
        )

        mock_client.assert_not_called()
