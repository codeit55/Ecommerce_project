from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Order, OrderItem
from .serializers import OrderItemSerializer, OrderSerializer
from cart.models import Cart

from .serializers import SellerOrderItemSerializer, SellerOrderItemUpdateSerializer
from users.permissions import OrderItemIsAdminOrSeller

from django.db import transaction

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user = self.request.user).order_by('-created_at')

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user = self.request.user)

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        with transaction.atomic():
            # Retrieve or create user's cart
            cart, created = Cart.objects.get_or_create(user=self.request.user)
            cart_items = list(cart.items.select_related("product").all())

            if not cart_items:
                return Response({"detail": "Your cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

            # Sort product IDs to prevent database deadlocks on concurrent purchases
            product_ids = sorted([item.product_id for item in cart_items])

            # Lock product rows using PostgreSQL row-level locking
            from products.models import Product
            locked_products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # Validate stock against authoritative database state
            total_amount = 0
            for item in cart_items:
                product = locked_products.get(item.product_id)
                if not product:
                    return Response(
                        {"detail": "One or more products in your cart no longer exist."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if item.quantity <= 0:
                    return Response(
                        {"detail": f"Invalid quantity for {product.name}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if item.quantity > product.stock:
                    return Response(
                        {"detail": f"Product {product.name} is out of stock"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                total_amount += product.price * item.quantity

            # Create Order
            order = Order.objects.create(user=self.request.user, total_amount=total_amount)

            # Create OrderItems and deduct stock once per cart item
            for item in cart_items:
                product = locked_products[item.product_id]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantiy=item.quantity,
                    price_purchased_at=product.price
                )
                product.stock -= item.quantity
                product.save(update_fields=["stock"])

            # Clear cart items upon successful order placement
            cart.items.all().delete()

        return Response(
            {
                "detail": "Order placed successfully.",
                "order_id": order.id
            },
            status=status.HTTP_201_CREATED
        )

class SellerOrderItemListView(generics.ListAPIView):
    serializer_class = SellerOrderItemSerializer
    permission_class = [OrderItemIsAdminOrSeller]

    def get_queryset(self):
        return OrderItem.objects.filter(product__seller = self.request.user).order_by("-order__created_at")

class SellerOrderItemUpdateView(generics.UpdateAPIView):
    serializer_class = SellerOrderItemUpdateSerializer
    permission_classes = [
        IsAuthenticated,
        OrderItemIsAdminOrSeller
    ]

    def get_queryset(self):
        
        return OrderItem.objects.filter(product__seller=self.request.user)