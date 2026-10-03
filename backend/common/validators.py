"""Shared field validators (spec §3 Folder Tree: "PhoneNumber, Coordinates").

Thailand mobile numbers: 10 digits starting with 06, 08, or 09
(kept identical to the frontend Zod regex in spec §8.1 so both layers
agree on what a valid number looks like).
"""
import re

from django.core.exceptions import ValidationError

THAI_MOBILE_RE = re.compile(r"^0[689]\d{8}$")


def validate_phone_number(value):
    """No-op for empty values; strict Thai format otherwise."""
    if not value:
        return
    if not THAI_MOBILE_RE.fullmatch(str(value)):
        raise ValidationError(
            "Invalid Thailand mobile number format "
            "(must be 10 digits starting with 06, 08, or 09)."
        )
