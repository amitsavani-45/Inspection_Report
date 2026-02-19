from django.db import models
from django.utils import timezone


class InspectionReport(models.Model):
    """Main inspection report model"""
    doc_no = models.CharField(max_length=50, default='KGTL-QCL-01')
    revision_no = models.CharField(max_length=10, default='01')
    date = models.DateField(default=timezone.now)
    part_name = models.CharField(max_length=200, blank=True)
    part_number = models.CharField(max_length=100, blank=True)
    operation_name = models.CharField(max_length=200, blank=True)
    customer_name = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'inspection_reports'
        ordering = ['-date', '-id']

    def __str__(self):
        return f"{self.doc_no} - {self.part_name}"


class InspectionItem(models.Model):
    """Inspection item details (rows 1-14 in the top table)"""
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
    """
    Schedule table entries — the LAST table in the form.
    Columns: SR | DATE | OPERATOR | M/C NO | TIME | 1-14 values | JDG | SIGN
    Each SR row has 3 time entries: SETUP, 4HRS, LAST
    """
    TIME_CHOICES = [
        ('SETUP', 'Setup'),
        ('4HRS', '4 Hours'),
        ('LAST', 'Last'),
    ]

    report = models.ForeignKey(
        InspectionReport,
        on_delete=models.CASCADE,
        related_name='schedule_entries'
    )
    sr = models.IntegerField(default=1)
    date = models.DateField(null=True, blank=True)
    operator = models.CharField(max_length=100, blank=True)
    machine_no = models.CharField(max_length=50, blank=True)
    time_type = models.CharField(max_length=10, choices=TIME_CHOICES)

    # Values for inspection columns 1-14
    value_1 = models.CharField(max_length=50, blank=True)
    value_2 = models.CharField(max_length=50, blank=True)
    value_3 = models.CharField(max_length=50, blank=True)
    value_4 = models.CharField(max_length=50, blank=True)
    value_5 = models.CharField(max_length=50, blank=True)
    value_6 = models.CharField(max_length=50, blank=True)
    value_7 = models.CharField(max_length=50, blank=True)
    value_8 = models.CharField(max_length=50, blank=True)
    value_9 = models.CharField(max_length=50, blank=True)
    value_10 = models.CharField(max_length=50, blank=True)
    value_11 = models.CharField(max_length=50, blank=True)
    value_12 = models.CharField(max_length=50, blank=True)
    value_13 = models.CharField(max_length=50, blank=True)
    value_14 = models.CharField(max_length=50, blank=True)

    judgment = models.CharField(max_length=50, blank=True)
    signature = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'schedule_entries'
        ordering = ['sr', 'time_type']

    def __str__(self):
        return f"SR {self.sr} - {self.time_type}"