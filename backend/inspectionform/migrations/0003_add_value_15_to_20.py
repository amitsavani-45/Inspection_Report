from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspectionform', '0002_alter_inspectionreport_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduleentry',
            name='value_15',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='scheduleentry',
            name='value_16',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='scheduleentry',
            name='value_17',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='scheduleentry',
            name='value_18',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='scheduleentry',
            name='value_19',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='scheduleentry',
            name='value_20',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]