from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from products.models import Product, Category
from cart.models import Cart, CartItem

class CartAPITests(APITestCase):
    def setUp(self):
        self.user1 = CustomUser.objects.create_user(
            email="user1_cart@example.com",
            password="Password123!",
            role=CustomUser.Role.CUSTOMER
        )
        self.user2 = CustomUser.objects.create_user(
            email="user2_cart@example.com",
            password="Password123!",
            role=CustomUser.Role.CUSTOMER
        )
        self.seller = CustomUser.objects.create_user(
            email="seller_cart@example.com",
            password="Password123!",
            role=CustomUser.Role.SELLER
        )

        self.category = Category.objects.create(name="Gadgets")
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Smart Watch",
            price=2499.00,
            stock=10,
            description="Fitness tracker smartwatch"
        )

        self.cart_url = "/api/cart/"
        self.cart_items_url = "/api/cart/items/"

    def test_add_valid_product_to_cart_success(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            "product": self.product.id,
            "quantity": 2
        }
        response = self.client.post(self.cart_items_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify item appears in user1's cart
        list_response = self.client.get(self.cart_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["quantity"], 2)

    def test_add_quantity_exceeding_stock_rejected(self):
        self.client.force_authenticate(user=self.user1)
        data = {
            "product": self.product.id,
            "quantity": 999  # Stock is only 10
        }
        response = self.client.post(self.cart_items_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_zero_or_negative_quantity_rejected(self):
        self.client.force_authenticate(user=self.user1)
        # Quantity = 0
        response_zero = self.client.post(self.cart_items_url, {
            "product": self.product.id,
            "quantity": 0
        }, format="json")
        self.assertEqual(response_zero.status_code, status.HTTP_400_BAD_REQUEST)

        # Quantity = -5
        response_neg = self.client.post(self.cart_items_url, {
            "product": self.product.id,
            "quantity": -5
        }, format="json")
        self.assertEqual(response_neg.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_cart_item_quantity_success(self):
        self.client.force_authenticate(user=self.user1)
        cart = Cart.objects.create(user=self.user1)
        cart_item = CartItem.objects.create(cart=cart, product=self.product, quantity=2)

        update_url = f"{self.cart_items_url}{cart_item.id}/"
        response = self.client.patch(update_url, {"quantity": 5}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 5)

    def test_update_cart_item_exceeding_stock_rejected(self):
        self.client.force_authenticate(user=self.user1)
        cart = Cart.objects.create(user=self.user1)
        cart_item = CartItem.objects.create(cart=cart, product=self.product, quantity=2)

        update_url = f"{self.cart_items_url}{cart_item.id}/"
        response = self.client.patch(update_url, {"quantity": 25}, format="json")  # Stock is 10
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_cart_item_success(self):
        self.client.force_authenticate(user=self.user1)
        cart = Cart.objects.create(user=self.user1)
        cart_item = CartItem.objects.create(cart=cart, product=self.product, quantity=2)

        delete_url = f"{self.cart_items_url}{cart_item.id}/"
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CartItem.objects.filter(id=cart_item.id).exists())

    def test_user_cannot_access_or_modify_another_users_cart(self):
        # Create item in user1's cart
        cart1 = Cart.objects.create(user=self.user1)
        item1 = CartItem.objects.create(cart=cart1, product=self.product, quantity=2)

        # Authenticate as user2
        self.client.force_authenticate(user=self.user2)

        # User2 listing cart should not show user1's items
        list_resp = self.client.get(self.cart_url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data), 0)

        # User2 cannot retrieve, update or delete user1's cart item
        detail_url = f"{self.cart_items_url}{item1.id}/"
        get_resp = self.client.get(detail_url)
        self.assertEqual(get_resp.status_code, status.HTTP_404_NOT_FOUND)

        patch_resp = self.client.patch(detail_url, {"quantity": 8}, format="json")
        self.assertEqual(patch_resp.status_code, status.HTTP_404_NOT_FOUND)

        del_resp = self.client.delete(detail_url)
        self.assertEqual(del_resp.status_code, status.HTTP_404_NOT_FOUND)
