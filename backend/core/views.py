from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import get_object_or_404
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
    """
    Registro público (auto-registro desde la app). SIEMPRE crea usuarios
    con role='client': las cuentas de chofer/admin las crea el administrador
    desde su propio panel (ver AdminClientsPage / AdminSettingsPage), nunca
    a través de este endpoint público.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        data['role'] = 'client'

        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        if Users.objects.filter(email__iexact=validated['email']).exists():
            return Response({'detail': 'Ese email ya está registrado'}, status=400)
        if Users.objects.filter(rut__iexact=validated['rut']).exists():
            return Response({'detail': 'Ese RUT ya está registrado'}, status=400)

        user = Users.objects.create(
            name=validated['name'],
            rut=validated['rut'],
            email=validated['email'],
            phone=validated['phone'],
            role='client',
            password_hash=make_password(validated['password']),
        )
        return Response({
            'user': UserSerializer(user).data,
            **tokens_for_user(user),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Login acepta indistintamente 'rut' o 'email' en el body (el frontend
    usa RUT como identificador principal, pero el modelo Users permite
    ambos como credencial de acceso).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('rut') or request.data.get('email')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'detail': 'Debes enviar rut o email, y password'}, status=400)

        try:
            user = Users.objects.get(email__iexact=identifier)
        except Users.DoesNotExist:
            try:
                user = Users.objects.get(rut__iexact=identifier)
            except Users.DoesNotExist:
                return Response({'detail': 'Credenciales inválidas'}, status=401)

        if not check_password(password, user.password_hash):
            return Response({'detail': 'Credenciales inválidas'}, status=401)

        return Response({
            'user': UserSerializer(user).data,
            **tokens_for_user(user),
        })


class AdminCreateUserView(APIView):
    """
    Crea usuarios con cualquier rol (driver/admin/client). Solo accesible
    para usuarios autenticados con role='admin' (ver AdminClientsPage y
    AdminSettingsPage en el frontend, que son las únicas que llaman esto).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if getattr(request.user, 'role', None) != 'admin':
            return Response({'detail': 'Solo un administrador puede crear usuarios.'}, status=403)

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if Users.objects.filter(email__iexact=data['email']).exists():
            return Response({'detail': 'Ese email ya está registrado'}, status=400)
        if Users.objects.filter(rut__iexact=data['rut']).exists():
            return Response({'detail': 'Ese RUT ya está registrado'}, status=400)

        user = Users.objects.create(
            name=data['name'],
            rut=data['rut'],
            email=data['email'],
            phone=data['phone'],
            role=data['role'],
            password_hash=make_password(data['password']),
        )
        return Response({'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class DriverPositionSetView(APIView):
    """
    Upsert simple de la posición de un chofer: POST {lat, lng} a
    /api/driver-positions/<driver_id>/set/. Evita que el frontend tenga
    que manejar a mano si ya existe el registro (create vs update) como
    pasaría usando el ModelViewSet genérico.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, driver_id):
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        if lat is None or lng is None:
            return Response({'detail': 'Debes enviar lat y lng'}, status=400)

        driver = get_object_or_404(Users, id=driver_id)
        position, _created = DriverPositions.objects.update_or_create(
            driver=driver,
            defaults={'lat': lat, 'lng': lng},
        )
        return Response(DriverPositionSerializer(position).data)


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


class UserViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]