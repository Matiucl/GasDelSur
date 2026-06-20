from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, OrderViewSet, CylinderViewSet, DriverPositionViewSet,
    UserViewSet, RegisterView, LoginView,
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='products')
router.register('orders', OrderViewSet, basename='orders')
router.register('cylinders', CylinderViewSet, basename='cylinders')
router.register('driver-positions', DriverPositionViewSet, basename='driver-positions')
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]