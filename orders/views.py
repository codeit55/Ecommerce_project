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
    permission_class = [IsAuthenticated]

    def post(self, request):

        # checking if cart is existing or not. if not then error of cart is empty else we are retriving the details of priduct from cart 
        cart, created = Cart.objects.get_or_create(user = self.request.user)
        cart_items = cart.items.all()

        if not cart_items.exists():
            return Response({"detail" : "Your cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        # checking if the product is out of stock
        for cart_item in cart_items:
            if cart_item.quantity > cart_item.product.stock:
                return Response(
                    {"detail" : f"Product {cart_item.product.name} is out of stock"}, status = status.HTTP_400_BAD_REQUEST
                )
        # calculating the total price of the order
        total_amount = 0
        for cart_item in cart_items :
            total_amount = total_amount + cart_item.product.price * cart_item.quantity

        with transaction.atomic():
            order = Order.objects.create(user = self.request.user, total_amount = total_amount)
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order = order,
                    product = cart_item.product,
                    quantity = cart_item.quantity,
                    price_purchased_at = cart_item.product.price
                )

                for cart_item in cart_items:
                    cart_item.product.stock -= cart_item.quantity
                    cart_item.product.save()
                cart_items.delete()
        return Response(
    {
        "detail": "Order placed successfully.",
        "order_id": order.id
    },
    status=status.HTTP_201_CREATED
)

    