import logging

from django.test import SimpleTestCase

from config.logging_filters import SensitiveDataFilter


class SensitiveDataFilterTests(SimpleTestCase):

    def setUp(self):
        self.filter = SensitiveDataFilter()

    def filter_message(self, message):
        record = logging.LogRecord(
            name="test",
            level=logging.WARNING,
            pathname=__file__,
            lineno=1,
            msg=message,
            args=(),
            exc_info=None,
        )

        self.filter.filter(record)

        return record.getMessage()

    def test_password_is_redacted(self):
        result = self.filter_message(
            "password=SecretPass123!"
        )

        self.assertNotIn(
            "SecretPass123!",
            result
        )

        self.assertIn(
            "***REDACTED***",
            result
        )

    def test_otp_is_redacted(self):
        result = self.filter_message(
            "otp=123456"
        )

        self.assertNotIn(
            "123456",
            result
        )

        self.assertIn(
            "***REDACTED***",
            result
        )

    def test_token_is_redacted(self):
        result = self.filter_message(
            "token=abc123xyz"
        )

        self.assertNotIn(
            "abc123xyz",
            result
        )

        self.assertIn(
            "***REDACTED***",
            result
        )

    def test_authorization_is_redacted(self):
        result = self.filter_message(
            "authorization=BearerSecretToken"
        )

        self.assertNotIn(
            "BearerSecretToken",
            result
        )

        self.assertIn(
            "***REDACTED***",
            result
        )