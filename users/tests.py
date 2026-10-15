from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser

class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.refresh_url = "/api/auth/token/refresh/"
        self.user_email = "testuser@example.com"
        self.user_password = "SecurePassword123!"

        # Create an existing user for login tests
        self.user = CustomUser.objects.create_user(
            email=self.user_email,
            password=self.user_password,
            role=CustomUser.Role.CUSTOMER
        )

    def test_register_customer_success(self):
        data = {
            "email": "newcustomer@example.com",
            "password": "Password1234!"
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "newcustomer@example.com")
        self.assertTrue(CustomUser.objects.filter(email="newcustomer@example.com").exists())

    def test_register_duplicate_email_fails(self):
        data = {
            "email": self.user_email,
            "password": "AnyPassword123"
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_valid_credentials_returns_jwt_tokens(self):
        data = {
            "email": self.user_email,
            "password": self.user_password
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_password_rejected(self):
        data = {
            "email": self.user_email,
            "password": "WrongPassword!"
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_email_rejected(self):
        data = {
            "email": "ghost@example.com",
            "password": "Password123"
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_success(self):
        login_resp = self.client.post(self.login_url, {
            "email": self.user_email,
            "password": self.user_password
        }, format="json")
        refresh_token = login_resp.data["refresh"]

        refresh_resp = self.client.post(self.refresh_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)

    def test_access_protected_endpoint_without_auth_fails(self):
        # /api/cart/ requires authentication
        response = self.client.get("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
