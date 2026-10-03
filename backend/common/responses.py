"""Standardized API response helpers (spec §4 "Standard Response Envelopes").

Every endpoint returns either:
  success: {success: true,  data, message, meta?}
  failure: {success: false, error: {code, details}, message}
"""
from rest_framework.response import Response


def api_success(data=None, message="Request succeeded.", status=200, meta=None):
    payload = {
        "success": True,
        "data": data,
        "message": message,
    }
    if meta is not None:
        payload["meta"] = meta
    return Response(payload, status=status)


def api_error(code="ERROR", message="Request failed.", details=None, status=400):
    payload = {
        "success": False,
        "error": {
            "code": code,
            "details": details,
        },
        "message": message,
    }
    return Response(payload, status=status)
