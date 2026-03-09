from rest_framework import serializers
from .models import InspectionReport, InspectionItem, ScheduleEntry, PDIReport, PDIItem


class InspectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionItem
        fields = ['sr_no', 'item', 'special_char', 'spec', 'tolerance', 'inst']


class ScheduleEntrySerializer(serializers.ModelSerializer):
    values = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ScheduleEntry
        fields = [
            'id', 'sr', 'row_order', 'slot_index', 'date', 'operator', 'machine_no', 'time_type',
            'value_1',  'value_2',  'value_3',  'value_4',
            'value_5',  'value_6',  'value_7',  'value_8',
            'value_9',  'value_10', 'value_11', 'value_12',
            'value_13', 'value_14',
            'value_15', 'value_16', 'value_17', 'value_18', 'value_19', 'value_20',
            'values', 'judgment', 'signature', 'filled_at'
        ]

    def get_values(self, obj):
        return [
            obj.value_1,  obj.value_2,  obj.value_3,  obj.value_4,
            obj.value_5,  obj.value_6,  obj.value_7,  obj.value_8,
            obj.value_9,  obj.value_10, obj.value_11, obj.value_12,
            obj.value_13, obj.value_14, obj.value_15, obj.value_16,
            obj.value_17, obj.value_18, obj.value_19, obj.value_20,
        ]


class InspectionReportSerializer(serializers.ModelSerializer):
    items = InspectionItemSerializer(many=True, read_only=True)
    schedule_entries = ScheduleEntrySerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = InspectionReport
        fields = [
            'id', 'doc_no', 'revision_no', 'date',
            'part_name', 'part_number', 'operation_name', 'customer_name',
            'prepared_by', 'approved_by',
            'items', 'schedule_entries', 'item_count',
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class ScheduleEntryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleEntry
        fields = [
            'sr', 'row_order', 'slot_index', 'date', 'operator', 'machine_no', 'time_type',
            'value_1',  'value_2',  'value_3',  'value_4',
            'value_5',  'value_6',  'value_7',  'value_8',
            'value_9',  'value_10', 'value_11', 'value_12',
            'value_13', 'value_14',
            'value_15', 'value_16', 'value_17', 'value_18', 'value_19', 'value_20',
            'judgment', 'signature', 'filled_at',
        ]


class InspectionReportCreateSerializer(serializers.ModelSerializer):
    items = InspectionItemSerializer(many=True, required=False)
    schedule_entries = ScheduleEntryWriteSerializer(many=True, required=False)

    class Meta:
        model = InspectionReport
        fields = [
            'id', 'doc_no', 'revision_no', 'date',
            'part_name', 'part_number', 'operation_name', 'customer_name',
            'prepared_by', 'approved_by',
            'items', 'schedule_entries',
        ]

    def create(self, validated_data):
        items_data    = validated_data.pop('items', [])
        schedule_data = validated_data.pop('schedule_entries', [])
        report = InspectionReport.objects.create(**validated_data)

        for item_data in items_data:
            item_data.pop('id', None)
            InspectionItem.objects.create(report=report, **item_data)

        from django.utils import timezone
        import pytz
        ist = pytz.timezone('Asia/Kolkata')

        for entry_data in schedule_data:
            entry_data.pop('id', None)
            entry_data.pop('values', None)
            entry_data.pop('_isNew', None)
            if not entry_data.get('filled_at'):
                entry_data['filled_at'] = timezone.now().astimezone(ist)
            ScheduleEntry.objects.create(report=report, **entry_data)

        return report

    def update(self, instance, validated_data):
        items_data    = validated_data.pop('items', None)
        schedule_data = validated_data.pop('schedule_entries', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('id', None)
                InspectionItem.objects.create(report=instance, **item_data)

        if schedule_data is not None:
            for entry_data in schedule_data:
                entry_data.pop('id', None)
                entry_data.pop('values', None)
                entry_data.pop('_isNew', None)

                slot_index = entry_data.get('slot_index', 0)
                row_order  = entry_data.get('row_order', 0)

                existing = instance.schedule_entries.filter(
                    slot_index=slot_index,
                    row_order=row_order
                ).first()

                if existing:
                    for field, value in entry_data.items():
                        if field == 'date' and not value:
                            continue
                        if field == 'filled_at' and not value:
                            continue
                        setattr(existing, field, value)
                    if entry_data.get('filled_at'):
                        existing.filled_at = entry_data['filled_at']
                    existing.save()
                else:
                    if not entry_data.get('filled_at'):
                        from django.utils import timezone
                        import pytz
                        ist = pytz.timezone('Asia/Kolkata')
                        entry_data['filled_at'] = timezone.now().astimezone(ist)
                    ScheduleEntry.objects.create(report=instance, **entry_data)

        return instance


# ══════════════════════════════════════════
#  PDI REPORT SERIALIZERS
# ══════════════════════════════════════════

class PDIItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDIItem
        fields = [
            'sr_no', 'item', 'spec', 'tolerance', 'method',
            'vendor_obs1', 'vendor_obs2', 'vendor_judge',
            'cust_obs1',   'cust_obs2',   'cust_judge',
            'remarks',
        ]


class PDIReportSerializer(serializers.ModelSerializer):
    """Read serializer — full detail with items"""
    items = PDIItemSerializer(many=True, read_only=True)

    class Meta:
        model = PDIReport
        fields = [
            'id', 'page_no',
            'supplier_name', 'part_no', 'inspection_date', 'customer_name',
            'part_name', 'invoice_no', 'lot_qty',
            'operation_name',                              # ← ADDED
            'supplier_remarks', 'inspected_by', 'verified_by', 'approved_by',
            'created_at', 'items',
        ]


class PDIReportCreateSerializer(serializers.ModelSerializer):
    """Write serializer — create/update with items"""
    items = PDIItemSerializer(many=True, required=False)

    class Meta:
        model = PDIReport
        fields = [
            'id', 'page_no',
            'supplier_name', 'part_no', 'inspection_date', 'customer_name',
            'part_name', 'invoice_no', 'lot_qty',
            'operation_name',                              # ← ADDED
            'supplier_remarks', 'inspected_by', 'verified_by', 'approved_by',
            'items',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        report = PDIReport.objects.create(**validated_data)
        for item_data in items_data:
            item_data.pop('id', None)
            PDIItem.objects.create(report=report, **item_data)
        return report

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('id', None)
                PDIItem.objects.create(report=instance, **item_data)

        return instance