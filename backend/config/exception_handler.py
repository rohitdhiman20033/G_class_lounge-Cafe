import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger("django.request")


def custom_exception_handler(exc, context):
    response = exception_handler(
        exc,
        context
    )

    if response is not None:
        return response

    view = context.get("view")
    request = context.get("request")

    logger.exception(
        "Unhandled API exception | "
        "view=%s | method=%s | path=%s",
        (
            view.__class__.__name__
            if view
            else "UnknownView"
        ),
        (
            request.method
            if request
            else "UNKNOWN"
        ),
        (
            request.path
            if request
            else "UNKNOWN"
        ),
        exc_info=exc,
    )

    return Response(
        {
            "detail": (
                "An unexpected server error occurred. "
                "Please try again later."
            )
        },
        status=500,
    )