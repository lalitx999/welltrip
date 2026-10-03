"""HTTP Views for AI Recommendations API (Dual-AI Engine)."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from common.responses import api_success
from .models import HealthProfile
from .serializers import HealthAssessmentSerializer
from .services import process_dual_ai_recommendation


@api_view(["POST"])
@permission_classes([AllowAny])
def health_assessment_view(request):
    """Process Health Assessment & generate Dual-AI Trip Package (DeepSeek + Gemini)."""
    serializer = HealthAssessmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = process_dual_ai_recommendation(request.user, serializer.validated_data)

    return api_success(
        result,
        message="Dual-AI Health Recommendation Package generated successfully.",
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_health_profile_view(request):
    """Retrieve current tourist's saved HealthProfile."""
    profile = HealthProfile.objects.filter(user=request.user).first()
    if not profile:
        return api_success(None, message="No health profile recorded yet.")

    data = {
        "weight_kg": str(profile.weight_kg),
        "height_cm": str(profile.height_cm),
        "bmi": str(profile.bmi),
        "bmr": profile.bmr,
        "gender": profile.gender,
        "age": profile.age,
        "health_goal": profile.health_goal,
        "lifestyle": profile.lifestyle,
        "dietary_restrictions": profile.dietary_restrictions,
        "updated_at": profile.updated_at.isoformat(),
    }
    return api_success(data, message="Health profile retrieved.")
