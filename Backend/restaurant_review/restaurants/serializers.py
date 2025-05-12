from django.conf import settings
from django.utils import timezone
from django.db.models import Avg
from rest_framework import serializers


from .models import (
    Restaurant,
    CuisineType,
    FoodType,
    RestaurantPhoto,
    Table,
    Booking,
)
from reviews.models import Review

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Table
        fields = ["id", "size", "available_times"]

class TablePayloadSerializer(serializers.Serializer):
    size = serializers.IntegerField(min_value=1)
    available_times = serializers.ListField(
        child=serializers.CharField(), min_length=1
    )

# ------------------------------------------------------------------
#  Photo
# ------------------------------------------------------------------
class RestaurantPhotoSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    high_res_url  = serializers.SerializerMethodField()

    class Meta:
        model  = RestaurantPhoto
        fields = ["id", "thumbnail_url", "high_res_url", "uploaded_at"]

    # ↓ Presigned or public URLs for S3 objects
    def get_thumbnail_url(self, obj):
        return (
            f"https://{settings.AWS_S3_BUCKET_NAME}.s3."
            f"{settings.AWS_REGION}.amazonaws.com/{obj.thumbnail_s3_key}"
        )

    def get_high_res_url(self, obj):
        return (
            f"https://{settings.AWS_S3_BUCKET_NAME}.s3."
            f"{settings.AWS_REGION}.amazonaws.com/{obj.photo_key}"
        )


# ------------------------------------------------------------------
#  Restaurant (CRUD / List)
# ------------------------------------------------------------------
class RestaurantSerializer(serializers.ModelSerializer):
    photos        = RestaurantPhotoSerializer(many=True, read_only=True)
    owner         = serializers.HiddenField(default=serializers.CurrentUserDefault())
    cuisine_type  = serializers.PrimaryKeyRelatedField(
        many=True, queryset=CuisineType.objects.all()
    )
    food_type     = serializers.PrimaryKeyRelatedField(
        many=True, queryset=FoodType.objects.all()
    )
    review_count  = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    tables = TablePayloadSerializer(many=True, write_only=True, required=False)
    class Meta:
        # 1️⃣  Read-only fields
        
        model  = Restaurant
        fields = [
            "id",
            "name",
            "address",
            "city",
            "state",
            "zip_code",
            "price_range",
            "rating",
            "hours_of_operation",
            "website",
            "phone_number",
            "owner",
            "cuisine_type",
            "food_type",
            "description",
            "review_count",
            "average_rating",
            "photos",
            "tables",
        ]
        read_only_fields = ["id"]

    def get_review_count(self, obj):
        return Review.objects.filter(restaurant=obj).count()

    def get_average_rating(self, obj):
        avg = (
            Review.objects.filter(restaurant=obj)
            .aggregate(Avg("rating"))
            .get("rating__avg")
        )
        return round(avg, 1) if avg else None
    
    # tables = TablePayloadSerializer(many=True, write_only=True, required=False)
        

    def create(self, validated_data):
        tables_payload = validated_data.pop("tables", [])
        restaurant = super().create(validated_data)

        # Build Table rows
        for t in tables_payload:
            Table.objects.create(
                restaurant=restaurant,
                size=t["size"],
                available_times=t["available_times"],
            )
        return restaurant



# ------------------------------------------------------------------
#  Restaurant Detail (read-only)
# ------------------------------------------------------------------
class RestaurantDetailSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField()
    photos  = RestaurantPhotoSerializer(many=True, read_only=True)

    class Meta:
        model  = Restaurant
        fields = [
            "id",
            "name",
            "cuisine_type",
            "food_type",
            "price_range",
            "rating",
            "address",
            "city",
            "state",
            "zip_code",
            "hours_of_operation",
            "website",
            "phone_number",
            "latitude",
            "longitude",
            "description",
            "photos",
            "reviews",
        ]

    def get_reviews(self, obj):
        return [
            {
                "reviewer": r.user.username,
                "comment":  r.review_text,
                "rating":   r.rating,
            }
            for r in Review.objects.filter(restaurant=obj)
        ]


# ------------------------------------------------------------------
#  Lightweight listing for search results
# ------------------------------------------------------------------
class RestaurantListingSerializer(serializers.ModelSerializer):
    photos = RestaurantPhotoSerializer(many=True, read_only=True)

    class Meta:
        model  = Restaurant
        fields = [
            "id",
            "name",
            "city",
            "state",
            "price_range",
            "rating",
            "cuisine_type",
            "food_type",
            "photos",
        ]
        read_only_fields = fields


# ------------------------------------------------------------------
#  Booking
# ------------------------------------------------------------------
class BookingSerializer(serializers.ModelSerializer):
    # Convenience read-only fields so the UI doesn’t need extra calls
    restaurant_name = serializers.ReadOnlyField(source="restaurant.name")
    table_size      = serializers.ReadOnlyField(source="table.size")

    class Meta:
        model  = Booking
        fields = [
            "id",
            "restaurant",
            "restaurant_name",
            "table",
            "table_size",
            "date",
            "time",
            "num_people",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
            "restaurant_name",
            "table_size",
        ]

    # ------------------------------------------------------------------
    #  Field-level and object-level validation
    # ------------------------------------------------------------------
    def validate_num_people(self, value):
        if value < 1:
            raise serializers.ValidationError("Party size must be at least 1.")
        return value

    def validate(self, attrs):
        """Cross-field checks before object is created."""
        table  = attrs["table"]
        date   = attrs["date"]
        time   = attrs["time"]
        people = attrs["num_people"]

        # 1️⃣  Capacity check
        if people > table.size:
            raise serializers.ValidationError(
                f"Table seats {table.size}, but {people} requested."
            )

        # 2️⃣  Past-date/time check (optional but recommended)
        if date < timezone.localdate() or (
            date == timezone.localdate() and time <= timezone.localtime().time()
        ):
            raise serializers.ValidationError("Cannot book in the past.")

        # 3️⃣  Table–Restaurant mismatch safety
        if attrs.get("restaurant") and table.restaurant_id != attrs["restaurant"].id:
            raise serializers.ValidationError(
                "This table does not belong to the specified restaurant."
            )

        # 4️⃣  Double-booking guard (duplicates within same table/date/time)
        if Booking.objects.filter(
            table=table, date=date, time=time, status=Booking.Status.BOOKED
        ).exists():
            raise serializers.ValidationError(
                "That table is already booked at the selected time."
            )

        return attrs

    # ------------------------------------------------------------------
    #  Auto-attach the authenticated user & set default status
    # ------------------------------------------------------------------
    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)





