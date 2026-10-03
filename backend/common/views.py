"""
Shared helpers for class-based views (used by all Step 3 app slices).

WHY this file exists: DRF's generic views return plain data, but every
WellTrip endpoint MUST answer in the standard envelope
`{success, data, message, meta?}` (spec §4 + common/responses). This mixin
normalizes 2xx CBV responses in ONE place so each view does not re-wrap.
Errors are already normalized centrally by common.exceptions.

NOTE: responses produced by StandardPagination (and api_success() calls) are
already enveloped - their payload carries a "success" key - so the mixin skips
them to avoid double-wrapping.
"""
from apps.authentication.models import UserRoles


class EnvelopeMixin:
    """Wrap a successful (2xx) CBV response into the standard envelope."""

    success_message = "Request succeeded."

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        if 200 <= response.status_code < 300:
            data = getattr(response, "data", None)
            already_enveloped = isinstance(data, dict) and "success" in data
            if not already_enveloped:
                response.data = {
                    "success": True,
                    "data": data,
                    "message": getattr(self, "success_message", "Request succeeded."),
                }
        return response


def can_manage_vendor_object(user, obj):
    """True when `user` may write to a vendor-owned object (`obj.owner_id`).

    SUPER_ADMIN is allowed to act on any vendor's content (common/permissions
    grants it through the owner role gates), so it bypasses the plain ownership
    test. Any other user must be the record's owner - this is the IDOR guard
    shared by every vendor app (accommodations, services, otop, ...).

    NOTE: for rows without an owner column (Room -> accommodation, time slot ->
    service) the caller resolves the owning parent and passes THAT object here.
    """
    if user.role == UserRoles.SUPER_ADMIN:
        return True
    return getattr(obj, "owner_id", None) == user.id
