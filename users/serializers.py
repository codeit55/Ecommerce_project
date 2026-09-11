from rest_framework import serializers
from .models import CustomUser,SellerProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ["email", "password"]

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email = validated_data["email"],    
            password = validated_data["password"],
            role = CustomUser.Role.CUSTOMER,
        )
        return user

class SellerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()

    class Meta:
        model = SellerProfile
        fields = ["email", "password", "store_name", "store_description", "phone", "address"]

    def create(self,validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        user = CustomUser.objects.create_user(email=email, password=password, role=CustomUser.Role.SELLER)
        seller_profile = SellerProfile.objects.create(user=user, **validated_data)
        return seller_profile
    