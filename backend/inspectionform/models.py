from django.db import models
from django.utils import timezone


class InspectionReport(models.Model):
    doc_no = models.CharField(max_length=50, default='KGTL-QCL-01')
    revision_no = models.CharField(max_length=10, default='01')
    date = models.DateField(default=timezone.now)
    part_name = models.CharField(max_length=200, blank=True)
    part_number = models.CharField(max_length=100, blank=True)
    operation_name = models.CharField(max_length=200, blank=True)
    customer_name = models.CharField(max_length=200, blank=True)
    prepared_by = models.CharField(max_length=100, blank=True)
    approved_by = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'inspection_reports'
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.doc_no} - {self.part_name}"


class InspectionItem(models.Model):
    report = models.ForeignKey(
        InspectionReport,
        on_delete=models.CASCADE,
        related_name='items'
    )
    sr_no = models.IntegerField()
    item = models.CharField(max_length=200)
    special_char = models.CharField(max_length=100, blank=True)
    spec = models.CharField(max_length=100, blank=True)
    tolerance = models.CharField(max_length=50, blank=True)
    inst = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'inspection_items'
        ordering = ['sr_no']
        unique_together = ['report', 'sr_no']

    def __str__(self):
        return f"{self.sr_no}. {self.item}"


class ScheduleEntry(models.Model):
    TIME_CHOICES = [
        ('SETUP', 'Setup'),
        ('2HRS', '2 Hours'),
        ('4HRS', '4 Hours'),
        ('LAST', 'Last'),
    ]

    report = models.ForeignKey(
        InspectionReport,
        on_delete=models.CASCADE,
        related_name='schedule_entries'
    )
    sr = models.IntegerField(default=1)
    row_order = models.IntegerField(default=0)
    slot_index = models.IntegerField(default=0)
    date = models.DateField(null=True, blank=True)
    operator = models.CharField(max_length=100, blank=True)
    machine_no = models.CharField(max_length=50, blank=True)
    time_type = models.CharField(max_length=10, choices=TIME_CHOICES)

    value_1  = models.CharField(max_length=50, blank=True)
    value_2  = models.CharField(max_length=50, blank=True)
    value_3  = models.CharField(max_length=50, blank=True)
    value_4  = models.CharField(max_length=50, blank=True)
    value_5  = models.CharField(max_length=50, blank=True)
    value_6  = models.CharField(max_length=50, blank=True)
    value_7  = models.CharField(max_length=50, blank=True)
    value_8  = models.CharField(max_length=50, blank=True)
    value_9  = models.CharField(max_length=50, blank=True)
    value_10 = models.CharField(max_length=50, blank=True)
    value_11 = models.CharField(max_length=50, blank=True)
    value_12 = models.CharField(max_length=50, blank=True)
    value_13 = models.CharField(max_length=50, blank=True)
    value_14 = models.CharField(max_length=50, blank=True)
    value_15 = models.CharField(max_length=50, blank=True)
    value_16 = models.CharField(max_length=50, blank=True)
    value_17 = models.CharField(max_length=50, blank=True)
    value_18 = models.CharField(max_length=50, blank=True)
    value_19 = models.CharField(max_length=50, blank=True)
    value_20 = models.CharField(max_length=50, blank=True)

    judgment  = models.CharField(max_length=50, blank=True)
    signature = models.CharField(max_length=100, blank=True)
    filled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'schedule_entries'
        ordering = ['sr', 'slot_index', 'row_order']

    def __str__(self):
        return f"SR {self.sr} - {self.time_type} - {{'UP' if self.row_order == 0 else 'DOWN'}}"


# ══════════════════════════════════════════
#  PDI REPORT MODELS (Pre Dispatch Inspection)
# ══════════════════════════════════════════

class PDIReport(models.Model):
    """Pre Dispatch Inspection Report header"""
    page_no          = models.CharField(max_length=20, default='01 OF 01')
    supplier_name    = models.CharField(max_length=200, blank=True)
    part_no          = models.CharField(max_length=100, blank=True)
    inspection_date  = models.DateField(default=timezone.now)
    customer_name    = models.CharField(max_length=200, blank=True)
    part_name        = models.CharField(max_length=200, blank=True)
    invoice_no       = models.CharField(max_length=100, blank=True)
    lot_qty          = models.CharField(max_length=50, blank=True)
    operation_name   = models.CharField(max_length=200, blank=True)   # ← ADDED
    supplier_remarks = models.TextField(blank=True)
    inspected_by     = models.CharField(max_length=100, blank=True)
    verified_by      = models.CharField(max_length=100, blank=True)
    approved_by      = models.CharField(max_length=100, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pdi_reports'
        ordering = ['-inspection_date', '-id']

    def __str__(self):
        return f"PDI - {self.part_name} - {self.inspection_date}"


class PDIItem(models.Model):
    """Individual inspection row in PDI Report"""
    report       = models.ForeignKey(PDIReport, on_delete=models.CASCADE, related_name='items')
    sr_no        = models.IntegerField()
    item         = models.CharField(max_length=300, blank=True)
    spec         = models.CharField(max_length=200, blank=True)
    tolerance    = models.CharField(max_length=100, blank=True)
    method       = models.CharField(max_length=100, blank=True)
    vendor_obs1  = models.CharField(max_length=100, blank=True)
    vendor_obs2  = models.CharField(max_length=100, blank=True)
    vendor_judge = models.CharField(max_length=50, blank=True)
    cust_obs1    = models.CharField(max_length=100, blank=True)
    cust_obs2    = models.CharField(max_length=100, blank=True)
    cust_judge   = models.CharField(max_length=50, blank=True)
    remarks      = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'pdi_items'
        ordering = ['sr_no']
        unique_together = ['report', 'sr_no']

    def __str__(self):
        return f"{self.sr_no}. {self.item}"