# Generated for EmailVerificationOTP

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_merchantprofile'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailVerificationOTP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(db_index=True, max_length=254)),
                ('otp_code', models.CharField(max_length=6)),
                ('purpose', models.CharField(default='MERCHANT_REGISTER', max_length=50)),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(db_index=True)),
            ],
            options={
                'db_table': 'email_verification_otps',
                'ordering': ('-created_at',),
            },
        ),
    ]
