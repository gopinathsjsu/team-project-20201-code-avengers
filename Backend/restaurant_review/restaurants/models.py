from django.db import models
from django.conf import settings
from accounts.models import CustomUser  
from django.core.validators import MinValueValidator, MaxValueValidator

class CuisineType(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name
    
class FoodType(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class Restaurant(models.Model):
    CATEGORY_CHOICES = [
        ('fast_food', 'Fast Food'),
        ('fine_dining', 'Fine Dining'),
        ('cafe', 'Cafe'),
    ]
    FOOD_TYPE_CHOICES = [
        ('vegan', 'Vegan'),
        ('vegetarian', 'Vegetarian'),
        ('non_veg', 'Non-Vegetarian'),
    ]
    PRICE_RANGE_CHOICES = [
        ('$','Low'),
        ('$$','Moderate'),
        ('$$$', 'Expensive')
    ]

    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'owner'},
        related_name="restaurants"
    )
    
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    cuisine_type = models.ManyToManyField(CuisineType, related_name = "restaurants")
    food_type = models.ManyToManyField(FoodType, related_name = "restaurants")
    price_range = models.CharField(max_length=50, choices=PRICE_RANGE_CHOICES)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    hours_of_operation = models.CharField(max_length=100)
    website = models.URLField(blank=True, null=True)
    phone_number = models.CharField(max_length=15)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    review_count = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class OperatingHours(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='operating_hours')
    day_of_week = models.IntegerField(choices=DAY_CHOICES, validators=[MinValueValidator(0), MaxValueValidator(6)])
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_closed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('restaurant', 'day_of_week')
        ordering = ['day_of_week']
    
    def __str__(self):
        if self.is_closed:
            return f"{self.get_day_of_week_display()}: Closed"
        return f"{self.get_day_of_week_display()}: {self.opening_time.strftime('%I:%M %p')} - {self.closing_time.strftime('%I:%M %p')}"
    
class RestaurantPhoto(models.Model):
    restaurant = models.ForeignKey(
        'Restaurant', 
        on_delete=models.CASCADE, 
        related_name='photos'
    )
    photo_key = models.CharField(max_length=255)  # Store the S3 object key
    thumbnail_s3_key = models.CharField(max_length=255, blank=True, null=True)  # Thumbnail
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.restaurant.name}: {self.photo_key}"