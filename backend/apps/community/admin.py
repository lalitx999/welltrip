from django.contrib import admin
from .models import EditorialEntry


@admin.register(EditorialEntry)
class EditorialEntryAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "is_published", "updated_at")
    list_filter = ("kind", "is_published")
    search_fields = ("title", "title_en", "location")

    def has_module_permission(self, request):
        return request.user.is_superuser or getattr(request.user, "role", "") == "SUPER_ADMIN"

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    has_add_permission = has_view_permission
    has_change_permission = has_view_permission
    has_delete_permission = has_view_permission
