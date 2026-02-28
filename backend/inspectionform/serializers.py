from rest_framework import serializers
from .models import InspectionReport, InspectionItem, ScheduleEntry


class InspectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionItem
        fields = ['sr_no', 'item', 'special_char', 'spec', 'tolerance', 'inst']


class ScheduleEntrySerializer(serializers.ModelSerializer):
    """Read-only serializer — fetching/displaying ke liye"""
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
        # ✅ 'id' nahi hai — DRF ko id milega to NULL save hoga
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
        now_ist = timezone.now().astimezone(ist)

        for entry_data in schedule_data:
            entry_data.pop('id', None)
            entry_data.pop('values', None)
            entry_data.pop('_isNew', None)
            entry_data['filled_at'] = now_ist
            ScheduleEntry.objects.create(report=report, **entry_data)

        return report

    def update(self, instance, validated_data):
        items_data    = validated_data.pop('items', None)
        schedule_data = validated_data.pop('schedule_entries', None)

        # Report header update
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Items replace
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('id', None)
                InspectionItem.objects.create(report=instance, **item_data)

        # ✅ MAIN FIX — SARI entries DELETE mat karo!
        # Sirf jo slot_index + row_order aa raha hai usse UPDATE karo
        # Baaki purani entries INTACT rahein — unka date/values nahi badlega
        if schedule_data is not None:
            from django.utils import timezone
            import pytz
            ist = pytz.timezone('Asia/Kolkata')
            now_ist = timezone.now().astimezone(ist)

            for entry_data in schedule_data:
                entry_data.pop('id', None)
                entry_data.pop('values', None)
                entry_data.pop('_isNew', None)

                slot_index = entry_data.get('slot_index', 0)
                row_order  = entry_data.get('row_order', 0)

                # Kya yeh slot pehle se DB mein hai?
                existing = instance.schedule_entries.filter(
                    slot_index=slot_index,
                    row_order=row_order
                ).first()

                if existing:
                    # ✅ SIRF values update karo — date PRESERVE karo agar naya data empty hai
                    for field, value in entry_data.items():
                        # Date sirf tab update karo jab value aaya ho
                        if field == 'date' and not value:
                            continue  # purani date rakho
                        setattr(existing, field, value)
                    existing.filled_at = now_ist
                    existing.save()
                else:
                    # Naya slot — fresh create karo
                    entry_data['filled_at'] = now_ist
                    ScheduleEntry.objects.create(report=instance, **entry_data)

        return instance