from django.urls import path
from .views import RestaurantSearchView, RestaurantListView, RestaurantDetailView, AddRestaurantListingView, DeletePhotoView, PhotoDetailView, UploadPhotoView, UpdateRestaurantListingView, GooglePlaceDetailView
from reviews.views import GetReviewsView, SubmitReviewView
urlpatterns = [
    path('search/', RestaurantSearchView.as_view(), name='restaurant_search'),  # For search functionality
    path('', RestaurantListView.as_view(), name='restaurant_list'),  # For listing all restaurants
    path('<int:id>/', RestaurantDetailView.as_view(), name='restaurant_detail'),
    path('add/', AddRestaurantListingView.as_view(), name='add-restaurant'),
    path('<int:restaurant_id>/reviews/', GetReviewsView.as_view(), name='get-reviews'),
    path('<int:restaurant_id>/reviews/add/', SubmitReviewView.as_view(), name='submit-review'),
    # path('photos/<int:photo_id>/delete/', DeletePhotoView.as_view(), name='delete-photo'),
    path('restaurants/<int:restaurant_id>/photos/upload/', UploadPhotoView.as_view(), name='upload-photo'),
    path('photos/<int:photo_id>/', PhotoDetailView.as_view(), name='photo-detail'),
    path('<int:restaurant_id>/', UpdateRestaurantListingView.as_view(), name = 'edit-restaurant-detail'),
    path('photos/<int:photo_id>/delete/', DeletePhotoView.as_view(), name='delete-restaurant-photo'),
    path('google_place/<str:place_id>/', GooglePlaceDetailView.as_view(), name='google_place_detail'),

]
