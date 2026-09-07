from django.contrib import admin

# Register your models here.
from .models import Product, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "stock", "category", "seller", "created_at")
    list_filter = ("category","seller")
    search_fields = ("name", "description")
