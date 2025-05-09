# restaurants/urls.py
from django.urls import path
from django.urls import path, include

from rest_framework.routers import DefaultRouter


from . import views  # Import views from the current module (restaurants)  addedd


from .views import (
    # Search & list
    RestaurantSearchView,
    RestaurantListView,
    RestaurantDetailView,
    RestaurantTableListView,
    DuplicateListingsView,
    DeleteDuplicateListingView,

    # Owner / admin CRUD
    AddListingView,                 # <- rename matches views.py
    UpdateRestaurantListingView,
    UploadPhotoView,
    DeletePhotoView,
    PhotoDetailView,
    OldListingsView,
    OwnerRestaurantListingsView,

    # Google & booking
    GooglePlaceDetailView,
    BookTableAPIView,
    CancelBookingAPIView,
)



# Reviews live in the reviews app but we expose them here
from reviews.views import GetReviewsView, SubmitReviewView

router = DefaultRouter()

urlpatterns = [
    # path("api/", include("restaurants.urls")),

    # ───────────────────────────────────
    #  Public search / list / detail
    # ───────────────────────────────────
    path("search/", RestaurantSearchView.as_view(), name="restaurant-search"),
    path("",        RestaurantListView.as_view(),  name="restaurant-list"),
    path("<int:id>/", RestaurantDetailView.as_view(), name="restaurant-detail"),

    # ───────────────────────────────────
    #  Reviews
    # ───────────────────────────────────
    path("<int:restaurant_id>/reviews/",        GetReviewsView.as_view(),    name="get-reviews"),
    path("<int:restaurant_id>/reviews/add/",    SubmitReviewView.as_view(),  name="submit-review"),
    # ──────────────────────────────────────────────────────────────
    #  Duplicate detection & admin cleanup
    # ──────────────────────────────────────────────────────────────
    path("duplicates/",            DuplicateListingsView.as_view(),    name="duplicate-listings"),
    path("duplicates/<int:id>/",   DeleteDuplicateListingView.as_view(), name="delete-duplicate"),
    # ───────────────────────────────────
    #  Owner CRUD / photos
    # ───────────────────────────────────
    path("owner/add/",                      AddListingView.as_view(),            name="add-restaurant"),
    path("owner/my/",   OwnerRestaurantListingsView.as_view(), name="owner-listings"),
    path("owner/<int:pk>/",                 UpdateRestaurantListingView.as_view(), name="update-restaurant"),

    path("owner/old/",             OldListingsView.as_view(),          name="old-listings"),               # GET list
    path("owner/old/<int:id>/",    OldListingsView.as_view(),          name="delete-old-listing"),  

    path("<int:restaurant_id>/photos/upload/", UploadPhotoView.as_view(),        name="upload-photo"),
    path("photos/<int:photo_id>/",          PhotoDetailView.as_view(),           name="photo-detail"),
    path("photos/<int:photo_id>/delete/",   DeletePhotoView.as_view(),           name="delete-photo"),

    # ───────────────────────────────────
    #  Google Places passthrough
    # ───────────────────────────────────
    path("google_place/<str:place_id>/", GooglePlaceDetailView.as_view(), name="google-place-detail"),

    # ───────────────────────────────────
    #  Booking
    # ───────────────────────────────────
    path("bookings/", BookTableAPIView.as_view(), name="book-table"),
    path("restaurants/bookings/cancel/", CancelBookingAPIView.as_view()),
    # path('restaurants/tables/<int:table_id>/edit/', update_table),
    path("<int:restaurant_id>/tables/", RestaurantTableListView.as_view(), name="restaurant-tables"),
    # path('api/bookings/', views.create_booking, name='create-booking'),
    
    path('admin/reservation-analytics/month/', views.reservation_analytics_month, name='reservation_analytics_month'),

    path("", include(router.urls)),
]


