"""
Bookings App Test Suite (Stage S3 Idempotent Checkout & Inventory Integrity).
Run with: .venv/bin/python manage.py test apps.bookings
"""
from decimal import Decimal
import uuid

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.otop.models import OTOPCategory, OTOPProduct

User = get_user_model()


class BookingsStageS3Tests(APITestCase):
    def setUp(self):
        self.tourist = User.objects.create_user(
            email="tourist@example.com",
            password="Password123!",
            role="TOURIST",
        )
        self.vendor = User.objects.create_user(
            email="otop_vendor@example.com",
            password="Password123!",
            role="OTOP_OWNER",
        )
        self.product = OTOPProduct.objects.create(
            owner=self.vendor,
            name="Herbal Balm",
            category=OTOPCategory.HERBAL_PRODUCT,
            price=Decimal("150.00"),
            stock_quantity=10,
            is_active=True,
        )
        self.checkout_url = reverse("bookings:checkout")

    def test_checkout_success(self):
        self.client.force_authenticate(user=self.tourist)
        payload = [
            {
                "item_type": "OTOP_GOODS",
                "entity_id": str(self.product.id),
                "quantity": 2,
            }
        ]
        response = self.client.post(self.checkout_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("booking_id", response.data["data"])
        self.assertIn("payment_id", response.data["data"])

    def test_checkout_idempotency_replay(self):
        self.client.force_authenticate(user=self.tourist)
        idempotency_key = f"key-{uuid.uuid4()}"
        payload = [
            {
                "item_type": "OTOP_GOODS",
                "entity_id": str(self.product.id),
                "quantity": 1,
            }
        ]

        # First request -> 201 Created
        res1 = self.client.post(
            self.checkout_url,
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key,
        )
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        booking_id_1 = res1.data["data"]["booking_id"]

        # Replay request with same key -> 200 OK (Idempotent replay, same booking_id)
        res2 = self.client.post(
            self.checkout_url,
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key,
        )
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        booking_id_2 = res2.data["data"]["booking_id"]
        self.assertEqual(booking_id_1, booking_id_2)
