from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from .models import InspectionReport, InspectionItem, ScheduleEntry
from .serializers import (
    InspectionReportSerializer,
    InspectionReportCreateSerializer,
    InspectionItemSerializer,
    ScheduleEntrySerializer
)


# ================= DROPDOWN OPTIONS (DB se fetch) =================

@api_view(['GET'])
def dropdown_options(request):
    """
    L1_part_info_master aur L2_process_report_master se data fetch karo
    """
    from django.db import connection

    with connection.cursor() as cursor:

        # Customer - L1 se
        cursor.execute('SELECT DISTINCT customer_name FROM public."L1_part_info_master" WHERE customer_name IS NOT NULL AND customer_name != \'\' ORDER BY customer_name')
        customers = [row[0] for row in cursor.fetchall()]

        # Part Name - L1 se
        cursor.execute('SELECT DISTINCT part_name FROM public."L1_part_info_master" WHERE part_name IS NOT NULL AND part_name != \'\' ORDER BY part_name')
        part_names = [row[0] for row in cursor.fetchall()]

        # Part Number - L1 se
        cursor.execute('SELECT DISTINCT part_no FROM public."L1_part_info_master" WHERE part_no IS NOT NULL AND part_no != \'\' ORDER BY part_no')
        part_numbers = [row[0] for row in cursor.fetchall()]

        # Operation - L2 se (report_name)
        cursor.execute('SELECT DISTINCT report_name FROM public."L2_process_report_master" WHERE report_name IS NOT NULL AND report_name != \'\' ORDER BY report_name')
        operations = [row[0] for row in cursor.fetchall()]

    return Response({
        'customers': customers,
        'part_names': part_names,
        'part_numbers': part_numbers,
        'operations': operations,
    })


@api_view(['GET'])
def inspection_items_by_operation(request):
    """
    Operation select karne par L3 se Product/Process items fetch karo
    Spec aur Instrument bhi saath mein aayega
    """
    from django.db import connection

    operation = request.query_params.get('operation', '')
    if not operation:
        return Response({'product': [], 'process': []})

    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT l3.category, l3.parameter_name, l3.specification, l3.instrument
            FROM public."L3_parameter_detail_master" l3
            JOIN public."L2_process_report_master" l2 ON l3.process_report_id = l2.id
            WHERE l2.report_name = %s
            ORDER BY l3.category, l3.id
        ''', [operation])
        rows = cursor.fetchall()

    product_items = []
    process_items = []

    for row in rows:
        category, parameter_name, specification, instrument = row
        item = {
            'name': parameter_name or '',
            'spec': specification or '',
            'instrument': instrument or '',
        }
        if category == 'PRODUCT':
            product_items.append(item)
        elif category == 'PROCESS':
            process_items.append(item)

    return Response({
        'product': product_items,
        'process': process_items,
    })


# ================= REPORTS =================

class InspectionReportViewSet(viewsets.ModelViewSet):
    queryset = InspectionReport.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InspectionReportCreateSerializer
        return InspectionReportSerializer

    # ✅ FILTER SUPPORT
    def get_queryset(self):
        queryset = InspectionReport.objects.all().order_by("-date", "-id")

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
        try:
            import json
            # JSON data safely copy karo
            if hasattr(request.data, 'dict'):
                data = request.data.dict()
            else:
                data = dict(request.data)
            data.pop('_isNew', None)

            serializer = InspectionReportCreateSerializer(data=data)
            if serializer.is_valid():
                report = serializer.save()
                return Response(
                    InspectionReportSerializer(report).data,
                    status=status.HTTP_201_CREATED
                )
            print("SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print("CREATE ERROR:", traceback.format_exc())
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        try:
            report = InspectionReport.objects.get(pk=pk)
        except InspectionReport.DoesNotExist:
            return Response(
                {"detail": f"Report with ID {pk} not found. Please refresh the page and try again."},
                status=status.HTTP_404_NOT_FOUND
            )
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