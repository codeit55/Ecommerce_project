from django.db import models
from django.conf import settings

# Create your models here.
class Order(models.Model):

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id}"

class OrderItem(models.Model):
    class Status(models.TextChoices):
        PENDING = ("PENDING", "Pending")
        CONFIRMED = ("CONFIRMED", "Confirmed")
        SHIPPED = ("SHIPPED", "Shipped")
        DELIVERED = ("DELIVERED", "Delivered")
        CANCELLED = ("CANCELLED", "Cancelled")

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='order_items')
    quantiy = models.PositiveIntegerField()
    price_purchased_at = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} X {self.quantiy}"

    

