"""
Role-based DRF permission classes (Phase1.md §3 Folder Tree: "permissions.py").

WHY subclass-per-role (not a factory that returns instances):
- DRF instantiates every entry of `permission_classes` for each request, so the
  entries must be *classes*. A base class (`IsRole`) owns the single rule
  "authenticated AND role in allowed_roles", and each concrete subclass only
  declares which roles pass its gate. No boilerplate, one source of truth.

WHY SUPER_ADMIN bypasses the four vendor gates:
- A platform administrator should be able to help manage vendor content, so
  SUPER_ADMIN is let through IsHomestayOwner/IsRestaurantOwner/IsWellnessOwner/
  IsOtopOwner. COMMUNITY_ADMIN is deliberately NOT granted this power.
- NOTE: role gates alone never protect against IDOR. Every view that mutates a
  vendor-owned object MUST still verify `obj.owner == request.user`.

WHY IsTourist opts out of the SUPER_ADMIN bypass:
- Booking/checkout/slip-upload are buyer money flows: the Booking row must
  belong to a real TOURIST account. An admin who needs to test the buyer flow
  should use a TOURIST account instead of impersonating through the gate.
"""
from rest_framework.permissions import BasePermission

from apps.authentication.models import UserRoles


class IsRole(BasePermission):
    """
    Gate: request.user is authenticated, active, and has one of `allowed_roles`.

    Base class is fail-safe: empty `allowed_roles` + no admin bypass denies
    everybody. Subclasses must opt in explicitly.

    Override `admin_can_impersonate = True` only on gates where a SUPER_ADMIN
    may act on behalf of the role owner (vendor content management).
    """

    allowed_roles = frozenset()
    admin_can_impersonate = False
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated or not user.is_active:
            return False

        # Platform administrator: allowed through vendor (owner) gates only.
        if user.role == UserRoles.SUPER_ADMIN:
            return self.admin_can_impersonate

        return user.role in self.allowed_roles


class IsHomestayOwner(IsRole):
    allowed_roles = frozenset({UserRoles.HOMESTAY_OWNER})
    admin_can_impersonate = True


class IsRestaurantOwner(IsRole):
    allowed_roles = frozenset({UserRoles.RESTAURANT_OWNER})
    admin_can_impersonate = True


class IsWellnessOwner(IsRole):
    allowed_roles = frozenset({UserRoles.WELLNESS_OWNER})
    admin_can_impersonate = True


class IsOtopOwner(IsRole):
    allowed_roles = frozenset({UserRoles.OTOP_OWNER})
    admin_can_impersonate = True


class IsTourist(IsRole):
    allowed_roles = frozenset({UserRoles.TOURIST})
    # Buyer money flows stay TOURIST-only (no SUPER_ADMIN impersonation).
    admin_can_impersonate = False


class IsCommunityAdmin(IsRole):
    allowed_roles = frozenset({UserRoles.COMMUNITY_ADMIN})
    admin_can_impersonate = False


class IsSuperAdmin(IsRole):
    allowed_roles = frozenset({UserRoles.SUPER_ADMIN})
    admin_can_impersonate = False
