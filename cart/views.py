from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem
from .serializers import CartItemSerializer

class CartView(generics.ListAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]


    def get_queryset(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart.items.all()

class CartItemCreateView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        #here cart is being created
        cart, created = Cart.objects.get_or_create(user=self.request.user)

        #saving the validated data into variables
        product = serializer.validated_data["product"]
        requested_quantity = serializer.validated_data["quantity"]

        #checking if the product is already in the cart
        cart_item = cart.items.filter(cart = cart,product=product).first()

        if cart_item is None:
            if requested_quantity > product.stock:
                raise ValidationError("Product is out of stock")

            CartItem.objects.create(cart=cart, product=product, quantity=requested_quantity)
            return

        new_quantity = cart_item.quantity + requested_quantity

        if new_quantity > product.stock:
            raise ValidationError("Product is out of stock")

        cart_item.quantity = new_quantity
        cart_item.save()

class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        cart, created = Cart.objects.get_or_create(
            user=self.request.user
        )
        return cart.items.all()

    def perform_update(self, serializer):
        new_quantity = serializer.validated_data.get("quantity")

        #serializer automatically creates the instance of cartitem
        if new_quantity is not None:
            if new_quantity > serializer.instance.product.stock:
                raise ValidationError(
                    f"Out of stock !!"
                    f"Available stock: {serializer.instance.product.stock}."
                )
        serializer.save()

     
            



        
        
