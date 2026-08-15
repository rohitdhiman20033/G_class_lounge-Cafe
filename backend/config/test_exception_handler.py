from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from config.exception_handler import custom_exception_handler


class ExceptionHandlerTests(SimpleTestCase):

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_unhandled_exception_returns_safe_500_response(self):
        request = self.factory.get(
            "/api/test-error/"
        )

        exception = ValueError(
            "SECRET_INTERNAL_ERROR"
        )

        response = custom_exception_handler(
            exception,
            {
                "request": request,
                "view": None,
            }
        )

        self.assertEqual(
            response.status_code,
            500
        )

        self.assertEqual(
            response.data,
            {
                "detail": (
                    "An unexpected server error occurred. "
                    "Please try again later."
                )
            }
        )

        self.assertNotIn(
            "SECRET_INTERNAL_ERROR",
            str(response.data)
        )