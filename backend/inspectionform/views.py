from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import InspectionReport, InspectionItem, ScheduleEntry
from .serializers import (
    InspectionReportSerializer,
    InspectionReportCreateSerializer,
    InspectionItemSerializer,
    ScheduleEntrySerializer
)


class InspectionReportViewSet(viewsets.ModelViewSet):
    queryset = InspectionReport.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InspectionReportCreateSerializer
        return InspectionReportSerializer

    # ✅ FILTER SUPPORT
    def get_queryset(self):
        queryset = InspectionReport.objects.all()

        date = self.request.query_params.get('date')
        part_name = self.request.query_params.get('part_name')
        operation_name = self.request.query_params.get('operation_name')
        customer_name = self.request.query_params.get('customer_name')

        if date:
            queryset = queryset.filter(date=date)
        if part_name:
            queryset = queryset.filter(part_name=part_name)
        if operation_name:
            queryset = queryset.filter(operation_name=operation_name)
        if customer_name:
            queryset = queryset.filter(customer_name=customer_name)

        return queryset

    def list(self, request):
        queryset = self.get_queryset()
        serializer = InspectionReportSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        report = get_object_or_404(InspectionReport, pk=pk)
        serializer = InspectionReportSerializer(report)
        return Response(serializer.data)

    def create(self, request):
        serializer = InspectionReportCreateSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save()
            return Response(
                InspectionReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        report = get_object_or_404(InspectionReport, pk=pk)
        serializer = InspectionReportCreateSerializer(report, data=request.data)
        if serializer.is_valid():
            report = serializer.save()
            return Response(InspectionReportSerializer(report).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        report = get_object_or_404(InspectionReport, pk=pk)
        serializer = InspectionReportCreateSerializer(
            report,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            report = serializer.save()
            return Response(InspectionReportSerializer(report).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        report = get_object_or_404(InspectionReport, pk=pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ================= ITEMS =================

class InspectionItemViewSet(viewsets.ModelViewSet):
    queryset = InspectionItem.objects.all()
    serializer_class = InspectionItemSerializer

    def get_queryset(self):
        queryset = InspectionItem.objects.all()
        report_id = self.request.query_params.get('report_id')
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        return queryset


# ================= SCHEDULE =================

class ScheduleEntryViewSet(viewsets.ModelViewSet):
    queryset = ScheduleEntry.objects.all()
    serializer_class = ScheduleEntrySerializer

    def get_queryset(self):
        queryset = ScheduleEntry.objects.all()
        report_id = self.request.query_params.get('report_id')
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        return queryset
