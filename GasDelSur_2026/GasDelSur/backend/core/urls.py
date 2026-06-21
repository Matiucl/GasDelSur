from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, OrderViewSet, CylinderViewSet, DriverPositionViewSet,
    UserViewSet, RegisterView, LoginView, AdminCreateUserView,
    DriverPositionSetView,
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
    path('auth/admin-create-user/', AdminCreateUserView.as_view(), name='admin-create-user'),
    path('driver-positions/<uuid:driver_id>/set/', DriverPositionSetView.as_view(), name='driver-position-set'),
    path('', include(router.urls)),
]