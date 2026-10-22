"""
views.py - HTTP layer for the auth endpoints.

WHY plain @api_view functions instead of ViewSets? Auth endpoints are
single-purpose, asynchronous pairs of request->response with NO list/detail
CRUD behaviour, so ViewSets would only add ceremony.
"""
from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView

import logging

from common.responses import api_error, api_success

logger = logging.getLogger(__name__)

from .models import MerchantApprovalStatus, MerchantProfile, User, UserRoles
from .serializers import (
    GoogleIdTokenSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)
from .services import authenticate_with_google, build_unique_username, issue_tokens_for_user


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register/            (spec §4 - public, manual tourist)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        user = serializer.save()
    except IntegrityError:
        # Race safety: two simultaneous registrations with the same email.
        return api_error(
            "EMAIL_TAKEN",
            "A user with this email is already registered.",
            status=status.HTTP_400_BAD_REQUEST,
        )
    return api_success(
        {"user": UserProfileSerializer(user).data},
        message="Registration successful.",
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login/               (spec §4 - returns JWT pair)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return api_error(
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.password:
        # Google-only account (password is NULL) can NEVER be used with a
        # password. NOTE: this message reveals that the email exists and is
        # Google-linked - an accepted UX trade-off; flip to the generic
        # INVALID_CREDENTIALS response if you prefer strict anti-enumeration.
        return api_error(
            "GOOGLE_ONLY_ACCOUNT",
            "This email is linked to a Google account. Please sign in with Google.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # authenticate() applies Django's ModelBackend: it verifies the hash and
    # refuses inactive users (is_active=False) transparently.
    user = authenticate(request, username=email, password=password)
    if user is None:
        return api_error(
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    tokens = issue_tokens_for_user(user)
    return api_success(
        {
            "user": UserProfileSerializer(user).data,
            **tokens,
        },
        message="Login successful.",
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/oauth/google/        (spec §4 - verify Google ID token)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def google_oauth_view(request):
    serializer = GoogleIdTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        user, is_new_user = authenticate_with_google(serializer.validated_data["id_token"])
    except ValueError as exc:
        # Token is malformed / expired / wrong audience / unverified email.
        return api_error(
            "INVALID_ID_TOKEN",
            str(exc),
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except IntegrityError:
        # Extremely rare duplicate-email race between manual + Google signup.
        return api_error(
            "ACCOUNT_CONFLICT",
            "This email is already registered. Please log in first.",
            status=status.HTTP_409_CONFLICT,
        )

    tokens = issue_tokens_for_user(user)
    return api_success(
        {
            "user": UserProfileSerializer(user).data,
            "is_new_user": is_new_user,
            **tokens,
        },
        message="Google sign-in successful.",
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/refresh/  - silent refresh (SimpleJWT + rotation).
# Rotation is enabled in SIMPLE_JWT settings, so this endpoint mints a new
# refresh token too and blacklists the presented one.
# ---------------------------------------------------------------------------
class EnvelopedTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
        except User.DoesNotExist:
            from rest_framework_simplejwt.exceptions import InvalidToken
            raise InvalidToken("Token is invalid or user no longer exists.")
        if response.status_code == 200:
            return api_success(
                {
                    "access_token": response.data.get("access"),
                    "refresh_token": response.data.get("refresh"),
                },
                message="Token refreshed.",
            )
        return response



# ---------------------------------------------------------------------------
# GET /api/v1/auth/me/                   (authenticated user profile)
# ---------------------------------------------------------------------------
from rest_framework.permissions import IsAuthenticated


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return profile details for the currently authenticated user."""
    return api_success(
        UserProfileSerializer(request.user).data,
        message="User profile retrieved successfully.",
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register/merchant/   (vendor onboarding signup)
# ---------------------------------------------------------------------------
# POST /api/v1/auth/otp/request/ & verify/  (Email OTP verification)
# ---------------------------------------------------------------------------
import secrets
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import EmailVerificationOTP, MerchantApprovalStatus, MerchantProfile, UserRoles
from .serializers import MerchantRegisterSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def request_email_otp_view(request):
    """
    Generate and dispatch a 6-digit verification OTP to user's email via Hostinger SMTP.
    Rate limited to 1 request per 60 seconds per email.
    """
    email = request.data.get("email", "").strip().lower()
    purpose = request.data.get("purpose", "MERCHANT_REGISTER")

    if not email or "@" not in email:
        return api_error("INVALID_EMAIL", "โปรดระบุอีเมลที่ถูกต้อง", status=status.HTTP_400_BAD_REQUEST)

    # Check if email is already taken
    if User.objects.filter(email__iexact=email).exists():
        return api_error(
            "EMAIL_TAKEN",
            "อีเมลนี้ลงทะเบียนในระบบแล้ว โปรดเข้าสู่ระบบหรือใช้อีเมลอื่น",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Rate limiting: prevent spamming within 60 seconds
    recent_otp = EmailVerificationOTP.objects.filter(
        email=email,
        purpose=purpose,
        created_at__gte=timezone.now() - timedelta(seconds=60),
    ).first()
    if recent_otp:
        return api_error(
            "RATE_LIMITED",
            "โปรดรอ 60 วินาทีก่อนขอรหัส OTP ใหม่อีกครั้ง",
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # Invalidate previous unused OTPs for this email
    EmailVerificationOTP.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)

    # Generate cryptographically secure 6-digit OTP
    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = timezone.now() + timedelta(minutes=10)

    EmailVerificationOTP.objects.create(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
    )

    from common.notifications import send_otp_email
    sent = send_otp_email(email, otp_code, purpose, expires_minutes=10)
    if not sent:
        return api_error(
            "EMAIL_SEND_FAILED",
            "ไม่สามารถส่งอีเมลรหัส OTP ได้ โปรดตรวจสอบความถูกต้องของอีเมลหรือลองใหม่อีกครั้ง",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return api_success({
        "sent": True,
        "expires_in_seconds": 600,
        "message": "ส่งรหัส OTP ไปยังอีเมลของคุณเรียบร้อยแล้ว",
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email_otp_view(request):
    """
    Verify the 6-digit OTP code submitted by the user.
    """
    email = request.data.get("email", "").strip().lower()
    otp_code = request.data.get("otp_code", "").strip()
    purpose = request.data.get("purpose", "MERCHANT_REGISTER")

    if not email or not otp_code:
        return api_error("INVALID_INPUT", "โปรดระบุอีเมลและรหัส OTP ให้ครบถ้วน", status=status.HTTP_400_BAD_REQUEST)

    record = EmailVerificationOTP.objects.filter(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        is_used=False,
    ).order_by("-created_at").first()

    if not record or not record.is_valid():
        return api_error(
            "INVALID_OTP",
            "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว โปรดขอรหัสใหม่",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Mark as used upon successful validation
    record.is_used = True
    record.save(update_fields=["is_used"])

    return api_success({
        "verified": True,
        "email": email,
        "message": "ยืนยันรหัส OTP ถูกต้องเรียบร้อยแล้ว",
    })


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register/merchant/   (vendor onboarding signup)
# ---------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_merchant_view(request):
    """Register a new vendor/merchant account with status PENDING and notify Admin."""
    serializer = MerchantRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    email = data["email"].lower().strip()
    if User.objects.filter(email__iexact=email).exists():
        return api_error(
            "EMAIL_TAKEN",
            "A user with this email is already registered.",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Require OTP verification for merchant registration
    otp_code = request.data.get("otp_code", "").strip()
    if not otp_code:
        return api_error(
            "OTP_REQUIRED",
            "โปรดยืนยันรหัส OTP ทางอีเมลก่อนลงทะเบียน",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify that this OTP was validated within the last 15 minutes
    valid_otp = EmailVerificationOTP.objects.filter(
        email=email,
        otp_code=otp_code,
        purpose="MERCHANT_REGISTER",
        is_used=True,
        created_at__gte=timezone.now() - timedelta(minutes=15),
    ).exists()

    if not valid_otp:
        # Also check if it's currently unused and valid right now
        live_otp = EmailVerificationOTP.objects.filter(
            email=email,
            otp_code=otp_code,
            purpose="MERCHANT_REGISTER",
            is_used=False,
        ).order_by("-created_at").first()

        if live_otp and live_otp.is_valid():
            live_otp.is_used = True
            live_otp.save(update_fields=["is_used"])
        else:
            return api_error(
                "INVALID_OTP",
                "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว โปรดยืนยันตัวตนใหม่อีกครั้ง",
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Map category to role
    cat_to_role = {
        "HOMESTAY": UserRoles.HOMESTAY_OWNER,
        "RESTAURANT": UserRoles.RESTAURANT_OWNER,
        "WELLNESS": UserRoles.WELLNESS_OWNER,
        "OTOP": UserRoles.OTOP_OWNER,
    }
    user_role = cat_to_role.get(
        data.get("business_category", "HOMESTAY"), UserRoles.HOMESTAY_OWNER
    )

    user = User.objects.create_user(
        email=email,
        password=data["password"],
        username=build_unique_username(email),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        phone_number=data.get("phone_number", ""),
        role=user_role,
        is_verified=True,
    )

    merchant = MerchantProfile.objects.create(
        user=user,
        business_name=data["business_name"],
        business_category=data.get("business_category", "HOMESTAY"),
        description=data.get("description", ""),
        google_maps_url=data.get("google_maps_url", ""),
        phone_number=data.get("phone_number", ""),
        opening_hours=data.get("opening_hours", "08:00 - 18:00 น."),
        cover_image_url=data.get("cover_image_url", ""),
        status=MerchantApprovalStatus.PENDING,
    )

    # Dispatch email notification to Admin via Hostinger SMTP
    try:
        from common.notifications import send_admin_new_merchant_alert
        send_admin_new_merchant_alert(merchant)
    except Exception as exc:
        logger.error("Failed to dispatch admin merchant alert: %s", exc)

    tokens = issue_tokens_for_user(user)
    return api_success(
        {
            "user": UserProfileSerializer(user).data,
            **tokens,
        },
        message="Merchant registration submitted successfully. Pending review.",
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/auth/users/                (Admin user list endpoint)
# ---------------------------------------------------------------------------
from rest_framework.permissions import IsAuthenticated

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def users_list_view(request):
    if not (request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]):
        return api_error("PERMISSION_DENIED", "Admin access required.", status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().order_by("-created_at")[:100]
    serializer = UserProfileSerializer(users, many=True)
    return api_success(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user_role_view(request, user_id):
    if not (request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]):
        return api_error("PERMISSION_DENIED", "Admin access required.", status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return api_error("NOT_FOUND", "User not found.", status=status.HTTP_404_NOT_FOUND)

    role = request.data.get("role")
    if role and role in UserRoles.values:
        user.role = role
    if "is_verified" in request.data:
        user.is_verified = bool(request.data.get("is_verified"))
    if "is_active" in request.data:
        user.is_active = bool(request.data.get("is_active"))
    user.save()
    return api_success(UserProfileSerializer(user).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user_view(request, user_id):
    """
    Delete a user account (Admin only).
    - Prevents self-deletion.
    - Prevents deleting super admins unless caller is super admin.
    - Safely handles database integrity (falls back to soft-delete deactivation if historical bookings exist).
    """
    if not (request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]):
        return api_error("PERMISSION_DENIED", "Admin access required.", status=status.HTTP_403_FORBIDDEN)

    if str(request.user.id) == str(user_id):
        return api_error("CANNOT_DELETE_SELF", "ไม่สามารถลบบัญชีของตนเองได้", status=status.HTTP_400_BAD_REQUEST)

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return api_error("NOT_FOUND", "ไม่พบข้อมูลผู้ใช้นี้ในระบบ", status=status.HTTP_404_NOT_FOUND)

    # Hierarchy guard: Only Super Admin can delete other Super Admins or Community Admins
    if target_user.is_superuser or target_user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]:
        if not (request.user.is_superuser or request.user.role == UserRoles.SUPER_ADMIN):
            return api_error("PERMISSION_DENIED", "เฉพาะ Super Admin เท่านั้นที่สามารถลบบัญชีผู้ดูแลระบบได้", status=status.HTTP_403_FORBIDDEN)

    user_email = target_user.email
    user_name = target_user.full_name or user_email

    try:
        from django.db import models, transaction
        with transaction.atomic():
            target_user.delete()
        return api_success({"id": str(user_id)}, message=f"ลบบัญชีผู้ใช้ {user_name} ({user_email}) ออกจากระบบเรียบร้อยแล้ว")
    except (models.ProtectedError, models.RestrictedError):
        # User has financial/booking history that cannot be deleted per legal & audit rules.
        # Fall back to soft-delete (deactivate) so they cannot login or appear active.
        target_user.is_active = False
        target_user.save(update_fields=["is_active"])
        return api_success(
            {"id": str(user_id), "is_active": False},
            message=f"บัญชี {user_email} มีประวัติการจองหรือธุรกรรมในระบบ จึงทำการปิดการใช้งานบัญชี (Deactivate) แทนการลบถาวร เพื่อรักษาความถูกต้องของข้อมูล",
        )
    except Exception as e:
        return api_error("DELETE_FAILED", f"ไม่สามารถลบผู้ใช้ได้: {str(e)}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_approvals_list_view(request):
    if not (request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]):
        return api_error("PERMISSION_DENIED", "Admin access required.", status=status.HTTP_403_FORBIDDEN)
    
    profiles = MerchantProfile.objects.filter(status=MerchantApprovalStatus.PENDING).order_by("-created_at")[:100]
    data = []
    for p in profiles:
        data.append({
            "id": str(p.id),
            "title": p.business_name,
            "type": p.business_category,
            "owner_name": p.user.full_name if p.user else "N/A",
            "owner_email": p.user.email if p.user else "N/A",
            "province": "ศรีสะเกษ",
            "price": 0,
            "image_url": p.cover_image_url or "",
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        })
    return api_success(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_approval_action_view(request, entity_id):
    if not (request.user.is_superuser or request.user.role in [UserRoles.SUPER_ADMIN, UserRoles.COMMUNITY_ADMIN]):
        return api_error("PERMISSION_DENIED", "Admin access required.", status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = MerchantProfile.objects.select_related("user").get(id=entity_id)
    except Exception:
        return api_error("NOT_FOUND", "Entity not found or invalid ID.", status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get("status")
    if new_status in ["APPROVED", "REJECTED"]:
        profile.status = new_status
        if request.data.get("rejection_reason"):
            profile.rejection_reason = request.data.get("rejection_reason")
        elif new_status == "APPROVED":
            profile.rejection_reason = ""
        profile.save()

        if profile.user:
            if new_status == "APPROVED":
                profile.user.is_verified = True
                # Automatically activate merchant's accommodations if pending
                try:
                    profile.user.accommodations.filter(status="PENDING_VERIFICATION").update(status="ACTIVE")
                except Exception as e:
                    logging.getLogger(__name__).warning("Failed to auto-activate accommodations: %s", str(e))
            else:
                profile.user.is_verified = False
            profile.user.save()

            # Send notification email to the merchant
            try:
                from common.notifications import send_merchant_decision_notification
                send_merchant_decision_notification(
                    profile,
                    is_approved=(new_status == "APPROVED"),
                    rejection_reason=profile.rejection_reason,
                )
            except Exception as e:
                logging.getLogger(__name__).warning("Failed to send merchant approval status email: %s", str(e))

    return api_success({"id": str(profile.id), "status": profile.status})




