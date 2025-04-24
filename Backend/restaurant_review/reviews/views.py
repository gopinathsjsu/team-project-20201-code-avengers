from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg
from .models import Review
from restaurants.models import Restaurant
from .serializers import ReviewSerializer
from accounts.permissions import IsUser

class SubmitReviewView(APIView):
    permission_classes = [IsUser]

    def post(self, request, restaurant_id):
        print(f"User: {request.user}, Role: {getattr(request.user, 'role', None)}")

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)

        if Review.objects.filter(user=request.user, restaurant=restaurant).exists():
            return Response({"error": "You have already reviewed this restaurant."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, restaurant=restaurant)
            avg_rating = Review.objects.filter(restaurant=restaurant).aggregate(Avg('rating'))['rating__avg']
            restaurant.rating = round(avg_rating, 1)
            restaurant.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetReviewsView(APIView):
    def get(self, request, restaurant_id):
        try:
            reviews = Review.objects.filter(restaurant_id=restaurant_id)
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)