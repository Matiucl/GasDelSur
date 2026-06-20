
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# Ejemplo de lo que se agrega aquí una vez tengas los modelos reales:
# router.register('orders', OrderViewSet, basename='orders')
# router.register('cylinders', CylinderViewSet, basename='cylinders')
# router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]