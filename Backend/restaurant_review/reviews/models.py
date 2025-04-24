# Create your models here.
from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from accounts.models import CustomUser
from restaurants.models import Restaurant

class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField()  # Assuming ratings are out of 5
    review_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.restaurant.name} - {self.rating}/5'

@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def update_restaurant_rating(sender, instance, **kwargs):
    restaurant = instance.restaurant
    reviews = restaurant.reviews.all()

    total_rating = reviews.aggregate(Sum('rating'))['rating__sum'] or 0
    restaurant.rating = total_rating / 5
    restaurant.review_count = reviews.count()
    restaurant.save()