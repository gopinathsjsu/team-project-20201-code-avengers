"""
URL configuration for restaurant_review project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from restaurants.views import DuplicateListingsView, ReservationAnalyticsMonthView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),  
    # path("api/",           include("restaurants.urls")),
    path('api/restaurants/', include('restaurants.urls')),
    path('api/admin/duplicates/', DuplicateListingsView.as_view(), name='admin_duplicate'),
    path('api/admin/reservation-analytics/month/', ReservationAnalyticsMonthView.as_view(), name='reservation_analytics_month'),

    # path('/admin/pending-restaurants/ ', views.reservation_analytics_month, name='pending_restaurants'),

    
    # path('api/admin/delete-listing/<int:id>/', DeleteDuplicateListingView.as_view(), name='delete_listing'),
    # path('api/reviews/', include('reviews.urls')),
    # path('api/admin/old-listings/', OldListingsView.as_view(), name='old-listings'),
    # path('api/admin/delete-old-listing/<int:id>/', OldListingsView.as_view(), name='delete-old-listing'),
]