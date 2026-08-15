from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from .models import Booking


User = get_user_model()


class BookingAPITests(APITestCase):

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

        self.future_date = (
            timezone.localdate()
            + timedelta(days=7)
        )

        self.future_time = time(
            hour=18,
            minute=30
        )

    def authenticate(self, user=None):
        self.client.force_authenticate(
            user=user or self.user
        )

    def create_booking_via_api(self):
        self.authenticate()

        response = self.client.post(
            "/api/bookings/",
            {
                "name": "Test Customer",
                "phone": "8813073338",
                "date": self.future_date.isoformat(),
                "time": self.future_time.strftime(
                    "%H:%M:%S"
                ),
                "guests": 4,
                "description": "Window table"
            },
            format="json"
        )

        return response

    def test_user_can_create_booking(self):
        response = self.create_booking_via_api()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        booking = Booking.objects.get()

        self.assertEqual(
            booking.user,
            self.user
        )

        self.assertEqual(
            booking.name,
            "Test Customer"
        )

        self.assertEqual(
            booking.guests,
            4
        )

        self.assertEqual(
            booking.status,
            Booking.STATUS_PENDING
        )

    def test_user_only_sees_own_bookings(self):
        Booking.objects.create(
            user=self.user,
            name="User Booking",
            phone="8813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2
        )

        Booking.objects.create(
            user=self.other_user,
            name="Other Booking",
            phone="9813073338",
            date=self.future_date,
            time=self.future_time,
            guests=3
        )

        self.authenticate()

        response = self.client.get(
            "/api/bookings/"
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
            response.data[0]["name"],
            "User Booking"
        )

    def test_user_can_cancel_pending_booking(self):
        response = self.create_booking_via_api()

        booking_id = response.data["id"]

        cancel_response = self.client.post(
            f"/api/bookings/{booking_id}/cancel/",
            {
                "reason": "Plans changed"
            },
            format="json"
        )

        self.assertEqual(
            cancel_response.status_code,
            status.HTTP_200_OK
        )

        booking = Booking.objects.get(
            id=booking_id
        )

        self.assertEqual(
            booking.status,
            Booking.STATUS_CANCELLED
        )

        self.assertEqual(
            booking.cancellation_reason,
            "Plans changed"
        )

        self.assertIsNotNone(
            booking.cancelled_at
        )

    def test_other_user_cannot_cancel_booking(self):
        response = self.create_booking_via_api()

        booking_id = response.data["id"]

        self.authenticate(
            self.other_user
        )

        cancel_response = self.client.post(
            f"/api/bookings/{booking_id}/cancel/",
            {
                "reason": "Trying to cancel"
            },
            format="json"
        )

        self.assertEqual(
            cancel_response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_pending_booking_cannot_jump_to_completed(self):
        booking = Booking.objects.create(
            user=self.user,
            name="Test Customer",
            phone="8813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2
        )

        self.authenticate(
            self.admin
        )

        response = self.client.patch(
            f"/api/bookings/{booking.id}/",
            {
                "status": Booking.STATUS_COMPLETED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.STATUS_PENDING
        )

    def test_valid_booking_status_flow(self):
        booking = Booking.objects.create(
            user=self.user,
            name="Test Customer",
            phone="8813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2
        )

        self.authenticate(
            self.admin
        )

        response = self.client.patch(
            f"/api/bookings/{booking.id}/",
            {
                "status": Booking.STATUS_CONFIRMED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.STATUS_CONFIRMED
        )

        response = self.client.patch(
            f"/api/bookings/{booking.id}/",
            {
                "status": Booking.STATUS_COMPLETED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.STATUS_COMPLETED
        )

    def test_completed_booking_can_be_hidden(self):
        booking = Booking.objects.create(
            user=self.user,
            name="Test Customer",
            phone="8813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2,
            status=Booking.STATUS_COMPLETED
        )

        self.authenticate()

        response = self.client.post(
            f"/api/bookings/{booking.id}/hide/",
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        booking.refresh_from_db()

        self.assertTrue(
            booking.hidden_by_user
        )

        response = self.client.get(
            "/api/bookings/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            len(response.data),
            0
        )

        
    # API VALIDATION TESTS
        

    def test_booking_guests_zero_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/bookings/",
            {
                "name": "Test Customer",
                "phone": "8813073338",
                "date": self.future_date.isoformat(),
                "time": self.future_time.strftime("%H:%M:%S"),
                "guests": 0,
                "description": ""
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Booking.objects.count(),
            0
        )

    def test_booking_guests_above_twenty_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/bookings/",
            {
                "name": "Test Customer",
                "phone": "8813073338",
                "date": self.future_date.isoformat(),
                "time": self.future_time.strftime("%H:%M:%S"),
                "guests": 21,
                "description": ""
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Booking.objects.count(),
            0
        )

    def test_booking_invalid_phone_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/bookings/",
            {
                "name": "Test Customer",
                "phone": "12345",
                "date": self.future_date.isoformat(),
                "time": self.future_time.strftime("%H:%M:%S"),
                "guests": 2,
                "description": ""
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Booking.objects.count(),
            0
        )

    def test_booking_short_name_returns_400(self):
        self.authenticate()

        response = self.client.post(
            "/api/bookings/",
            {
                "name": "A",
                "phone": "8813073338",
                "date": self.future_date.isoformat(),
                "time": self.future_time.strftime("%H:%M:%S"),
                "guests": 2,
                "description": ""
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Booking.objects.count(),
            0
        )

    def test_past_booking_datetime_returns_400(self):
        self.authenticate()

        past_date = (
            timezone.localdate()
            - timedelta(days=1)
        )

        response = self.client.post(
            "/api/bookings/",
            {
                "name": "Test Customer",
                "phone": "8813073338",
                "date": past_date.isoformat(),
                "time": "18:30:00",
                "guests": 2,
                "description": ""
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(
            Booking.objects.count(),
            0
        )

        
    # PERMISSION / SECURITY TESTS
        

    def test_unauthenticated_user_cannot_access_bookings(self):
        response = self.client.get(
            "/api/bookings/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_normal_user_cannot_update_booking_status(self):
        booking = Booking.objects.create(
            user=self.user,
            name="Test Customer",
            phone="8813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2
        )

        self.authenticate(
            self.user
        )

        response = self.client.patch(
            f"/api/bookings/{booking.id}/",
            {
                "status": Booking.STATUS_CONFIRMED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.STATUS_PENDING
        )

    def test_user_cannot_retrieve_other_users_booking(self):
        booking = Booking.objects.create(
            user=self.other_user,
            name="Other User Booking",
            phone="9813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2
        )

        self.authenticate(
            self.user
        )

        response = self.client.get(
            f"/api/bookings/{booking.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_admin_can_update_other_users_booking(self):
        booking = Booking.objects.create(
            user=self.other_user,
            name="Other User Booking",
            phone="9813073338",
            date=self.future_date,
            time=self.future_time,
            guests=2
        )

        self.authenticate(
            self.admin
        )

        response = self.client.patch(
            f"/api/bookings/{booking.id}/",
            {
                "status": Booking.STATUS_CONFIRMED
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.STATUS_CONFIRMED
        )

        
    # DATABASE CONSTRAINT TEST
        

    def test_booking_guests_cannot_be_zero(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Booking.objects.create(
                    user=self.user,
                    name="Invalid Booking",
                    phone="8813073338",
                    date=self.future_date,
                    time=self.future_time,
                    guests=0
                )