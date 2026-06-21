import re
from django.contrib.auth.hashers import make_password, check_password
from django.db import IntegrityError
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Cylinders, DriverPositions, Orders, Products, Users
from .serializers import (
    CylinderSerializer, DriverPositionSerializer, OrderSerializer,
    ProductSerializer, UserSerializer, RegisterSerializer,
)


def clean_rut(value: str) -> str:
    """Quita puntos y guion, pasa a minúscula. '12.345.678-9' -> '123456789'"""
    return re.sub(r'[.\-]', '', value or '').lower()


def tokens_for_user(user):
    """Genera access + refresh token con claims custom (user_id, role)."""
    refresh = RefreshToken()
    refresh['user_id'] = str(user.id)
    refresh['role'] = user.role
    refresh['name'] = user.name
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if Users.objects.filter(email__iexact=data['email']).exists():
            return Response({'detail': 'Ese correo ya está registrado'}, status=400)

        target_rut = clean_rut(data['rut'])
        for u in Users.objects.all():
            if clean_rut(u.rut) == target_rut:
                return Response({'detail': 'Ese RUT ya está registrado'}, status=400)

        try:
            user = Users.objects.create(
                name=data['name'],
                rut=data['rut'],
                email=data['email'],
                phone=data['phone'],
                role=data['role'],
                password_hash=make_password(data['password']),
            )
        except IntegrityError:
            return Response({'detail': 'El RUT o correo ya están registrados'}, status=400)

        return Response({
            'user': UserSerializer(user).data,
            **tokens_for_user(user),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        rut = request.data.get('rut')
        password = request.data.get('password')

        if not rut or not password:
            return Response({'detail': 'RUT y contraseña son requeridos'}, status=400)

        target = clean_rut(rut)
        user = next((u for u in Users.objects.all() if clean_rut(u.rut) == target), None)

        if not user or not check_password(password, user.password_hash):
            return Response({'detail': 'RUT o contraseña incorrectos'}, status=401)

        return Response({
            'user': UserSerializer(user).data,
            **tokens_for_user(user),
        })


# ─── CRUD estándar para cada tabla ─────────────────────────────
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Orders.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


class CylinderViewSet(viewsets.ModelViewSet):
    queryset = Cylinders.objects.all()
    serializer_class = CylinderSerializer
    permission_classes = [IsAuthenticated]


class DriverPositionViewSet(viewsets.ModelViewSet):
    queryset = DriverPositions.objects.all()
    serializer_class = DriverPositionSerializer
    permission_classes = [IsAuthenticated]


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]