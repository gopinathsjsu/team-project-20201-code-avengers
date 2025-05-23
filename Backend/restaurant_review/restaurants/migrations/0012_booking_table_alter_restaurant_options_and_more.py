# Generated by Django 5.1.2 on 2025-05-02 02:29

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0011_alter_restaurant_owner'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('time', models.TimeField()),
                ('num_people', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('status', models.CharField(choices=[('BOOKED', 'Booked'), ('CANCELLED', 'Cancelled'), ('COMPLETED', 'Completed')], default='BOOKED', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Table',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('size', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('available_times', models.JSONField(blank=True, default=list)),
            ],
            options={
                'ordering': ['restaurant', 'size'],
            },
        ),
        migrations.AlterModelOptions(
            name='restaurant',
            options={'ordering': ['name']},
        ),
        migrations.AddField(
            model_name='restaurant',
            name='category',
            field=models.CharField(choices=[('fast_food', 'Fast Food'), ('fine_dining', 'Fine Dining'), ('cafe', 'Cafe')], default='cafe', max_length=20),
        ),
        migrations.AlterField(
            model_name='restaurant',
            name='price_range',
            field=models.CharField(choices=[('$', 'Low'), ('$$', 'Moderate'), ('$$$', 'Expensive')], max_length=3),
        ),
        migrations.AddIndex(
            model_name='restaurant',
            index=models.Index(fields=['city', 'state'], name='restaurants_city_b9092e_idx'),
        ),
        migrations.AddField(
            model_name='booking',
            name='restaurant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='restaurants.restaurant'),
        ),
        migrations.AddField(
            model_name='booking',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='table',
            name='restaurant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tables', to='restaurants.restaurant'),
        ),
        migrations.AddField(
            model_name='booking',
            name='table',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='restaurants.table'),
        ),
        migrations.AlterUniqueTogether(
            name='table',
            unique_together={('restaurant', 'id')},
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['restaurant', 'date'], name='restaurants_restaur_756cca_idx'),
        ),
        migrations.AddConstraint(
            model_name='booking',
            constraint=models.UniqueConstraint(fields=('table', 'date', 'time'), name='unique_table_date_time'),
        ),
    ]
