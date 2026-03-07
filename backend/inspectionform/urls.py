from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InspectionReportViewSet,
    InspectionItemViewSet,
    ScheduleEntryViewSet,
    PDIReportViewSet,
    dropdown_options,
    inspection_items_by_operation,
)

router = DefaultRouter()

# Setup & Patrol Inspection
router.register(r'reports',  InspectionReportViewSet, basename='inspection-report')
router.register(r'items',    InspectionItemViewSet,   basename='inspection-item')
router.register(r'schedule', ScheduleEntryViewSet,    basename='schedule-entry')

# PDI Report (Pre Dispatch Inspection)
router.register(r'pdi-reports', PDIReportViewSet, basename='pdi-report')

urlpatterns = [
    path('', include(router.urls)),
    path('dropdown-options/',  dropdown_options,               name='dropdown-options'),
    path('inspection-items/',  inspection_items_by_operation,  name='inspection-items'),
]