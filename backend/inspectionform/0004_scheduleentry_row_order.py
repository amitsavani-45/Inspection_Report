from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspectionform', '0003_alter_scheduleentry_sr'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduleentry',
            name='row_order',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='scheduleentry',
            options={
                'ordering': ['sr', 'time_type', 'row_order'],
            },
        ),
    ]