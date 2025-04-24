from django.urls import path
from .views import GetReviewsView, SubmitReviewView

urlpatterns = [
    path('<int:restaurant_id>/', GetReviewsView.as_view(), name='get-reviews'),  # Fetch reviews for a restaurant
    path('<int:restaurant_id>/add/', SubmitReviewView.as_view(), name='submit-review'),  # Submit a review for a restaurant
]