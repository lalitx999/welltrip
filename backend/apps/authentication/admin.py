"""Django admin registration for the custom User model.

A custom UserAdmin is required because our model has no username-as-login
and no date_joined, so the stock UserAdmin forms would crash. We provide
dedicated creation/change forms bound to OUR fields.
"""
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import User, UserRoles


class UserChangeForm(forms.ModelForm):
    """Admin "change" form: show password as a read-only hash widget."""

    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = "__all__"


class UserCreationForm(forms.ModelForm):
    """Admin "add" form: password must be typed twice (never stored raw)."""

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation",
        widget=forms.PasswordInput,
        help_text="Enter the same password as above, for verification.",
    )

    class Meta:
        model = User
        fields = ("email", "username", "first_name", "last_name", "role")

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


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


@admin.register(User)
class CustomUserAdmin(RolePermissionMixin, UserAdmin):
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]
    form = UserChangeForm

    add_form = UserCreationForm

    list_display = (
        "email",
        "username",
        "full_name",
        "role",
        "is_verified",
        "is_active",
        "google_sub_id",
        "created_at",
    )
    list_filter = ("role", "is_verified", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("email",)
    readonly_fields = ("id", "last_login", "created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        (
            "Personal info",
            {"fields": ("username", "first_name", "last_name", "phone_number")},
        ),
        (
            "Identity & Roles",
            {"fields": ("role", "google_sub_id", "is_verified")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "username",
                    "first_name",
                    "last_name",
                    "role",
                ),
            },
        ),
    )

    actions = ["grant_staff_access", "revoke_staff_access", "verify_users"]

    @admin.action(description="Grant staff access (is_staff=True)")
    def grant_staff_access(self, request, queryset):
        updated = queryset.update(is_staff=True)
        self.message_user(request, f"Granted staff access to {updated} user(s).")

    @admin.action(description="Revoke staff access (is_staff=False)")
    def revoke_staff_access(self, request, queryset):
        updated = queryset.update(is_staff=False)
        self.message_user(request, f"Revoked staff access from {updated} user(s).")

    @admin.action(description="Mark selected users as verified")
    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"Marked {updated} user(s) as verified.")

    def save_model(self, request, obj, form, change):
        """Superusers created through the admin get the SUPER_ADMIN role."""
        if obj.is_superuser and obj.role != UserRoles.SUPER_ADMIN:
            obj.role = UserRoles.SUPER_ADMIN
        super().save_model(request, obj, form, change)

