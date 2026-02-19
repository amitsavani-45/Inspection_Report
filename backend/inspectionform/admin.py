from django.contrib import admin
from .models import InspectionReport, InspectionItem, ScheduleEntry


# ✅ InspectionItems — Report ke andar inline dikhenge
class InspectionItemInline(admin.TabularInline):
    model = InspectionItem
    extra = 0  # Extra blank rows nahi chahiye
    fields = ['sr_no', 'item', 'special_char', 'spec', 'tolerance', 'inst']
    ordering = ['sr_no']


# ✅ ScheduleEntries — Report ke andar inline dikhenge
class ScheduleEntryInline(admin.TabularInline):
    model = ScheduleEntry
    extra = 0
    fields = [
        'sr', 'date', 'operator', 'machine_no', 'time_type',
        'value_1', 'value_2', 'value_3', 'value_4', 'value_5',
        'value_6', 'value_7', 'value_8', 'value_9', 'value_10',
        'value_11', 'value_12', 'value_13', 'value_14',
        'judgment', 'signature'
    ]
    ordering = ['sr', 'time_type']


@admin.register(InspectionReport)
class InspectionReportAdmin(admin.ModelAdmin):
    # ✅ List page pe yeh columns dikhenge
    list_display = [
        'id',
        'doc_no',
        'revision_no',
        'date',
        'part_name',
        'part_number',
        'operation_name',
        'customer_name',
        'total_items',  # Custom method — kitne items hain
    ]

    # ✅ Filter sidebar
    list_filter = ['date', 'doc_no', 'part_name', 'customer_name']

    # ✅ Search bar
    search_fields = ['doc_no', 'part_name', 'part_number', 'customer_name', 'operation_name']

    # ✅ Date navigation
    date_hierarchy = 'date'

    # ✅ Default ordering — latest pehle
    ordering = ['-date', '-id']

    # ✅ Report detail page pe Items aur Schedule bhi dikhega
    inlines = [InspectionItemInline, ScheduleEntryInline]

    # ✅ Report detail page fields grouping
    fieldsets = (
        ('Report Information', {
            'fields': ('doc_no', 'revision_no', 'date')
        }),
        ('Part Details', {
            'fields': ('part_name', 'part_number', 'operation_name', 'customer_name')
        }),
    )

    # ✅ Custom column — kitne inspection items hain
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
        'date',
        'operator',
        'machine_no',
        'time_type',
        'judgment'
    ]
    list_filter = ['time_type', 'date', 'report']
    search_fields = ['operator', 'machine_no', 'report__part_name']
    ordering = ['report', 'sr', 'time_type']

    fieldsets = (
        ('Report', {
            'fields': ('report',)
        }),
        ('Schedule Info', {
            'fields': ('sr', 'date', 'operator', 'machine_no', 'time_type')
        }),
        ('Measured Values (1-14)', {
            'fields': (
                'value_1', 'value_2', 'value_3', 'value_4', 'value_5',
                'value_6', 'value_7', 'value_8', 'value_9', 'value_10',
                'value_11', 'value_12', 'value_13', 'value_14'
            ),
            'classes': ('collapse',)  # Collapsed by default
        }),
        ('Results', {
            'fields': ('judgment', 'signature')
        }),
    )