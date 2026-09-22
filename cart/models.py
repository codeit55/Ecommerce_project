from django.db import models

# Create your models here.
# cart cart no, cart item 
# cart item - product , quantity price
from products.models import Product
from django.config import settings

class Cart(models.Model):
    user = models.OnetoOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.user.email}'s cart"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        constraints =   [
            models.UniqueConstraint(fields=['cart', 'product'], name='unique_cart_item')
        ]

    def __str__(self):
        return f"{self.product.name} X {self.quantity}"
    


