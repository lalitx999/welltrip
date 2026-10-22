from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accommodations', '0002_alter_image_url_to_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='accommodation',
            name='google_maps_url',
            field=models.URLField(blank=True, default='', max_length=500),
        ),
    ]
