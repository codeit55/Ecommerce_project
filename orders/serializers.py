from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'quantiy',
            'price_purchased_at'
        ]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'total_amount',
            'items',
            'created_at',
            'updated_at',
        ]

class SellerOrderItemSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source = "order.id", read_only = True)
    produc_name = serializers.CharField(source = "product.name", read_only = True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order_id',
            'produc_name',
            'product',
            'quantiy',
            'price_purchased_at'
        ]

class SellerOrderItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["status"]