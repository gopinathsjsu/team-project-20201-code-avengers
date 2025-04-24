from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from .serializers import RegisterSerializer, LoginSerializer, AccountSerializer
from .models import CustomUser
from restaurants.models import Restaurant
from restaurants.serializers import RestaurantSerializer
from .permissions import IsAdmin, IsBusinessOwner, IsUser
from django.contrib.auth import authenticate

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        print("Validation Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        print("Email:", email)
        print("Password:", password)

        user = authenticate(username=email, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "role": user.role 
            }, status=status.HTTP_200_OK)

        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):

        print("Incoming data:", attrs) 
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise AuthenticationFailed('Email and password are required.')

        user = authenticate(username=email, password=password)
        if not user:
            raise AuthenticationFailed('Invalid email or password.')

        if not user.is_active:
            raise AuthenticationFailed('User account is disabled.')

        data = super().validate(attrs)
        user = self.user
        data['role'] = user.role
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request):
        return Response({"message": "Welcome, Admin!"})

class BusinessOwnerDashboardView(APIView):
    permission_classes = [IsBusinessOwner]
    def get(self, request):
        return Response({"message": "Welcome, Business Owner!"})

class UserDashboardView(APIView):
    permission_classes = [IsUser]
    def get(self, request):
        return Response({"message": "Welcome, User!"})
    
class OwnerListingsView(APIView):
    permission_classes = [IsBusinessOwner]
    def get(self, request):
        restaurants = Restaurant.objects.filter(owner=request.user)
        serializer = RestaurantSerializer(restaurants, many=True)
        return Response(serializer.data)
    
class AccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = AccountSerializer(request.user)
        return Response(serializer.data)