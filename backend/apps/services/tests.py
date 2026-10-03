"""
Services App Test Suite (Stage S2 Wellness Slot Overlap & Conflict 409 Verification).
Run with: .venv/bin/python manage.py test apps.services
"""
from datetime import date, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.services.models import WellnessService, WellnessTimeSlot

User = get_user_model()


class ServicesStageS2Tests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="wellness_owner@example.com",
            password="Password123!",
            role="WELLNESS_OWNER",
        )
        self.service = WellnessService.objects.create(
            owner=self.owner,
            title="Thai Herbal Massage",
            price=Decimal("800.00"),
            duration_minutes=60,
            max_capacity_per_session=2,
            is_active=True,
        )
        self.slot_url = reverse("services:wellness-slots", kwargs={"service_id": str(self.service.id)})

    def test_create_overlapping_slot_returns_409_conflict(self):
        self.client.force_authenticate(user=self.owner)
        target_date = date.today().isoformat()

        # Slot 1: 10:00 - 11:00
        res1 = self.client.post(
            self.slot_url,
            {
                "date": target_date,
                "start_time": "10:00:00",
                "end_time": "11:00:00",
                "capacity": 2,
            },
            format="json",
        )
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Slot 2 (Overlapping): 10:30 - 11:30 -> Should be HTTP 409 Conflict
        res2 = self.client.post(
            self.slot_url,
            {
                "date": target_date,
                "start_time": "10:30:00",
                "end_time": "11:30:00",
                "capacity": 2,
            },
            format="json",
        )
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(res2.data["success"])
