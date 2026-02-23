from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inspectionform', '0005_scheduleentry_slot_index_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='scheduleentry',
            options={'ordering': ['sr', 'slot_index', 'row_order']},
        ),
    ]