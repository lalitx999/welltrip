from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accommodations', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='roomimage',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),
    ]
