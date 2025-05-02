from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Restaurant, OperatingHours
from .serializers import RestaurantSerializer, OperatingHoursSerializer
from django.shortcuts import render, get_object_or_404
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Q, Count
from django.db.models.functions import Lower, Trim
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin, IsBusinessOwner
from .services import fetch_google_places, normalize_google_place_result, fetch_google_place_details
from .serializers import RestaurantSerializer, RestaurantDetailSerializer, RestaurantListingSerializer
from .models import Restaurant, RestaurantPhoto, CuisineType, FoodType
from .utils import upload_to_s3, delete_s3_object, generate_thumbnail


# View for searching restaurants using search bar
class RestaurantSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('query', '').strip()
        zip_code = request.query_params.get('zip_code', '').strip()
        cuisine_type = request.query_params.get('cuisine_type', '').strip()
        food_type = request.query_params.get('food_type', '').strip()
        price_range = request.query_params.get('price_range', '').strip()
        min_rating = request.query_params.get('min_rating', '')
        max_rating = request.query_params.get('max_rating', '')
        booking_date = request.query_params.get('booking_date', '')
        booking_time = request.query_params.get('booking_time', '')

        # Fetch restaurants from database
        queryset = Restaurant.objects.filter()

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(cuisine_type__name__icontains=query) |
                Q(food_type__name__icontains=query)
            ).distinct()
        if zip_code:
            queryset = queryset.filter(zip_code=zip_code)
        if cuisine_type:
            cuisine_type_ids = [int(c) for c in cuisine_type.split(",")]
            queryset = queryset.filter(cuisine_type__id__in=cuisine_type_ids).distinct()
        if food_type and any(food_type):
            food_type_ids = [int(c) for c in food_type.split(",")]
            queryset = queryset.filter(food_type__id__in=food_type_ids).distinct()
        if price_range:
            queryset = queryset.filter(price_range=price_range)
        if min_rating and max_rating:
            try:
                min_rating_value = float(min_rating)
                max_rating_value = float(max_rating)
                queryset = queryset.filter(rating__gte=min_rating_value, rating__lte=max_rating_value)
            except ValueError:
                return Response({"error": "Invalid rating range"}, status=status.HTTP_400_BAD_REQUEST)

        # Filter by booking date and time
        if booking_date and booking_time:
            try:
                from datetime import datetime
                booking_datetime = datetime.strptime(booking_date, '%Y-%m-%d')
                day_of_week = booking_datetime.weekday()  # 0 = Monday, 6 = Sunday
                
                booking_time_obj = datetime.strptime(booking_time, '%H:%M').time()
                
                # Get restaurant IDs that are open at the requested day and time
                open_restaurant_ids = []
                for restaurant in queryset:
                    try:
                        hours = OperatingHours.objects.get(
                            restaurant_id=restaurant.id, 
                            day_of_week=day_of_week,
                            is_closed=False
                        )
                        
                        if hours.opening_time <= booking_time_obj <= hours.closing_time:
                            open_restaurant_ids.append(restaurant.id)
                    except OperatingHours.DoesNotExist:
                        # If no hours found, keep the restaurant in results
                        # (assuming it's using the old hours_of_operation field)
                        open_restaurant_ids.append(restaurant.id)
                
                if open_restaurant_ids:
                    queryset = queryset.filter(id__in=open_restaurant_ids)
            except (ValueError, TypeError) as e:
                print(f"Error processing booking date/time: {e}")
                # Continue with existing results if date/time format is invalid

        db_results = RestaurantSerializer(queryset, many=True).data

        # Fetch restaurants from Google Places if zip_code is provided
        google_results = []
        if zip_code:
            google_places = fetch_google_places(zip_code)
            google_results = [normalize_google_place_result(place) for place in google_places]

        # Combine database results and Google Places results
        combined_results = db_results + google_results

        return Response(combined_results, status=status.HTTP_200_OK)

# View for listing restaurants in DB
class RestaurantListView(ListAPIView):
    serializer_class = RestaurantSerializer

    def get_queryset(self):
        queryset = Restaurant.objects.all()

        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        cuisine = self.request.query_params.get('cuisine', None)
        food_type = self.request.query_params.get('food_type', None)
        price_range = self.request.query_params.get('price_range', None)
        min_rating = self.request.query_params.get('min_rating', '')
        max_rating = self.request.query_params.get('max_rating', '')

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(cuisine_type__icontains=search))
        if category:
            queryset = queryset.filter(cuisine_type__icontains=category)
        if cuisine:
            queryset = queryset.filter(cuisine_type__icontains=cuisine)
        if food_type:
            queryset = queryset.filter(food_type__icontains=food_type)
        if price_range:
            queryset = queryset.filter(price_range__icontains=price_range)
        if min_rating and max_rating:
            try:
                min_rating_value = float(min_rating)
                max_rating_value = float(max_rating)
                queryset = queryset.filter(rating__gte=min_rating_value, rating__lte=max_rating_value)
            except ValueError:
                pass

        queryset = queryset.order_by('-rating')

        return queryset

# view for restaurant details page
class RestaurantDetailView(APIView):
    def get(self, request, *args, **kwargs):
        restaurant_id = kwargs.get('id')  
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
            serializer = RestaurantDetailSerializer(restaurant)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)
        
    def put(self, request, *args, **kwargs):
        restaurant_id = kwargs.get('id') 
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
            
            if restaurant.owner != request.user:
                return Response({"error": "You are not authorized to edit this restaurant."}, status=status.HTTP_403_FORBIDDEN)

            serializer = RestaurantDetailSerializer(restaurant, data=request.data, partial=True)  # Use `partial=True` to allow partial updates
            if serializer.is_valid():
                serializer.save()
                photos = request.FILES.getlist('photos')
                for photo in photos:
                    photo_key = upload_to_s3(photo)
                    thumbnail_file = generate_thumbnail(photo)
                    thumbnail_key = "thumbnail/" + photo_key
                    upload_to_s3(thumbnail_file, thumbnail_key)
                    RestaurantPhoto.objects.create(restaurant=restaurant, photo_key=photo_key, thumbnail_s3_key = thumbnail_key)

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)

# view for duplicate listing        
class DuplicateListingsView(APIView):
    def get(self, request):
        duplicates = Restaurant.objects.annotate(
            normalized_name=Lower(Trim('name')),
            normalized_address=Lower(Trim('address')),
            normalized_city=Lower(Trim('city')),
            normalized_state=Lower(Trim('state')),
            normalized_zip_code=Lower(Trim('zip_code'))
        ).values(
            'normalized_name', 'normalized_address', 'normalized_city', 'normalized_state', 'normalized_zip_code'
        ).annotate(count=Count('id')).filter(count__gt=1)

        duplicate_listings = []
        for duplicate in duplicates:
            listings = Restaurant.objects.filter(
                name__iexact=duplicate['normalized_name'],
                address__iexact=duplicate['normalized_address'],
                city__iexact=duplicate['normalized_city'],
                state__iexact=duplicate['normalized_state'],
                zip_code__iexact=duplicate['normalized_zip_code']
            )
            duplicate_listings.extend(RestaurantSerializer(listings, many=True).data)

        return Response(duplicate_listings, status=status.HTTP_200_OK)
    
class DeleteDuplicateListingView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, id):
        # Debugging token and user
        print(f"Authorization Header: {request.headers.get('Authorization', 'None')}")
        print(f"Authenticated User: {request.user}")
        
        if not request.user.is_authenticated:
            return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        restaurant = get_object_or_404(Restaurant, id=id)
        restaurant.delete()
        return Response({"message": f"Listing with ID {id} has been deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    
class AddListingView(APIView):
    permission_classes = [IsBusinessOwner]

    def post(self, request, *args, **kwargs):
        cuisine_type_input = request.data.get('cuisine_type', [])
        food_type_input = request.data.get('food_type', [])

        try:
            # convert id of cuisine type to name
            if isinstance(cuisine_type_input[0], int):
                cuisine_names = list(CuisineType.objects.filter(id__in=cuisine_type_input).values_list('name', flat=True))
            else:
                cuisine_names = cuisine_type_input
            # convert id of food type to name
            if isinstance(food_type_input[0], int):
                food_names = list(FoodType.objects.filter(id__in=food_type_input).values_list('name', flat=True))
            else:
                food_names = food_type_input
        except Exception as e:
            return Response({"error": f"Error processing cuisine_type or food_type: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        request.data['cuisine_type'] = cuisine_names
        request.data['food_type'] = food_names

        serializer = RestaurantSerializer(data=request.data)
        if serializer.is_valid():
            restaurant = serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # error debugging
        print("Validation Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class OldListingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        print(f"Authenticated User: {request.user}")  # Log the user
        print(f"User Role: {request.user.role}") 
        print(f"Authorization Header: {request.headers.get('Authorization', 'None')}")
        if not request.user.is_authenticated:
            return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # cutoff is at six months
        six_months_ago = now() - timedelta(days=180)

        # Query for listings with no reviews and created over 6 months ago
        old_listings = Restaurant.objects.filter(
            review_count=0,
            created_at__lt=six_months_ago
        )

        serializer = RestaurantSerializer(old_listings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, id):
        try:
            listing = Restaurant.objects.get(id=id, review_count=0, created_at__lt=now() - timedelta(days=180))
            listing.delete()
            return Response({"message": f"Listing with ID {id} has been deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Restaurant.DoesNotExist:
            return Response({"error": "Listing not found or does not meet deletion criteria."}, status=status.HTTP_404_NOT_FOUND)

class AddRestaurantListingView(APIView):
    permission_classes = [IsBusinessOwner]

    def post(self, request):
        print(f"Authenticated User: {request.user}")  # Log the user
        print(f"Request Auth: {request.auth}")  # Log the token or authentication details

        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=401)

        serializer = RestaurantSerializer(data=request.data, context={'request': request})
        print(request.FILES.getlist('photos'))
        print(f"Data in POST request: {request.data}")
        if serializer.is_valid():
            restaurant = serializer.save()
            photos = request.FILES.getlist('photos')  # Expecting multiple photos
            print(f"len of files {len(photos)}")
            print(f"files : {request.FILES}")
            for photo in photos:    
                photo_key = upload_to_s3(photo)
                thumbnail_file = generate_thumbnail(photo)
                thumbnail_key = "thumbnail/" + photo_key
                upload_to_s3(thumbnail_file, thumbnail_key)
                RestaurantPhoto.objects.create(restaurant=restaurant, photo_key=photo_key, thumbnail_s3_key = thumbnail_key)


            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class UpdateRestaurantListingView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            listing = Restaurant.objects.get(pk=pk, owner=request.user)
        except Restaurant.DoesNotExist:
            return Response({"error": "Listing not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RestaurantSerializer(listing, data=request.data, partial=True)
        if serializer.is_valid():
            listing = serializer.save()
            photos = request.FILES.getlist('photos')
            for photo in photos:
                photo_key = upload_to_s3(photo)
                thumbnail_file = generate_thumbnail(photo)
                thumbnail_key = "thumbnail/" + photo_key
                upload_to_s3(thumbnail_file, thumbnail_key)
                RestaurantPhoto.objects.create(restaurant=listing, photo_key=photo_key, thumbnail_s3_key = thumbnail_key)


            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OwnerRestaurantListingsView(APIView):
    permission_classes = [IsBusinessOwner]

    def get(self, request):
        if request.user.role != 'owner':
            return Response({"error": "Only business owners can view listings."}, status=status.HTTP_403_FORBIDDEN)

        listings = Restaurant.objects.filter(owner=request.user)
        serializer = RestaurantListingSerializer(listings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OperatingHoursViewSet(viewsets.ModelViewSet):
    queryset = OperatingHours.objects.all()
    serializer_class = OperatingHoursSerializer
    
    def get_queryset(self):
        queryset = OperatingHours.objects.all()
        restaurant_id = self.request.query_params.get('restaurant_id', None)
        if restaurant_id is not None:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        return queryset

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    
    @action(detail=True, methods=['get'])
    def operating_hours(self, request, pk=None):
        restaurant = self.get_object()
        hours = OperatingHours.objects.filter(restaurant=restaurant)
        serializer = OperatingHoursSerializer(hours, many=True)
        return Response(serializer.data)
    

class DeletePhotoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, photo_id):
        """
        Deletes a specific photo for a restaurant from S3 and database.
        """
        try:
            # Fetch the photo record
            photo = RestaurantPhoto.objects.get(id=photo_id)

            # Check ownership: ensure the photo belongs to a restaurant owned by the user
            if photo.restaurant.owner != request.user:
                return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            # Delete the photo from S3
            # print(photo.photo_key)
            if delete_s3_object(photo.photo_key):
                # If S3 deletion is successful, delete the record from the database
                photo.delete()
                return Response({"message": "Photo deleted successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Failed to delete photo from S3."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



        except RestaurantPhoto.DoesNotExist:
            return Response({"error": "Photo not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadPhotoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, restaurant_id):
        """
        Upload photos for a restaurant.
        """
        try:
            # Fetch the restaurant object to ensure the user owns it
            restaurant = Restaurant.objects.get(id=restaurant_id)

            if restaurant.owner != request.user:
                return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            # Check if the file is in the request
            if 'photos' not in request.FILES:
                return Response({"error": "No photos provided."}, status=status.HTTP_400_BAD_REQUEST)

            photos = request.FILES.getlist('photos')
            for photo in photos:
                photo_key = upload_to_s3(photo)
                print("resetting buffer")
                thumbnail_file = generate_thumbnail(photo)
                thumbnail_key = "thumbnail/" + photo_key
                upload_to_s3(thumbnail_file, thumbnail_key)
                RestaurantPhoto.objects.create(restaurant=restaurant, photo_key=photo_key, thumbnail_s3_key = thumbnail_key)


            return Response({"message": "Photos uploaded successfully.", "status": "uploaded"}, status=status.HTTP_201_CREATED)

        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PhotoDetailView(APIView):
    def get(self, request, photo_id):
        try:
            photo = RestaurantPhoto.objects.get(id=photo_id)
            full_resolution_url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{photo.s3_key}"
            return Response({"photo_url": full_resolution_url}, status=status.HTTP_200_OK)
        except RestaurantPhoto.DoesNotExist:
            return Response({"error": "Photo not found."}, status=status.HTTP_404_NOT_FOUND)

class GooglePlaceDetailView(APIView):
    def get(self, request, *args, **kwargs):
        place_id = kwargs.get('place_id')
        if not place_id:
            return Response({"error": "Missing place_id parameter."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch details from Google Places
        details = fetch_google_place_details(place_id)
        if not details:
            return Response({"error": "Could not fetch details for the provided place_id."}, status=status.HTTP_404_NOT_FOUND)

        return Response(details, status=status.HTTP_200_OK)