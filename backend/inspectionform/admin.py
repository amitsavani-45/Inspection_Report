from django.contrib import admin
from .models import InspectionReport, InspectionItem, ScheduleEntry


# ✅ InspectionItems — Report ke andar inline dikhenge
class InspectionItemInline(admin.TabularInline):
    model = InspectionItem
    extra = 0
    fields = ['sr_no', 'item', 'special_char', 'spec', 'tolerance', 'inst']
    ordering = ['sr_no']


# ✅ ScheduleEntries — Report ke andar inline dikhenge
class ScheduleEntryInline(admin.TabularInline):
    model = ScheduleEntry
    extra = 0
    fields = [
        'sr', 'slot_index', 'row_order', 'date', 'operator', 'machine_no', 'time_type',
        'value_1',  'value_2',  'value_3',  'value_4',  'value_5',
        'value_6',  'value_7',  'value_8',  'value_9',  'value_10',
        'value_11', 'value_12', 'value_13', 'value_14',
        'value_15', 'value_16', 'value_17', 'value_18', 'value_19', 'value_20',  # ✅ FIXED
        'judgment', 'signature', 'filled_at'  # ✅ FIXED
    ]
    ordering = ['sr', 'slot_index', 'row_order']


@admin.register(InspectionReport)
class InspectionReportAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'doc_no',
        'revision_no',
        'date',
        'part_name',
        'part_number',
        'operation_name',
        'customer_name',
        'total_items',
    ]
    list_filter = ['date', 'doc_no', 'part_name', 'customer_name']
    search_fields = ['doc_no', 'part_name', 'part_number', 'customer_name', 'operation_name']
    date_hierarchy = 'date'
    ordering = ['-date', '-id']
    inlines = [InspectionItemInline, ScheduleEntryInline]
    fieldsets = (
        ('Report Information', {
            'fields': ('doc_no', 'revision_no', 'date')
        }),
        ('Part Details', {
            'fields': ('part_name', 'part_number', 'operation_name', 'customer_name')
        }),
    )

    @admin.display(description='Total Items')
    def total_items(self, obj):
        return obj.items.count()


@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'report',
        'sr_no',
        'item',
        'special_char',
        'spec',
        'tolerance',
        'inst'
    ]
    list_filter = ['item', 'inst', 'report']
    search_fields = ['item', 'spec', 'inst', 'report__part_name', 'report__doc_no']
    ordering = ['report', 'sr_no']
    fieldsets = (
        ('Report', {
            'fields': ('report',)
        }),
        ('Item Details', {
            'fields': ('sr_no', 'item', 'special_char', 'spec', 'tolerance', 'inst')
        }),
    )


@admin.register(ScheduleEntry)
class ScheduleEntryAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'report',
        'sr',
        'slot_index',
        'row_order',
        'date',
        'operator',
        'machine_no',
        'time_type',
        'judgment',
        'filled_at',  # ✅ FIXED
    ]
    list_filter = ['time_type', 'date', 'report']
    search_fields = ['operator', 'machine_no', 'report__part_name']
    ordering = ['report', 'sr', 'slot_index', 'row_order']
    fieldsets = (
        ('Report', {
            'fields': ('report',)
        }),
        ('Schedule Info', {
            'fields': ('sr', 'slot_index', 'row_order', 'date', 'operator', 'machine_no', 'time_type')  # ✅ FIXED
        }),
        ('Measured Values (1–10)', {
            'fields': (
                'value_1',  'value_2',  'value_3',  'value_4',  'value_5',
                'value_6',  'value_7',  'value_8',  'value_9',  'value_10',
            ),
            'classes': ('collapse',)
        }),
        ('Measured Values (11–20)', {  # ✅ FIXED — split into two groups for clarity
            'fields': (
                'value_11', 'value_12', 'value_13', 'value_14',
                'value_15', 'value_16', 'value_17', 'value_18', 'value_19', 'value_20',  # ✅ FIXED
            ),
            'classes': ('collapse',)
        }),
        ('Results', {
            'fields': ('judgment', 'signature', 'filled_at')  # ✅ FIXED
        }),
    )