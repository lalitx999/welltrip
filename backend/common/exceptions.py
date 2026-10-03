"""Standardized DRF exception handler (spec §8.2 - "Backend Error Normalizer").

Every DRF-handled error (Http404, PermissionDenied, ValidationError, ...) is
rewritten into the project's error envelope before leaving the API.

Dev-only tweak vs. the spec snippet: when DEBUG=True and the exception is
NOT handled by DRF we re-raise it so the developer still gets Django's
interactive debug page. In production the same case returns a JSON 500.
"""
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import exception_handler

from rest_framework import status


def standardized_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "error": {
                # Spec: exception class name, uppercased.
                "code": exc.__class__.__name__.upper(),
                "details": response.data,
            },
            "message": "An error occurred while processing the request.",
        }
    else:
        if settings.DEBUG:
            raise exc
        response = Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "details": str(exc),
                },
                "message": "Critical unhandled server exception encountered.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return response
