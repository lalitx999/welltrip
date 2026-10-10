from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0002_editorial_and_location'),
    ]

    operations = [
        migrations.AlterField(
            model_name='editorialentry',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),

    ]
