from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, CustomTokenObtainPairView, OwnerListingsView, AccountDetailsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('owner/listings/', OwnerListingsView.as_view(), name='owner-listings'),
    path('account-details/', AccountDetailsView.as_view(), name='account-detail'),
]