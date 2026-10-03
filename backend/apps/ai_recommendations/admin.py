"""Django admin configuration for AI Recommendations app."""
from django.contrib import admin
from .models import AIRecommendationLog, HealthProfile


@admin.register(HealthProfile)
class HealthProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "bmi", "bmr", "health_goal", "updated_at")
    list_filter = ("health_goal", "gender")
    search_fields = ("user__email", "health_goal")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(AIRecommendationLog)
class AIRecommendationLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    search_fields = ("user__email", "health_analysis")
    readonly_fields = ("id", "created_at")
