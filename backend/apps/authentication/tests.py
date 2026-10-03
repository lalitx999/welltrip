"""
Authentication App Test Suite (Stage S0 Baseline & S1 Verification).
Run with: .venv/bin/python manage.py test apps.authentication
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("authentication:register")
        self.login_url = reverse("authentication:login")
        self.google_url = reverse("authentication:google-oauth")
        self.refresh_url = reverse("authentication:refresh")

        self.user_data = {
            "email": "testuser@example.com",
            "password": "Password123!",
            "first_name": "Test",
            "last_name": "User",
            "phone_number": "0812345678",
        }

    def test_register_success(self):
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("user", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["email"], "testuser@example.com")

    def test_register_duplicate_email(self):
        self.client.post(self.register_url, self.user_data, format="json")
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_login_success(self):
        User.objects.create_user(
            email="login@example.com",
            password="Password123!",
            first_name="Login",
            last_name="Test",
        )
        response = self.client.post(
            self.login_url,
            {"email": "login@example.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("access_token", response.data["data"])
        self.assertIn("refresh_token", response.data["data"])
        self.assertIn("user", response.data["data"])

    def test_login_disabled_account_rejected(self):
        user = User.objects.create_user(
            email="disabled@example.com",
            password="Password123!",
            is_active=False,
        )
        response = self.client.post(
            self.login_url,
            {"email": "disabled@example.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])

    @patch("apps.authentication.services._verify_id_token")
    def test_google_oauth_disabled_account_rejected(self, mock_verify):
        mock_verify.return_value = {
            "email": "disabled_google@example.com",
            "email_verified": True,
            "sub": "google-sub-12345",
            "given_name": "Disabled",
            "family_name": "User",
        }
        User.objects.create_user(
            email="disabled_google@example.com",
            password=None,
            google_sub_id="google-sub-12345",
            is_active=False,
        )
        response = self.client.post(
            self.google_url,
            {"id_token": "valid-mock-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])

    def test_refresh_token_envelope(self):
        user = User.objects.create_user(
            email="refresh@example.com",
            password="Password123!",
        )
        login_res = self.client.post(
            self.login_url,
            {"email": "refresh@example.com", "password": "Password123!"},
            format="json",
        )
        refresh_token = login_res.data["data"]["refresh_token"]

        refresh_res = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertTrue(refresh_res.data["success"])
        self.assertIn("access_token", refresh_res.data["data"])
        self.assertIn("refresh_token", refresh_res.data["data"])
