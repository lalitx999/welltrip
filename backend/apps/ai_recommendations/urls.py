"""URL routes for AI Recommendations & Health API."""
from django.urls import path
from . import views

app_name = "ai_recommendations"

urlpatterns = [
    path("assessment/", views.health_assessment_view, name="health-assessment"),
    path("my-profile/", views.my_health_profile_view, name="my-health-profile"),
    path("recommend-package/", views.health_assessment_view, name="recommend-package"),
]
