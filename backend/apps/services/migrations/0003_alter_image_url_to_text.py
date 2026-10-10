from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0002_catalog_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='foodmenu',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='wellnessservice',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),
    ]
