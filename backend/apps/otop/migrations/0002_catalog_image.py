from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("otop", "0001_initial")]
    operations = [migrations.AddField(model_name="otopproduct", name="image_url", field=models.URLField(max_length=1000, blank=True, default=""))]
