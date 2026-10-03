"""Django admin configuration for Accommodations app."""
from django.contrib import admin

from apps.authentication.models import UserRoles
from .models import Accommodation, Room, RoomImage, RoomPricingCalendar


class RolePermissionMixin:
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN, UserRoles.HOMESTAY_OWNER]

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


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1
    fields = ("image_url", "order", "is_primary")


class RoomPricingCalendarInline(admin.TabularInline):
    model = RoomPricingCalendar
    extra = 1
    fields = ("date", "price_override", "available_count")


class RoomInline(admin.StackedInline):
    model = Room
    extra = 1
    fields = ("name", "base_capacity", "max_capacity", "base_price_per_night", "total_inventory", "is_active")


@admin.register(Accommodation)
class AccommodationAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = ("name", "owner", "province", "district", "status", "created_at")
    list_filter = ("status", "province")
    search_fields = ("name", "province", "district", "owner__email")
    readonly_fields = ("id", "slug", "created_at")
    inlines = [RoomInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.HOMESTAY_OWNER:
            return qs.filter(owner=request.user)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if not change and not getattr(obj, "owner_id", None):
            obj.owner = request.user
        super().save_model(request, obj, form, change)


@admin.register(Room)
class RoomAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = ("name", "accommodation", "base_price_per_night", "base_capacity", "total_inventory", "is_active")
    list_filter = ("is_active", "accommodation__province")
    search_fields = ("name", "accommodation__name")
    readonly_fields = ("id",)
    inlines = [RoomImageInline, RoomPricingCalendarInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.HOMESTAY_OWNER:
            return qs.filter(accommodation__owner=request.user)
        return qs.none()

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "accommodation" and not (
            request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]
        ):
            kwargs["queryset"] = Accommodation.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(RoomPricingCalendar)
class RoomPricingCalendarAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = ("room", "date", "price_override", "available_count")
    list_filter = ("date",)
    search_fields = ("room__name", "room__accommodation__name")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.HOMESTAY_OWNER:
            return qs.filter(room__accommodation__owner=request.user)
        return qs.none()
