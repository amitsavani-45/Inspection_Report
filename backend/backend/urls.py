from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('inspectionform.urls')),  # FIXED: Must point to 'inspectionform.urls'
]