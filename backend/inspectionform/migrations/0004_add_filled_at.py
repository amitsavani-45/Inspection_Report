from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspectionform', '0003_add_value_15_to_20'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduleentry',
            name='filled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]