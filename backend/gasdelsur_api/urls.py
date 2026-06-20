from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Refresh de token (el login ahora vive en core/urls.py → /api/auth/login/)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/', include('core.urls')),
]