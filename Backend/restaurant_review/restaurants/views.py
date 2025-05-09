# views.py
# ---------------------------------------------------------------------
#  Imports
# ---------------------------------------------------------------------
import logging

logger = logging.getLogger(__name__)
from django.conf import settings
from django.utils.timezone import localdate
from datetime import datetime, timedelta, date as dt_date, time as dt_time
from collections import defaultdict
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q, Count, Avg
from django.db.models.functions import Lower, Trim
from django.shortcuts import get_object_or_404
from django.utils import timezone

from django.http import JsonResponse
from django.db.models import Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Restaurant, Booking, Table

from rest_framework import status, permissions
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# views.py
import json

from accounts.permissions import IsAdmin, IsBusinessOwner
from .models import (
    Restaurant,
    RestaurantPhoto,
    CuisineType,
    FoodType,
    Table,
    Booking,
)
from .serializers import (
    RestaurantSerializer,
    RestaurantDetailSerializer,
    RestaurantListingSerializer,
    BookingSerializer,
    TableSerializer, 
)
from .services import (
    fetch_google_places,
    normalize_google_place_result,
    fetch_google_place_details,
)
from .utils import upload_to_s3, delete_s3_object, generate_thumbnail

# ---------------------------------------------------------------------
#  Search & list views
# ---------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reservation_analytics_month(request):
    """
    Returns analytics about restaurant reservations for the last month
    """
    # Calculate date range (last 30 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    # Get all restaurants with bookings in the last month
    restaurants = Restaurant.objects.filter(
        bookings__created_at__gte=start_date,
        bookings__created_at__lte=end_date
    ).distinct()
    
    analytics = []
    
    for restaurant in restaurants:
        # Get bookings for this restaurant
        bookings = Booking.objects.filter(
            restaurant=restaurant,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Basic stats
        reservation_count = bookings.count()
        avg_party_size = bookings.aggregate(avg=Avg('num_people'))['avg'] or 2.0
        
        # Calculate cancellation rate
        cancelled = bookings.filter(status='CANCELLED').count()
        cancellation_rate = cancelled / reservation_count if reservation_count > 0 else 0
        
        # Find most popular day and time (simplified calculation)
        day_counts = {}
        time_counts = {}
        for booking in bookings:
            day_name = booking.date.strftime('%A')
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
            
            time_str = booking.time.strftime('%I %p')
            time_counts[time_str] = time_counts.get(time_str, 0) + 1
        
        popular_day = max(day_counts.items(), key=lambda x: x[1])[0] if day_counts else "Friday"
        popular_time = max(time_counts.items(), key=lambda x: x[1])[0] if time_counts else "7 PM"
        
        analytics.append({
            'restaurant_name': restaurant.name,
            'reservation_count': reservation_count,
            'avg_party_size': round(avg_party_size, 1),
            'popular_time': popular_time,
            'day_of_week': popular_day,
            'cancellation_rate': round(cancellation_rate, 2)
        })
    
    # Sort by reservation count (highest first)
    analytics = sorted(analytics, key=lambda x: x['reservation_count'], reverse=True)
    
    return JsonResponse(analytics, safe=False)

class RestaurantTableListView(APIView):
    """
    GET /api/<restaurant_id>/tables/
    → [{id, size, available_times}, …]
    """
    def get(self, request, restaurant_id):
        try:
            restaurant = Restaurant.objects.get(pk=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)

        tables = Table.objects.filter(restaurant=restaurant)
        return Response(TableSerializer(tables, many=True).data, status=200)
class RestaurantSearchView(APIView):
    """
    /api/restaurants/search/?query=&zip_code=&cuisine_type=&food_type=&price_range=&min_rating=&max_rating=
    """
    def get(self, request):
        try:
            date_str     = request.query_params["date"]       # yyyy-mm-dd
            time_str     = request.query_params["time"]       # hh:mm
            num_people   = int(request.query_params["num_people"])
        except (KeyError, ValueError):
            return Response(
                {"error": "date, time and num_people are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requested = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        low  = (requested - timedelta(minutes=30)).time()
        high = (requested + timedelta(minutes=30)).time()

        # ───────────── 2. optional location filters ─────────────
        city_state = request.query_params.get("city_state", "").strip()
        zip_code   = request.query_params.get("zip_code", "").strip()

        qs = Restaurant.objects.all()
        if city_state:
            qs = qs.filter(Q(city__icontains=city_state) | Q(state__icontains=city_state))
        if zip_code:
            qs = qs.filter(zip_code=zip_code)

        # ───────────── 3. build availability results ─────────────
        grouped = defaultdict(lambda: {
            "restaurant_id": None,
            "name":          "",
            "address":       "",
            "rating":        0,
            "tables":        [],
            "bookings_today": 0,
        })

        for rest in qs:
            for table in Table.objects.filter(restaurant=rest, size__gte=num_people):
                # keep only start‑times inside the ±30 min window
                slots = [
                    t for t in table.available_times
                    if low <= datetime.strptime(t, "%H:%M").time() <= high
                ]
                if not slots:
                    continue

                entry = grouped[rest.id]
                # fill the restaurant‑level fields once
                if entry["restaurant_id"] is None:
                    entry.update(
                        restaurant_id = rest.id,
                        name          = rest.name,
                        address       = rest.address,
                        rating        = rest.rating,
                    )
                bookings_today = Booking.objects.filter(
                    restaurant=rest,
                    date=localdate()
                ).count()
                entry["bookings_today"] = bookings_today
                # append this table’s data
                entry["tables"].append({
                    "id":    table.id,
                    "size":  table.size,
                    "times": sorted(slots),
                })

        # convert dict → list and send
        payload = list(grouped.values())
        return Response(payload, status=status.HTTP_200_OK)



class RestaurantListView(ListAPIView):
    serializer_class = RestaurantSerializer

    def get_queryset(self):
        qs          = Restaurant.objects.all()
        search      = self.request.query_params.get("search")
        cuisine     = self.request.query_params.get("cuisine")
        food_type   = self.request.query_params.get("food_type")
        price_range = self.request.query_params.get("price_range")
        min_rating  = self.request.query_params.get("min_rating", "")
        max_rating  = self.request.query_params.get("max_rating", "")

        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(cuisine_type__name__icontains=search)
                | Q(food_type__name__icontains=search)
            ).distinct()

        if cuisine:
            qs = qs.filter(cuisine_type__name__icontains=cuisine)

        if food_type:
            qs = qs.filter(food_type__name__icontains=food_type)

        if price_range:
            qs = qs.filter(price_range=price_range)

        if min_rating and max_rating:
            try:
                qs = qs.filter(
                    rating__gte=float(min_rating), rating__lte=float(max_rating)
                )
            except ValueError:
                pass

        return qs.order_by("-rating")


# ---------------------------------------------------------------------
#  Restaurant detail & CRUD
# ---------------------------------------------------------------------

class RestaurantDetailView(APIView):
    
    def get(self, request, id):
        restaurant = get_object_or_404(Restaurant, id=id)
        bookings_today = Booking.objects.filter(
            restaurant=restaurant,
            date=localdate()
        ).count()
        data = RestaurantSerializer(restaurant).data
        data["bookings_today"] = bookings_today
        return Response(data, status=status.HTTP_200_OK)
        

    def put(self, request, id):
        restaurant = get_object_or_404(Restaurant, id=id)

        if restaurant.owner != request.user:
            return Response(
                {"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = RestaurantDetailSerializer(
            restaurant, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        restaurant = serializer.save()

        # handle photo uploads
        for photo in request.FILES.getlist("photos"):
            key = upload_to_s3(photo)
            thumb = generate_thumbnail(photo)
            thumb_key = f"thumbnail/{key}"
            upload_to_s3(thumb, thumb_key)
            RestaurantPhoto.objects.create(
                restaurant=restaurant, photo_key=key, thumbnail_s3_key=thumb_key
            )
        if "tables" in request.data:
            try:
                tables_data = json.loads(request.data["tables"])
            except json.JSONDecodeError:
                return Response({"error": "Invalid table format"}, status=400)

            for tbl in tables_data:
                try:
                    table = Table.objects.get(id=tbl["id"], restaurant=restaurant)
                    table.size = tbl.get("size", table.size)
                    table.available_times = tbl.get("available_times", table.available_times)
                    table.save()
                except Table.DoesNotExist:
                    continue  # skip or handle as needed


        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------
#  Duplicate detection / admin cleanup
# ---------------------------------------------------------------------

class DuplicateListingsView(APIView):
    def get(self, _request):
        duplicates = (
            Restaurant.objects.annotate(
                n_name=Lower(Trim("name")),
                n_addr=Lower(Trim("address")),
                n_city=Lower(Trim("city")),
                n_state=Lower(Trim("state")),
                n_zip=Lower(Trim("zip_code")),
            )
            .values("n_name", "n_addr", "n_city", "n_state", "n_zip")
            .annotate(cnt=Count("id"))
            .filter(cnt__gt=1)
        )

        listings = []
        for dup in duplicates:
            listings.extend(
                RestaurantSerializer(
                    Restaurant.objects.filter(
                        name__iexact=dup["n_name"],
                        address__iexact=dup["n_addr"],
                        city__iexact=dup["n_city"],
                        state__iexact=dup["n_state"],
                        zip_code__iexact=dup["n_zip"],
                    ),
                    many=True,
                ).data
            )
        return Response(listings, status=status.HTTP_200_OK)


class DeleteDuplicateListingView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, _request, id):
        restaurant = get_object_or_404(Restaurant, id=id)
        restaurant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------
#  Business-owner listing endpoints
# ---------------------------------------------------------------------

class AddListingView(APIView):
    

    

    permission_classes = [IsBusinessOwner]
    

    def post(self, request):
        data = request.data.copy()

        # Parse and convert tables JSON
        if "tables" in data:
            try:
                data["tables"] = json.loads(data["tables"])
            except json.JSONDecodeError:
                return Response({"error": "Malformed tables payload"}, status=400)
        else:
            data["tables"] = []

        # Get cuisine and food types as names
        # Use IDs as-is; the serializer should handle them
        data.setlist("cuisine_type", request.data.getlist("cuisine_type"))
        data.setlist("food_type", request.data.getlist("food_type"))

        # data["cuisine_type"] = list(
        #     CuisineType.objects.filter(id__in=request.data.getlist("cuisine_type")).values_list("name", flat=True)
            # CuisineType.objects.filter(name__in=request.data.getlist("cuisine_type"))

        # )
        # data["food_type"] = list(
        #     FoodType.objects.filter(id__in=request.data.getlist("food_type")).values_list("name", flat=True)
            
            # FoodType.objects.filter(name__in=request.data.getlist("food_type"))

        # )

        # Serialize restaurant
        serializer = RestaurantSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        restaurant = serializer.save(owner=request.user)

        # Create Table entries
        for table_data in data["tables"]:
            Table.objects.create(
                restaurant=restaurant,
                size=table_data["size"],
                available_times=table_data.get("available_times", [])
            )

        return Response(serializer.data, status=201)

    # def post(self, request):
    #     data = request.data.copy()
    #     data["cuisine_type"] = list(
    #         CuisineType.objects.filter(id__in=data.getlist("cuisine_type")).values_list(
    #             "name", flat=True
    #         )
    #     )
    #     data["food_type"] = list(
    #         FoodType.objects.filter(id__in=data.getlist("food_type")).values_list(
    #             "name", flat=True
    #         )
    #     )

    #     serializer = RestaurantSerializer(data=data, context={"request": request})
    #     if not serializer.is_valid():
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #     restaurant = serializer.save(owner=request.user)
    #     return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # def post(self, request):
    #     data = request.data.copy()

    #     # ▶️ tables arrives as a JSON string in multipart/form‑data
    #     if "tables" in data:
    #         try:
    #             data["tables"] = json.loads(data["tables"])
    #         except json.JSONDecodeError:
    #             return Response(
    #                 {"error": "Malformed tables payload"},
    #                 status=status.HTTP_400_BAD_REQUEST,
    #             )

    #     serializer = RestaurantSerializer(data=data, context={"request": request})
    #     if serializer.is_valid():
    #         serializer.save(owner=request.user)
    #         return Response(serializer.data, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OldListingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, _request):
        cutoff = timezone.now() - timedelta(days=180)
        old = Restaurant.objects.filter(review_count=0, created_at__lt=cutoff)
        return Response(
            RestaurantSerializer(old, many=True).data, status=status.HTTP_200_OK
        )

    def delete(self, _request, id):
        cutoff = timezone.now() - timedelta(days=180)
        listing = get_object_or_404(Restaurant, id=id, review_count=0, created_at__lt=cutoff)
        listing.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OwnerRestaurantListingsView(APIView):
    permission_classes = [IsBusinessOwner]

    def get(self, request):
        listings = Restaurant.objects.filter(owner=request.user)
        return Response(
            RestaurantListingSerializer(listings, many=True).data,
            status=status.HTTP_200_OK,
        )


class UpdateRestaurantListingView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        listing = get_object_or_404(Restaurant, pk=pk, owner=request.user)
        serializer = RestaurantSerializer(listing, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        listing = serializer.save()

        for photo in request.FILES.getlist("photos"):
            key = upload_to_s3(photo)
            thumb = generate_thumbnail(photo)
            thumb_key = f"thumbnail/{key}"
            upload_to_s3(thumb, thumb_key)
            RestaurantPhoto.objects.create(
                restaurant=listing, photo_key=key, thumbnail_s3_key=thumb_key
            )

        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------
#  Photo management
# ---------------------------------------------------------------------

class DeletePhotoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, photo_id):
        photo = get_object_or_404(RestaurantPhoto, id=photo_id)

        if photo.restaurant.owner != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        if delete_s3_object(photo.photo_key):
            photo.delete()
            return Response(status=status.HTTP_200_OK)

        return Response(
            {"error": "Failed to delete from S3"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class UploadPhotoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)

        if restaurant.owner != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        for photo in request.FILES.getlist("photos"):
            key = upload_to_s3(photo)
            thumb = generate_thumbnail(photo)
            thumb_key = f"thumbnail/{key}"
            upload_to_s3(thumb, thumb_key)
            RestaurantPhoto.objects.create(
                restaurant=restaurant, photo_key=key, thumbnail_s3_key=thumb_key
            )

        return Response(status=status.HTTP_201_CREATED)


class PhotoDetailView(APIView):
    def get(self, _request, photo_id):
        photo = get_object_or_404(RestaurantPhoto, id=photo_id)
        url = (
            f"https://{settings.AWS_S3_BUCKET_NAME}.s3."
            f"{settings.AWS_REGION}.amazonaws.com/{photo.photo_key}"
        )
        return Response({"photo_url": url}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------
#  Google Places passthrough
# ---------------------------------------------------------------------

class GooglePlaceDetailView(APIView):
    def get(self, _request, place_id):
        details = fetch_google_place_details(place_id)
        if not details:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(details, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------
#  Booking
# ---------------------------------------------------------------------

class BookTableAPIView(APIView):
    permission_classes = [IsAuthenticated]

# #     @api_view(["POST"])
# # @permission_classes([IsAuthenticated])
#     def cancel_booking(request, booking_id):
#         booking = get_object_or_404(Booking, id=booking_id, user=request.user)
#         booking.status = Booking.Status.CANCELLED
#         booking.save()
#         return Response({"message": "Booking cancelled."}, status=200)

    @transaction.atomic
    def post(self, request):
        user = request.user
        data = request.data

        # ----- Parse inputs ----------------------------------------------------------
        try:
            date_obj = dt_date.fromisoformat(data["date"])
            time_obj = dt_time.fromisoformat(data["time"])
            num_people = int(data["num_people"])
            restaurant_id = int(data["restaurant_id"])
            table_id = int(data["table_id"])
        except (KeyError, ValueError):
            return Response(
                {"error": "Invalid or missing parameters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if date_obj < timezone.localdate() or (
            date_obj == timezone.localdate() and time_obj <= timezone.localtime().time()
        ):
            return Response(
                {"error": "Cannot book in the past."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----- Fetch table with row-level lock --------------------------------------
        try:
            table = (
                Table.objects.select_for_update()
                .get(id=table_id, restaurant_id=restaurant_id)
            )
        except Table.DoesNotExist:
            return Response(
                {"error": "Table / restaurant mismatch."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if num_people > table.size:
            return Response(
                {"error": "Table seats fewer than requested party."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----- Optional: enforce available_times ±30 minutes ------------------------
        if table.available_times:
            req_minutes = time_obj.hour * 60 + time_obj.minute
            within_window = any(
                abs(
                    req_minutes
                    - (
                        datetime.strptime(t, "%H:%M").hour * 60
                        + datetime.strptime(t, "%H:%M").minute
                    )
                )
                <= 30
                for t in table.available_times
            )
            if not within_window:
                return Response(
                    {"error": "Requested time outside allowed slots."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ----- Double-booking check --------------------------------------------------
        if Booking.objects.filter(
            table=table,
            date=date_obj,
            time=time_obj,
            status=Booking.Status.BOOKED,
        ).exists():
            return Response(
                {"error": "Table already booked at that time."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----- Create booking --------------------------------------------------------
        booking = Booking.objects.create(
            user=user,
            restaurant_id=restaurant_id,
            table=table,
            date=date_obj,
            time=time_obj,
            num_people=num_people,
        )

        # ----- Confirmation e-mail ---------------------------------------------------
        try:
            print("Attempting to send email to:", user.email)
            send_mail(
                'Booking Confirmation',
                (
                    f"Hi {user.first_name or user.username},\n\n"
                    f"Your table for {num_people} at {booking.restaurant.name} "
                    f"on {date_obj:%B %d, %Y} at {time_obj:%H:%M} is confirmed."
                ),
                "noreply@restaurantapp.com",
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Email send failed: %s", e)  # logs to console or file
            print("Email send failed:", e) 
            
            print("Email user:", settings.EMAIL_HOST_USER)


        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

class CancelBookingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        restaurant_id = data.get("restaurant_id")
        table_id = data.get("table_id")
        date = data.get("date")
        time = data.get("time")

        booking = Booking.objects.filter(
            user=user,
            restaurant_id=restaurant_id,
            table_id=table_id,
            date=date,
            time=time,
            status=Booking.Status.BOOKED,
        ).first()

        if not booking:
            return Response({"error": "Booking not found."}, status=404)

        booking.status = Booking.Status.CANCELLED
        booking.save()
        return Response({"message": "Booking cancelled."})