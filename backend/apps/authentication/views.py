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

from common.responses import api_error, api_success

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
from django.conf import settings
from django.core.mail import send_mail
from .models import MerchantProfile, UserRoles
from .serializers import MerchantRegisterSerializer


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
        is_verified=False,
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
        status="PENDING",
    )

    # Dispatch email notification to Admin (คุณพรหมลิขิต)
    try:
        subject = (
            f"[WellTrip Admin] มีผู้ประกอบการใหม่ลงทะเบียน: {merchant.business_name}"
        )
        message = (
            f"เรียน คุณพรหมลิขิต (ผู้ดูแลระบบ WellTrip),\n\n"
            f"มีผู้ประกอบการใหม่ลงทะเบียนเข้าระบบและรอการตรวจสอบอนุมัติ:\n"
            f"- ชื่อร้าน/สถานประกอบการ: {merchant.business_name}\n"
            f"- ประเภทธุรกิจ: {merchant.get_business_category_display()}\n"
            f"- ผู้ติดต่อ: {user.full_name} ({user.email})\n"
            f"- เบอร์โทรศัพท์: {merchant.phone_number}\n"
            f"- เวลาทำการ: {merchant.opening_hours}\n"
            f"- ลิงก์แผนที่ Google Maps: {merchant.google_maps_url}\n\n"
            f"คุณสามารถเข้าตรวจสอบรายละเอียดและกดอนุมัติ (Approve) ได้ที่ Admin Console:\n"
            f"https://www.welltripthailand.com/admin/approvals"
        )
        send_mail(
            subject,
            message,
            getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@welltripthailand.com"),
            ["phromlikhit@welltripthailand.com", "admin@welltripthailand.com"],
            fail_silently=True,
        )
    except Exception:
        pass

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
        profile = MerchantProfile.objects.get(id=entity_id)
    except Exception:
        return api_error("NOT_FOUND", "Entity not found or invalid ID.", status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get("status")
    if new_status in ["APPROVED", "REJECTED"]:
        profile.status = new_status
        if request.data.get("rejection_reason"):
            profile.rejection_reason = request.data.get("rejection_reason")
        profile.save()

        if profile.user:
            if new_status == "APPROVED":
                profile.user.is_verified = True
            else:
                profile.user.is_verified = False
            profile.user.save()

    return api_success({"id": str(profile.id), "status": profile.status})




