from rest_framework import serializers
from .models import Cylinders, DriverPositions, Orders, Products, Users


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        # password_hash NUNCA se expone en la API
        fields = ['id', 'name', 'rut', 'email', 'phone', 'role', 'created_at']


class CylinderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cylinders
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    client_detail = UserSerializer(source='client', read_only=True)
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = Orders
        fields = '__all__'


class DriverPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverPositions
        fields = '__all__'


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Users
        fields = ['id', 'name', 'rut', 'email', 'phone', 'role', 'password']
        read_only_fields = ['id']