"""Django admin configuration for OTOP Products app."""
from django.contrib import admin

from apps.authentication.models import UserRoles
from .models import OTOPProduct


class RolePermissionMixin:
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN, UserRoles.OTOP_OWNER]

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


@admin.register(OTOPProduct)
class OTOPProductAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = ("name", "owner", "category", "price", "stock_quantity", "sku", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "sku", "description", "owner__email")
    readonly_fields = ("id", "sku")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        if request.user.role == UserRoles.OTOP_OWNER:
            return qs.filter(owner=request.user)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if not change and not getattr(obj, "owner_id", None):
            obj.owner = request.user
        super().save_model(request, obj, form, change)
