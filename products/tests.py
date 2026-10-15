from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from products.models import Product, Category

class ProductAPITests(APITestCase):
    def setUp(self):
        self.seller = CustomUser.objects.create_user(
            email="seller_test@example.com",
            password="SellerPassword123!",
            role=CustomUser.Role.SELLER
        )
        self.customer = CustomUser.objects.create_user(
            email="customer_test@example.com",
            password="CustomerPassword123!",
            role=CustomUser.Role.CUSTOMER
        )

        self.category_electronics = Category.objects.create(name="Electronics", description="Gadgets")
        self.category_fashion = Category.objects.create(name="Fashion", description="Apparel")

        self.product1 = Product.objects.create(
            seller=self.seller,
            category=self.category_electronics,
            name="Wireless Mouse",
            price=599.00,
            stock=15,
            description="Ergonomic optical mouse"
        )
        self.product2 = Product.objects.create(
            seller=self.seller,
            category=self.category_fashion,
            name="Cotton T-Shirt",
            price=299.00,
            stock=50,
            description="Pure cotton casual t-shirt"
        )

        self.products_url = "/api/products/"

    def test_public_product_listing_success(self):
        response = self.client.get(self.products_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return at least the 2 test products
        self.assertGreaterEqual(len(response.data), 2)

    def test_product_search_filter(self):
        response = self.client.get(f"{self.products_url}?search=Mouse")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in response.data]
        self.assertIn("Wireless Mouse", names)
        self.assertNotIn("Cotton T-Shirt", names)

    def test_product_category_filter(self):
        response = self.client.get(f"{self.products_url}?category={self.category_fashion.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in response.data]
        self.assertIn("Cotton T-Shirt", names)
        self.assertNotIn("Wireless Mouse", names)

    def test_product_detail_retrieval_success(self):
        detail_url = f"{self.products_url}{self.product1.id}/"
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Wireless Mouse")
        self.assertEqual(float(response.data["price"]), 599.00)

    def test_product_detail_nonexistent_id_returns_404(self):
        detail_url = f"{self.products_url}999999/"
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_cannot_create_product(self):
        data = {
            "name": "Unauthorized Tablet",
            "price": 12000.00,
            "stock": 5,
            "category": self.category_electronics.id
        }
        response = self.client.post(self.products_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)
        data = {
            "name": "Customer Created Item",
            "price": 100.00,
            "stock": 10,
            "category": self.category_fashion.id
        }
        response = self.client.post(self.products_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_can_create_product(self):
        self.client.force_authenticate(user=self.seller)
        data = {
            "seller": self.seller.id,
            "category": self.category_electronics.id,
            "name": "Mechanical Keyboard Pro",
            "price": 3499.00,
            "stock": 20,
            "description": "Tactile switch mechanical keyboard"
        }
        response = self.client.post(self.products_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Mechanical Keyboard Pro")
        self.assertTrue(Product.objects.filter(name="Mechanical Keyboard Pro").exists())
