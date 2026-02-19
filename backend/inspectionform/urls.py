from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InspectionReportViewSet, InspectionItemViewSet, ScheduleEntryViewSet

router = DefaultRouter()
router.register(r'reports', InspectionReportViewSet, basename='inspection-report')
router.register(r'items', InspectionItemViewSet, basename='inspection-item')
router.register(r'schedule', ScheduleEntryViewSet, basename='schedule-entry')

urlpatterns = [
    path('', include(router.urls)),
    
]