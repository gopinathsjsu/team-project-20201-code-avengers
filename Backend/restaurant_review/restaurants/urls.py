from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RestaurantSearchView, RestaurantListView, RestaurantDetailView, 
    AddRestaurantListingView, DeletePhotoView, PhotoDetailView, 
    UploadPhotoView, UpdateRestaurantListingView, GooglePlaceDetailView,
    # Change this line - use what's actually in your views.py
    OperatingHoursViewSet, RestaurantViewSet
)
from reviews.views import GetReviewsView, SubmitReviewView

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'operating-hours', OperatingHoursViewSet, basename='operating-hours')
router.register(r'restaurants-viewset', RestaurantViewSet, basename='restaurants-viewset')

urlpatterns = [
    # Your existing paths
    path('search/', RestaurantSearchView.as_view(), name='restaurant_search'),
    path('', RestaurantListView.as_view(), name='restaurant_list'),
    path('<int:id>/', RestaurantDetailView.as_view(), name='restaurant_detail'),
    path('add/', AddRestaurantListingView.as_view(), name='add-restaurant'),
    path('<int:restaurant_id>/reviews/', GetReviewsView.as_view(), name='get-reviews'),
    path('<int:restaurant_id>/reviews/add/', SubmitReviewView.as_view(), name='submit-review'),
    path('restaurants/<int:restaurant_id>/photos/upload/', UploadPhotoView.as_view(), name='upload-photo'),
    path('photos/<int:photo_id>/', PhotoDetailView.as_view(), name='photo-detail'),
    path('<int:restaurant_id>/', UpdateRestaurantListingView.as_view(), name='edit-restaurant-detail'),
    path('photos/<int:photo_id>/delete/', DeletePhotoView.as_view(), name='delete-restaurant-photo'),
    path('google_place/<str:place_id>/', GooglePlaceDetailView.as_view(), name='google_place_detail'),
    
    # Include router URLs - this gives you all the ViewSet endpoints
    path('', include(router.urls)),
]