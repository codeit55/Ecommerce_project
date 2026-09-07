from django.contrib import admin

# Register your models here.
from .models import CustomUser, SellerProfile

admin.site.register(CustomUser)
admin.site.register(SellerProfile)