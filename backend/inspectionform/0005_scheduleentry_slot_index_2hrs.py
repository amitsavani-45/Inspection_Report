from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspectionform', '0004_alter_scheduleentry_options_and_more'),
    ]

    operations = [
        # 1. slot_index field add karo (default=0)
        migrations.AddField(
            model_name='scheduleentry',
            name='slot_index',
            field=models.IntegerField(default=0),
        ),
        # 2. time_type choices update — 2HRS add karo
        migrations.AlterField(
            model_name='scheduleentry',
            name='time_type',
            field=models.CharField(
                max_length=10,
                choices=[
                    ('SETUP', 'Setup'),
                    ('2HRS', '2 Hours'),
                    ('4HRS', '4 Hours'),
                    ('LAST', 'Last'),
                ]
            ),
        ),
    ]