"""Django admin configuration for Payments app (Slip Verification Flow)."""
from django.contrib import admin
from django.utils import timezone

from apps.authentication.models import UserRoles
from apps.bookings.models import BookingStatus
from .models import Payment, PaymentChannel, PaymentSlip, PaymentStatus, SlipVerificationStatus


class RolePermissionMixin:
    allowed_roles = [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]

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


class PaymentSlipInline(admin.StackedInline):
    model = PaymentSlip
    extra = 0
    readonly_fields = ("id", "uploader", "image", "original_filename", "uploaded_at", "checked_at")


@admin.register(Payment)
class PaymentAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "payment_channel",
        "amount",
        "status",
        "paid_at",
        "created_at",
    )
    list_filter = ("status", "payment_channel", "created_at")
    search_fields = ("booking__booking_code", "payee_account_number", "payee_account_name")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [PaymentSlipInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
            return qs
        return qs.none()


@admin.register(PaymentSlip)
class PaymentSlipAdmin(RolePermissionMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "payment",
        "uploader",
        "status",
        "amount_seen",
        "provider_reference",
        "uploaded_at",
    )
    list_filter = ("status", "uploaded_at")
    search_fields = ("payment__booking__booking_code", "uploader__email", "provider_reference")
    readonly_fields = ("id", "uploaded_at", "checked_at")
    actions = ["approve_slip", "reject_slip"]

    @admin.action(description="Approve Slip & Confirm Booking")
    def approve_slip(self, request, queryset):
        count = 0
        now = timezone.now()
        for slip in queryset:
            if slip.status != SlipVerificationStatus.VERIFIED:
                slip.status = SlipVerificationStatus.VERIFIED
                slip.checked_at = now
                if not slip.provider_reference:
                    slip.provider_reference = f"MANUAL-REF-{now.strftime('%Y%m%d%H%M%S')}-{slip.pk.hex[:6]}"
                slip.save()

                # Update payment
                payment = slip.payment
                payment.status = PaymentStatus.SUCCESS
                payment.paid_at = now
                payment.save()

                # Update booking
                booking = payment.booking
                booking.status = BookingStatus.CONFIRMED
                booking.save()

                count += 1

        self.message_user(request, f"Approved {count} payment slip(s) and confirmed associated bookings.")

    @admin.action(description="Reject Slip")
    def reject_slip(self, request, queryset):
        count = 0
        now = timezone.now()
        for slip in queryset:
            if slip.status != SlipVerificationStatus.REJECTED:
                slip.status = SlipVerificationStatus.REJECTED
                slip.checked_at = now
                slip.save()

                payment = slip.payment
                payment.status = PaymentStatus.FAILED
                payment.save()

                count += 1

        self.message_user(request, f"Rejected {count} payment slip(s).")
