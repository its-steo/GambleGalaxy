# Generated by Django 5.2.4 on 2025-07-16 10:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_customuser_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_bot',
            field=models.BooleanField(default=False),
        ),
    ]
