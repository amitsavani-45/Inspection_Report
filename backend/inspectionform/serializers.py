from rest_framework import serializers
from .models import InspectionReport, InspectionItem, ScheduleEntry


class InspectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionItem
        fields = ['id', 'sr_no', 'item', 'special_char', 'spec', 'tolerance', 'inst']


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
            'values', 'judgment', 'signature'
        ]

    def get_values(self, obj):
        return [
            obj.value_1,  obj.value_2,  obj.value_3,  obj.value_4,
            obj.value_5,  obj.value_6,  obj.value_7,  obj.value_8,
            obj.value_9,  obj.value_10, obj.value_11, obj.value_12,
            obj.value_13, obj.value_14
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
            'items', 'schedule_entries', 'item_count',
            'prepared_by', 'approved_by'
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class InspectionReportCreateSerializer(serializers.ModelSerializer):
    items = InspectionItemSerializer(many=True, required=False)
    schedule_entries = ScheduleEntrySerializer(many=True, required=False)

    class Meta:
        model = InspectionReport
        fields = [
            'id', 'doc_no', 'revision_no', 'date',
            'part_name', 'part_number', 'operation_name', 'customer_name',
            'items', 'schedule_entries'
        ]

    def create(self, validated_data):
        items_data    = validated_data.pop('items', [])
        schedule_data = validated_data.pop('schedule_entries', [])

        report = InspectionReport.objects.create(**validated_data)

        for item_data in items_data:
            InspectionItem.objects.create(report=report, **item_data)

        for entry_data in schedule_data:
            entry_data.pop('values', None)
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
                InspectionItem.objects.create(report=instance, **item_data)

        if schedule_data is not None:
            # ✅ Pehle SARI purani entries delete karo, phir fresh save karo
            instance.schedule_entries.all().delete()
            for idx, entry_data in enumerate(schedule_data):
                entry_data.pop('values', None)
                entry_data.pop('id', None)  # id kabhi set mat karo — naya create hoga
                # slot_index already frontend se aa raha hai (0-based)
                # agar nahi aaya toh idx use karo
                if 'slot_index' not in entry_data:
                    entry_data['slot_index'] = idx
                ScheduleEntry.objects.create(report=instance, **entry_data)

        return instance