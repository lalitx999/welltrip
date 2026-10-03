"""Django admin configuration for Bookings app."""
from django.contrib import admin

from apps.authentication.models import UserRoles
from .models import Booking, BookingItem


class RolePermissionMixin:
    allowed_roles = [
        UserRoles.SUPER_ADMIN,
        UserRoles.COMMUNITY_ADMIN,
        UserRoles.HOMESTAY_OWNER,
        UserRoles.RESTAURANT_OWNER,
        UserRoles.WELLNESS_OWNER,
        UserRoles.OTOP_OWNER,
    ]

    def has_module_permission(self, request):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.is_staff and request.user.role in self.allowed_roles

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_change_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        return self.has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_module_permission(request)


class BookingItemInline(admin.TabularInline):
    model = BookingItem
    extra = 0
    readonly_fields = (
        "item_type",
        "entity_id",
        "vendor",
        "item_title_snapshot",
        "unit_price_snapshot",
        "quantity",
        "total_price",
        "scheduled_date",
        "scheduled_end_date",
        "scheduled_time_slot",
    )
    can_delete = False


@admin.register(Booking)
class BookingAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = (
        "booking_code",
        "user",
        "status",
        "total_subtotal",
        "platform_fee",
        "net_amount",
        "expires_at",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("booking_code", "user__email", "idempotency_key")
    readonly_fields = ("id", "booking_code", "created_at", "updated_at")
    inlines = [BookingItemInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role in [
            UserRoles.HOMESTAY_OWNER,
            UserRoles.RESTAURANT_OWNER,
            UserRoles.WELLNESS_OWNER,
            UserRoles.OTOP_OWNER,
        ]:
            return qs.filter(items__vendor=request.user).distinct()
        return qs.none()


@admin.register(BookingItem)
class BookingItemAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "item_type",
        "item_title_snapshot",
        "vendor",
        "quantity",
        "unit_price_snapshot",
        "total_price",
        "scheduled_date",
    )
    list_filter = ("item_type", "scheduled_date")
    search_fields = ("booking__booking_code", "item_title_snapshot", "vendor__email")
    readonly_fields = ("id",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role in [
            UserRoles.HOMESTAY_OWNER,
            UserRoles.RESTAURANT_OWNER,
            UserRoles.WELLNESS_OWNER,
            UserRoles.OTOP_OWNER,
        ]:
            return qs.filter(vendor=request.user)
        return qs.none()
