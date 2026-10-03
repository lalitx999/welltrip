"""
Payments App Test Suite (Stage S4 Payee Settings & Slip Check Verification).
Run with: .venv/bin/python manage.py test apps.payments
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking, BookingStatus
from apps.payments.models import (
    Payment,
    PaymentChannel,
    PaymentSlip,
    PaymentStatus,
    SlipVerificationStatus,
)
from apps.payments.services import create_bank_transfer_payment, verify_slip

User = get_user_model()


class PaymentsStageS4Tests(APITestCase):
    def setUp(self):
        self.tourist = User.objects.create_user(
            email="tourist@example.com",
            password="Password123!",
            role="TOURIST",
        )
        self.booking = Booking.objects.create(
            user=self.tourist,
            status=BookingStatus.AWAITING_PAYMENT,
            total_subtotal=Decimal("500.00"),
            platform_fee=Decimal("0.00"),
            net_amount=Decimal("500.00"),
        )

    @override_settings(
        PAYEE_ACCOUNT_NUMBER="123-4-56789-0",
        PAYEE_ACCOUNT_NAME="WellTrip Co., Ltd.",
        PAYEE_BANK_NAME="Kasikornbank",
    )
    def test_create_bank_transfer_payment_uses_settings_defaults(self):
        payment = create_bank_transfer_payment(self.booking, amount=Decimal("500.00"))
        self.assertEqual(payment.payee_account_number, "123-4-56789-0")
        self.assertEqual(payment.payee_account_name, "WellTrip Co., Ltd.")
        self.assertEqual(payment.payee_bank, "Kasikornbank")
        self.assertEqual(payment.status, PaymentStatus.PENDING)

    def test_verify_slip_successful_verification(self):
        payment = create_bank_transfer_payment(self.booking, amount=Decimal("500.00"))
        dummy_file = SimpleUploadedFile(
            "slip.jpg", b"fake image content", content_type="image/jpeg"
        )
        slip = PaymentSlip.objects.create(
            payment=payment,
            uploader=self.tourist,
            image=dummy_file,
            original_filename="slip.jpg",
            status=SlipVerificationStatus.PENDING_CHECK,
        )

        fake_provider_payload = {
            "amount": Decimal("500.00"),
            "trans_ref": "REF123456",
            "trans_datetime": None,
        }

        verified_slip = verify_slip(
            slip.id, provider=lambda img: fake_provider_payload
        )
        self.assertEqual(verified_slip.status, SlipVerificationStatus.VERIFIED)
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.SUCCESS)
        self.assertEqual(self.booking.status, BookingStatus.CONFIRMED)

    def test_verify_slip_amount_mismatch_rejects_slip(self):
        payment = create_bank_transfer_payment(self.booking, amount=Decimal("500.00"))
        dummy_file = SimpleUploadedFile(
            "slip.jpg", b"fake image content", content_type="image/jpeg"
        )
        slip = PaymentSlip.objects.create(
            payment=payment,
            uploader=self.tourist,
            image=dummy_file,
            original_filename="slip.jpg",
            status=SlipVerificationStatus.PENDING_CHECK,
        )

        fake_provider_payload = {
            "amount": Decimal("100.00"),  # Mismatch (expected 500)
            "trans_ref": "REF123456",
        }

        rejected_slip = verify_slip(slip.id, provider=lambda img: fake_provider_payload)
        self.assertEqual(rejected_slip.status, SlipVerificationStatus.REJECTED)
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.PENDING)
        self.assertEqual(self.booking.status, BookingStatus.AWAITING_PAYMENT)

    def test_payment_detail_api_returns_expires_at(self):
        payment = create_bank_transfer_payment(self.booking, amount=Decimal("500.00"))
        self.client.force_authenticate(user=self.tourist)
        url = reverse("payments:payment-detail", kwargs={"payment_id": str(payment.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("expires_at", response.data["data"])
        self.assertIsNotNone(response.data["data"]["expires_at"])
