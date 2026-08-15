from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    EmailVerificationOTP,
    PasswordResetOTP,
)


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class AccountAPITests(APITestCase):

    def setUp(self):
        cache.clear()

        self.password = "TestPass123!"

        self.user = User.objects.create_user(
            username="customer@example.com",
            email="customer@example.com",
            password=self.password,
            first_name="Test",
            last_name="Customer"
        )

        self.user.profile.is_verified = True

        self.user.profile.save(
            update_fields=[
                "is_verified"
            ]
        )

    def tearDown(self):
        cache.clear()

    def authenticate(self):
        self.client.force_authenticate(
            user=self.user
        )

    # ==================================================
    # LOGIN TESTS
    # ==================================================

    def test_login_success(self):
        response = self.client.post(
            "/api/accounts/login/",
            {
                "email": self.user.email,
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn(
            "access",
            response.data
        )

        self.assertIn(
            "refresh",
            response.data
        )

    def test_login_with_wrong_password_fails(self):
        response = self.client.post(
            "/api/accounts/login/",
            {
                "email": self.user.email,
                "password": "WrongPassword123!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_unverified_user_cannot_login(self):
        self.user.profile.is_verified = False

        self.user.profile.save(
            update_fields=[
                "is_verified"
            ]
        )

        response = self.client.post(
            "/api/accounts/login/",
            {
                "email": self.user.email,
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # ==================================================
    # CURRENT USER TESTS
    # ==================================================

    def test_authenticated_user_can_access_me(self):
        self.authenticate()

        response = self.client.get(
            "/api/accounts/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data["email"],
            self.user.email
        )

    def test_unauthenticated_user_cannot_access_me(self):
        response = self.client.get(
            "/api/accounts/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    # ==================================================
    # PROFILE TESTS
    # ==================================================

    def test_user_can_update_profile(self):
        self.authenticate()

        response = self.client.patch(
            "/api/accounts/me/",
            {
                "bio": "G-Class Lounge customer",
                "city": "Naraingarh",
                "state": "Haryana",
                "country": "India"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.user.refresh_from_db()
        self.user.profile.refresh_from_db()

        self.assertEqual(
            self.user.profile.bio,
            "G-Class Lounge customer"
        )

        self.assertEqual(
            self.user.profile.city,
            "Naraingarh"
        )

        self.assertEqual(
            self.user.profile.state,
            "Haryana"
        )

        self.assertEqual(
            self.user.profile.country,
            "India"
        )

    # ==================================================
    # CHANGE PASSWORD TESTS
    # ==================================================

    def test_user_can_change_password(self):
        self.authenticate()

        new_password = "NewTestPass456!"

        response = self.client.post(
            "/api/accounts/change-password/",
            {
                "current_password": self.password,
                "new_password": new_password,
                "confirm_password": new_password
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                new_password
            )
        )

        self.assertFalse(
            self.user.check_password(
                self.password
            )
        )

    def test_wrong_current_password_is_rejected(self):
        self.authenticate()

        response = self.client.post(
            "/api/accounts/change-password/",
            {
                "current_password": "WrongPassword123!",
                "new_password": "NewTestPass456!",
                "confirm_password": "NewTestPass456!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_old_password_cannot_login_after_change(self):
        self.authenticate()

        new_password = "NewTestPass456!"

        change_response = self.client.post(
            "/api/accounts/change-password/",
            {
                "current_password": self.password,
                "new_password": new_password,
                "confirm_password": new_password
            },
            format="json"
        )

        self.assertEqual(
            change_response.status_code,
            status.HTTP_200_OK
        )

        self.client.force_authenticate(
            user=None
        )

        response = self.client.post(
            "/api/accounts/login/",
            {
                "email": self.user.email,
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_new_password_can_login_after_change(self):
        self.authenticate()

        new_password = "NewTestPass456!"

        change_response = self.client.post(
            "/api/accounts/change-password/",
            {
                "current_password": self.password,
                "new_password": new_password,
                "confirm_password": new_password
            },
            format="json"
        )

        self.assertEqual(
            change_response.status_code,
            status.HTTP_200_OK
        )

        self.client.force_authenticate(
            user=None
        )

        response = self.client.post(
            "/api/accounts/login/",
            {
                "email": self.user.email,
                "password": new_password
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn(
            "access",
            response.data
        )

        self.assertIn(
            "refresh",
            response.data
        )

    # ==================================================
    # REGISTRATION TESTS
    # ==================================================

    def test_registration_creates_verification_otp(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "full_name": "New Customer",
                "email": "newcustomer@example.com",
                "phone": "9876543210",
                "password": "NewUserPass123!",
                "confirm_password": "NewUserPass123!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        user = User.objects.get(
            email="newcustomer@example.com"
        )

        self.assertFalse(
            user.profile.is_verified
        )

        otp = EmailVerificationOTP.objects.filter(
            user=user,
            is_used=False
        ).first()

        self.assertIsNotNone(
            otp
        )

        self.assertEqual(
            len(otp.otp),
            6
        )

        self.assertTrue(
            otp.otp.isdigit()
        )

        self.assertEqual(
            len(mail.outbox),
            1
        )

    # ==================================================
    # EMAIL VERIFICATION TESTS
    # ==================================================

    def test_email_verification_otp_verifies_user(self):
        user = User.objects.create_user(
            username="verify@example.com",
            email="verify@example.com",
            password="VerifyPass123!"
        )

        user.profile.is_verified = False

        user.profile.save(
            update_fields=[
                "is_verified"
            ]
        )

        otp = EmailVerificationOTP.objects.create(
            user=user,
            otp="123456",
            expires_at=(
                timezone.now()
                + timedelta(minutes=10)
            )
        )

        response = self.client.post(
            "/api/accounts/verify-email/",
            {
                "email": user.email,
                "otp": "123456"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        user.profile.refresh_from_db()
        otp.refresh_from_db()

        self.assertTrue(
            user.profile.is_verified
        )

        self.assertTrue(
            otp.is_used
        )

    def test_invalid_email_verification_otp_fails(self):
        user = User.objects.create_user(
            username="verify2@example.com",
            email="verify2@example.com",
            password="VerifyPass123!"
        )

        user.profile.is_verified = False

        user.profile.save(
            update_fields=[
                "is_verified"
            ]
        )

        EmailVerificationOTP.objects.create(
            user=user,
            otp="123456",
            expires_at=(
                timezone.now()
                + timedelta(minutes=10)
            )
        )

        response = self.client.post(
            "/api/accounts/verify-email/",
            {
                "email": user.email,
                "otp": "999999"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        user.profile.refresh_from_db()

        self.assertFalse(
            user.profile.is_verified
        )

    def test_expired_email_verification_otp_fails(self):
        user = User.objects.create_user(
            username="expired@example.com",
            email="expired@example.com",
            password="VerifyPass123!"
        )

        user.profile.is_verified = False

        user.profile.save(
            update_fields=[
                "is_verified"
            ]
        )

        EmailVerificationOTP.objects.create(
            user=user,
            otp="123456",
            expires_at=(
                timezone.now()
                - timedelta(minutes=1)
            )
        )

        response = self.client.post(
            "/api/accounts/verify-email/",
            {
                "email": user.email,
                "otp": "123456"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        user.profile.refresh_from_db()

        self.assertFalse(
            user.profile.is_verified
        )

    # ==================================================
    # RESEND VERIFICATION OTP TESTS
    # ==================================================

    def test_resend_verification_otp(self):
        user = User.objects.create_user(
            username="resend@example.com",
            email="resend@example.com",
            password="VerifyPass123!"
        )

        user.profile.is_verified = False

        user.profile.save(
            update_fields=[
                "is_verified"
            ]
        )

        response = self.client.post(
            "/api/accounts/resend-verification-otp/",
            {
                "email": user.email
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        otp = EmailVerificationOTP.objects.filter(
            user=user,
            is_used=False
        ).first()

        self.assertIsNotNone(
            otp
        )

        self.assertEqual(
            len(otp.otp),
            6
        )

        self.assertEqual(
            len(mail.outbox),
            1
        )

    def test_verified_user_cannot_resend_verification_otp(self):
        response = self.client.post(
            "/api/accounts/resend-verification-otp/",
            {
                "email": self.user.email
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # ==================================================
    # FORGOT PASSWORD TESTS
    # ==================================================

    def test_forgot_password_creates_otp(self):
        response = self.client.post(
            "/api/accounts/forgot-password/",
            {
                "email": self.user.email
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        otp = PasswordResetOTP.objects.filter(
            user=self.user,
            is_used=False
        ).first()

        self.assertIsNotNone(
            otp
        )

        self.assertEqual(
            len(otp.otp),
            6
        )

        self.assertTrue(
            otp.otp.isdigit()
        )

        self.assertEqual(
            len(mail.outbox),
            1
        )

    def test_forgot_password_unknown_email_does_not_reveal_user(self):
        response = self.client.post(
            "/api/accounts/forgot-password/",
            {
                "email": "doesnotexist@example.com"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            PasswordResetOTP.objects.count(),
            0
        )

    # ==================================================
    # VERIFY PASSWORD RESET OTP TESTS
    # ==================================================

    def test_verify_password_reset_otp(self):
        PasswordResetOTP.objects.create(
            user=self.user,
            otp="654321",
            expires_at=(
                timezone.now()
                + timedelta(minutes=5)
            )
        )

        response = self.client.post(
            "/api/accounts/verify-reset-otp/",
            {
                "email": self.user.email,
                "otp": "654321"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

    def test_invalid_password_reset_otp_fails(self):
        PasswordResetOTP.objects.create(
            user=self.user,
            otp="654321",
            expires_at=(
                timezone.now()
                + timedelta(minutes=5)
            )
        )

        response = self.client.post(
            "/api/accounts/verify-reset-otp/",
            {
                "email": self.user.email,
                "otp": "111111"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_expired_password_reset_otp_fails(self):
        otp = PasswordResetOTP.objects.create(
            user=self.user,
            otp="654321",
            expires_at=(
                timezone.now()
                - timedelta(minutes=1)
            )
        )

        response = self.client.post(
            "/api/accounts/verify-reset-otp/",
            {
                "email": self.user.email,
                "otp": "654321"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        otp.refresh_from_db()

        self.assertTrue(
            otp.is_used
        )

    # ==================================================
    # RESET PASSWORD TESTS
    # ==================================================

    def test_reset_password_with_valid_otp(self):
        otp = PasswordResetOTP.objects.create(
            user=self.user,
            otp="654321",
            expires_at=(
                timezone.now()
                + timedelta(minutes=5)
            )
        )

        new_password = "ResetPass456!"

        response = self.client.post(
            "/api/accounts/reset-password/",
            {
                "email": self.user.email,
                "otp": "654321",
                "new_password": new_password,
                "confirm_password": new_password
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.user.refresh_from_db()
        otp.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                new_password
            )
        )

        self.assertTrue(
            otp.is_used
        )

    def test_reset_password_with_wrong_otp_fails(self):
        PasswordResetOTP.objects.create(
            user=self.user,
            otp="654321",
            expires_at=(
                timezone.now()
                + timedelta(minutes=5)
            )
        )

        response = self.client.post(
            "/api/accounts/reset-password/",
            {
                "email": self.user.email,
                "otp": "111111",
                "new_password": "ResetPass456!",
                "confirm_password": "ResetPass456!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                self.password
            )
        )

    def test_reset_password_mismatch_fails(self):
        PasswordResetOTP.objects.create(
            user=self.user,
            otp="654321",
            expires_at=(
                timezone.now()
                + timedelta(minutes=5)
            )
        )

        response = self.client.post(
            "/api/accounts/reset-password/",
            {
                "email": self.user.email,
                "otp": "654321",
                "new_password": "ResetPass456!",
                "confirm_password": "DifferentPass456!"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # ==================================================
    # LOGOUT TESTS
    # ==================================================

    def test_logout_with_valid_refresh_token(self):
        login_response = self.client.post(
            "/api/accounts/login/",
            {
                "email": self.user.email,
                "password": self.password
            },
            format="json"
        )

        self.assertEqual(
            login_response.status_code,
            status.HTTP_200_OK
        )

        access = login_response.data["access"]
        refresh = login_response.data["refresh"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access}"
        )

        response = self.client.post(
            "/api/accounts/logout/",
            {
                "refresh": refresh
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

    def test_logout_without_authentication_fails(self):
        response = self.client.post(
            "/api/accounts/logout/",
            {
                "refresh": "invalid-token"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )



class AccountThrottleTests(APITestCase):

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_login_rate_limit_returns_429(self):
        data = {
            "email": "doesnotexist@example.com",
            "password": "WrongPassword123!"
        }

        responses = []

        for _ in range(11):
            response = self.client.post(
                "/api/accounts/login/",
                data,
                format="json"
            )

            responses.append(response)

        for response in responses[:10]:
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST
            )

        self.assertEqual(
            responses[10].status_code,
            status.HTTP_429_TOO_MANY_REQUESTS
        )

    def test_otp_rate_limit_returns_429(self):
        data = {
            "email": "doesnotexist@example.com",
            "otp": "123456"
        }

        responses = []

        for _ in range(6):
            response = self.client.post(
                "/api/accounts/verify-email/",
                data,
                format="json"
            )

            responses.append(response)

        for response in responses[:5]:
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST
            )

        self.assertEqual(
            responses[5].status_code,
            status.HTTP_429_TOO_MANY_REQUESTS
        )

    def test_password_reset_rate_limit_returns_429(self):
        data = {
            "email": "doesnotexist@example.com",
            "otp": "123456"
        }

        responses = []

        for _ in range(6):
            response = self.client.post(
                "/api/accounts/verify-reset-otp/",
                data,
                format="json"
            )

            responses.append(response)

        for response in responses[:5]:
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST
            )

        self.assertEqual(
            responses[5].status_code,
            status.HTTP_429_TOO_MANY_REQUESTS
        )