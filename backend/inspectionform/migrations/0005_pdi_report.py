# Migration for PDI Report tables

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspectionform', '0004_add_filled_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='PDIReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('page_no', models.CharField(default='01 OF 01', max_length=20)),
                ('supplier_name', models.CharField(blank=True, max_length=200)),
                ('part_no', models.CharField(blank=True, max_length=100)),
                ('inspection_date', models.DateField(default=django.utils.timezone.now)),
                ('customer_name', models.CharField(blank=True, max_length=200)),
                ('part_name', models.CharField(blank=True, max_length=200)),
                ('invoice_no', models.CharField(blank=True, max_length=100)),
                ('lot_qty', models.CharField(blank=True, max_length=50)),
                ('supplier_remarks', models.TextField(blank=True)),
                ('inspected_by', models.CharField(blank=True, max_length=100)),
                ('verified_by', models.CharField(blank=True, max_length=100)),
                ('approved_by', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'pdi_reports',
                'ordering': ['-inspection_date', '-id'],
            },
        ),
        migrations.CreateModel(
            name='PDIItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('report', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='items',
                    to='inspectionform.pdireport'
                )),
                ('sr_no', models.IntegerField()),
                ('item', models.CharField(blank=True, max_length=300)),
                ('spec', models.CharField(blank=True, max_length=200)),
                ('tolerance', models.CharField(blank=True, max_length=100)),
                ('method', models.CharField(blank=True, max_length=100)),
                ('vendor_obs1', models.CharField(blank=True, max_length=100)),
                ('vendor_obs2', models.CharField(blank=True, max_length=100)),
                ('vendor_judge', models.CharField(blank=True, max_length=50)),
                ('cust_obs1', models.CharField(blank=True, max_length=100)),
                ('cust_obs2', models.CharField(blank=True, max_length=100)),
                ('cust_judge', models.CharField(blank=True, max_length=50)),
                ('remarks', models.CharField(blank=True, max_length=200)),
            ],
            options={
                'db_table': 'pdi_items',
                'ordering': ['sr_no'],
                'unique_together': {('report', 'sr_no')},
            },
        ),
    ]