
import os
import django

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_review.settings')  # replace with your project settings module
django.setup()

from django.core.mail import send_mail

send_mail(
    'Booking Confirmation',
    'Your booking has been confirmed.',
    'piyushbdeshmukh@gmail.com',
    ['piyush.deshmukh1403@gmail.com'],
    fail_silently=False,
)
