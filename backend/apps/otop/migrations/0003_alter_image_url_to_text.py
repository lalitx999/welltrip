from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('otop', '0002_catalog_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='otopproduct',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),
    ]
