"""
Accommodations App Test Suite (Stage S2 Price & Integrity Verification).
Run with: .venv/bin/python manage.py test apps.accommodations
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accommodations.models import Accommodation, AccommodationStatus, Room
from apps.accommodations.serializers import RoomPricingSerializer, RoomSerializer

User = get_user_model()


class AccommodationsStageS2Tests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="Password123!",
            role="HOMESTAY_OWNER",
        )
        self.accommodation = Accommodation.objects.create(
            owner=self.owner,
            name="Green Valley Homestay",
            province="Chiang Mai",
            status=AccommodationStatus.ACTIVE,
        )

    def test_room_base_price_must_be_positive(self):
        room = Room(
            accommodation=self.accommodation,
            name="Deluxe Room",
            base_price_per_night=Decimal("0.00"),
            total_inventory=1,
        )
        with self.assertRaises(DjangoValidationError):
            room.full_clean()

    def test_room_max_capacity_cannot_be_lower_than_base_capacity(self):
        serializer = RoomSerializer(
            data={
                "name": "Family Room",
                "base_capacity": 4,
                "max_capacity": 2,
                "base_price_per_night": "1500.00",
                "total_inventory": 2,
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("max_capacity", serializer.errors)

    def test_room_pricing_serializer_rejects_negative_override(self):
        serializer = RoomPricingSerializer(
            data={
                "date": date.today().isoformat(),
                "price_override": "-100.00",
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("price_override", serializer.errors)

    def test_accommodations_list_rejects_over_30_nights(self):
        checkin = date.today()
        checkout = checkin + timedelta(days=35)
        url = f"/api/v1/accommodations/?checkin={checkin.isoformat()}&checkout={checkout.isoformat()}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
