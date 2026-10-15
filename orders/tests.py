import threading
from django.db import connection, transaction
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from products.models import Product, Category
from cart.models import Cart, CartItem
from orders.models import Order, OrderItem

class OrderAndTransactionAPITests(APITestCase):
    def setUp(self):
        self.seller = CustomUser.objects.create_user(
            email="seller_orders@example.com",
            password="Password123!",
            role=CustomUser.Role.SELLER
        )
        self.customer = CustomUser.objects.create_user(
            email="customer_orders@example.com",
            password="Password123!",
            role=CustomUser.Role.CUSTOMER
        )
        self.category = Category.objects.create(name="Tech")
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Mechanical Keyboard",
            price=3000.00,
            stock=10,
            description="RGB mechanical keyboard"
        )
        self.product_scarce = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Limited Edition Keycap",
            price=500.00,
            stock=1,
            description="Rare artisan keycap"
        )

        self.checkout_url = "/api/orders/checkout/"
        self.orders_url = "/api/orders/"

    def test_checkout_empty_cart_fails(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(self.checkout_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("empty", response.data["detail"].lower())

    def test_checkout_successful_order_and_inventory_decrement(self):
        self.client.force_authenticate(user=self.customer)
        cart = Cart.objects.create(user=self.customer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=3)

        initial_stock = self.product.stock
        response = self.client.post(self.checkout_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("order_id", response.data)

        # Verify stock was decremented correctly
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock - 3)

        # Verify cart was cleared
        self.assertEqual(cart.items.count(), 0)

        # Verify order was saved with correct items and total
        order = Order.objects.get(id=response.data["order_id"])
        self.assertEqual(order.user, self.customer)
        self.assertEqual(order.total_amount, 9000.00)
        self.assertEqual(order.items.count(), 1)
        order_item = order.items.first()
        self.assertEqual(order_item.product, self.product)
        self.assertEqual(order_item.quantiy, 3)

    def test_checkout_insufficient_stock_fails(self):
        self.client.force_authenticate(user=self.customer)
        cart = Cart.objects.create(user=self.customer)
        # Add item to cart with quantity 5
        cart_item = CartItem.objects.create(cart=cart, product=self.product_scarce, quantity=1)

        # Simulate another transaction buying the scarce product before checkout
        self.product_scarce.stock = 0
        self.product_scarce.save(update_fields=["stock"])

        response = self.client.post(self.checkout_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("out of stock", response.data["detail"].lower())

        # No order created
        self.assertEqual(Order.objects.filter(user=self.customer).count(), 0)

    def test_checkout_transaction_rollback_on_partial_failure(self):
        """
        Multi-item purchase: Item 1 has sufficient stock, Item 2 has insufficient stock.
        Entire transaction MUST rollback: Item 1 stock must NOT decrement, and no Order created.
        """
        self.client.force_authenticate(user=self.customer)
        cart = Cart.objects.create(user=self.customer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)  # Available: 10
        CartItem.objects.create(cart=cart, product=self.product_scarce, quantity=5)  # Available: 1 -> Fails!

        product1_stock_before = self.product.stock
        product2_stock_before = self.product_scarce.stock

        response = self.client.post(self.checkout_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify both stocks are unchanged (atomic rollback)
        self.product.refresh_from_db()
        self.product_scarce.refresh_from_db()
        self.assertEqual(self.product.stock, product1_stock_before)
        self.assertEqual(self.product_scarce.stock, product2_stock_before)

        # Verify no order exists
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

    def test_customer_order_listing_success(self):
        self.client.force_authenticate(user=self.customer)
        # Create an order
        order = Order.objects.create(user=self.customer, total_amount=1500.00)
        OrderItem.objects.create(order=order, product=self.product, quantiy=1, price_purchased_at=1500.00)

        response = self.client.get(self.orders_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], order.id)

    def test_seller_order_items_listing(self):
        # Create an order with customer
        order = Order.objects.create(user=self.customer, total_amount=3000.00)
        order_item = OrderItem.objects.create(order=order, product=self.product, quantiy=1, price_purchased_at=3000.00)

        # Seller view
        self.client.force_authenticate(user=self.seller)
        response = self.client.get("/api/orders/seller/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], order_item.id)


class ConcurrencyAndLockingTests(TransactionTestCase):
    """
    Uses TransactionTestCase so that real database transactions and multi-threaded
    connections are tested against the PostgreSQL test database.
    """
    def setUp(self):
        self.seller = CustomUser.objects.create_user(
            email="seller_concurrency@example.com",
            password="Password123!",
            role=CustomUser.Role.SELLER
        )
        self.category = Category.objects.create(name="Flash Sale")
        # Exactly 1 item available in stock!
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Exclusive GPU",
            price=50000.00,
            stock=1,
            description="High-demand item with only 1 in stock"
        )

        self.userA = CustomUser.objects.create_user(
            email="buyer_a@example.com",
            password="Password123!",
            role=CustomUser.Role.CUSTOMER
        )
        self.userB = CustomUser.objects.create_user(
            email="buyer_b@example.com",
            password="Password123!",
            role=CustomUser.Role.CUSTOMER
        )

        # Both users put the last available GPU in their carts
        cartA = Cart.objects.create(user=self.userA)
        CartItem.objects.create(cart=cartA, product=self.product, quantity=1)

        cartB = Cart.objects.create(user=self.userB)
        CartItem.objects.create(cart=cartB, product=self.product, quantity=1)

    def test_concurrent_checkout_prevents_overselling(self):
        """
        Two users simultaneously attempt to purchase the single available item.
        With select_for_update() row-level locking:
        - Exactly ONE purchase succeeds (HTTP 201).
        - Exactly ONE purchase fails (HTTP 400 Out of Stock).
        - Final stock must be exactly 0, never negative.
        - Total orders created must be exactly 1.
        """
        from rest_framework.test import APIClient

        results = []

        def attempt_checkout(user):
            client = APIClient()
            client.force_authenticate(user=user)
            resp = client.post("/api/orders/checkout/")
            results.append(resp.status_code)
            connection.close()

        thread1 = threading.Thread(target=attempt_checkout, args=(self.userA,))
        thread2 = threading.Thread(target=attempt_checkout, args=(self.userB,))

        thread1.start()
        thread2.start()

        thread1.join()
        thread2.join()

        # Check results
        self.assertIn(status.HTTP_201_CREATED, results)
        self.assertIn(status.HTTP_400_BAD_REQUEST, results)

        # Final stock must be 0 (no overselling)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 0)

        # Exactly 1 Order and 1 OrderItem created
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
