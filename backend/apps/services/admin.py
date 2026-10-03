"""Django admin configuration for Healthy Dining & Wellness Services app."""
from django.contrib import admin

from apps.authentication.models import UserRoles
from .models import FoodMenu, WellnessService, WellnessTimeSlot


class RolePermissionMixin:
    allowed_roles = []

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


class WellnessTimeSlotInline(admin.TabularInline):
    model = WellnessTimeSlot
    extra = 1
    fields = ("slot_date", "start_time", "end_time", "capacity_available")


@admin.register(FoodMenu)
class FoodMenuAdmin(RolePermissionMixin, admin.ModelAdmin):
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN, UserRoles.RESTAURANT_OWNER]
    list_display = ("name", "owner", "price", "wellness_category", "calorie_estimate", "is_available")
    list_filter = ("wellness_category", "is_available")
    search_fields = ("name", "description", "owner__email")
    readonly_fields = ("id",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.RESTAURANT_OWNER:
            return qs.filter(owner=request.user)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if not change and not getattr(obj, "owner_id", None):
            obj.owner = request.user
        super().save_model(request, obj, form, change)


@admin.register(WellnessService)
class WellnessServiceAdmin(RolePermissionMixin, admin.ModelAdmin):
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN, UserRoles.WELLNESS_OWNER]
    list_display = ("title", "owner", "price", "duration_minutes", "max_capacity_per_session", "is_active")
    list_filter = ("is_active",)
    search_fields = ("title", "description", "owner__email")
    readonly_fields = ("id",)
    inlines = [WellnessTimeSlotInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.WELLNESS_OWNER:
            return qs.filter(owner=request.user)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if not change and not getattr(obj, "owner_id", None):
            obj.owner = request.user
        super().save_model(request, obj, form, change)


@admin.register(WellnessTimeSlot)
class WellnessTimeSlotAdmin(RolePermissionMixin, admin.ModelAdmin):
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN, UserRoles.WELLNESS_OWNER]
    list_display = ("service", "slot_date", "start_time", "end_time", "capacity_available")
    list_filter = ("slot_date",)
    search_fields = ("service__title",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.WELLNESS_OWNER:
            return qs.filter(service__owner=request.user)
        return qs.none()

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "service" and not (
            request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]
        ):
            kwargs["queryset"] = WellnessService.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
