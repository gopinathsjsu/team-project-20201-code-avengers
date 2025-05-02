from rest_framework import serializers
from .models import Restaurant, OperatingHours
from django.db.models import Avg, Count
from .models import Restaurant, CuisineType, FoodType, RestaurantPhoto
from reviews.models import Review
from django.conf import settings
from accounts.serializers import AccountSerializer


class RestaurantPhotoSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    high_res_url = serializers.SerializerMethodField()
    class Meta:
        model = RestaurantPhoto
        fields = ['id', 'thumbnail_url', 'uploaded_at','high_res_url']
    
    def get_thumbnail_url(self, obj):
        return f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{obj.thumbnail_s3_key}"
        # return f"http://localhost:9004/photos/{obj.thumbnail_s3_key}"
    
    def get_high_res_url(self,obj):
        return f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{obj.photo_key}"


        # return f"http://localhost:9004/photos/{obj.photo_key}"


class OperatingHoursSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = OperatingHours
        fields = ['id', 'day_of_week', 'day_name', 'opening_time', 'closing_time', 'is_closed']

# Update the Restaurant serializer to include operating hours
class RestaurantSerializer(serializers.ModelSerializer):
    operating_hours = OperatingHoursSerializer(many=True, read_only=True)
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'address', 'city', 'state', 'zip_code', 
                  'price_range', 'hours_of_operation', 'operating_hours', 
                  'website', 'phone_number', 'rating', 'review_count', 
                  'latitude', 'longitude', 'description', 'created_at']

class RestaurantDetailSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField()
    photos = RestaurantPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = [
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
            "reviews",
            "description",
            "photos",
        ]

    def get_reviews(self, obj):
        return [
            {
                "reviewer": review.user.username,
                "comment": review.review_text,
                "rating": review.rating,
            }
            for review in obj.reviews.all()
        ]

class RestaurantListingSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')  # Display owner's username
    photos = RestaurantPhotoSerializer(many=True, read_only=True, source='photos')
    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'address', 'city', 'state', 'zip_code', 'cuisine_type', 
            'food_type', 'price_range', 'hours_of_operation', 'website', 'phone_number', 
            'owner', 'photos'
        ]
        read_only_fields = ['id', 'owner','photos']  # Prevent manual updates to these fields

    def get_category_display(self, obj):
        # Translate the category choice to a human-readable value
        return dict(Restaurant.CATEGORY_CHOICES).get(obj.cuisine_type, obj.cuisine_type)

    def get_food_type_display(self, obj):
        # Translate the food type choice to a human-readable value
        return dict(Restaurant.FOOD_TYPE_CHOICES).get(obj.food_type, obj.food_type)

    def get_price_range_display(self, obj):
        # Translate the price range choice to a human-readable value
        return dict(Restaurant.PRICE_RANGE_CHOICES).get(obj.price_range, obj.price_range)




# old

# from rest_framework import serializers
# from django.db.models import Avg, Count
# from .models import Restaurant, CuisineType, FoodType, RestaurantPhoto
# from reviews.models import Review
# from django.conf import settings
# from accounts.serializers import AccountSerializer


# class RestaurantPhotoSerializer(serializers.ModelSerializer):
#     thumbnail_url = serializers.SerializerMethodField()
#     high_res_url = serializers.SerializerMethodField()
#     class Meta:
#         model = RestaurantPhoto
#         fields = ['id', 'thumbnail_url', 'uploaded_at','high_res_url']
    
#     def get_thumbnail_url(self, obj):
#         return f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{obj.thumbnail_s3_key}"
#         # return f"http://localhost:9004/photos/{obj.thumbnail_s3_key}"
    
#     def get_high_res_url(self,obj):
#         return f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{obj.photo_key}"


#         # return f"http://localhost:9004/photos/{obj.photo_key}"

# class RestaurantSerializer(serializers.ModelSerializer):
#     photos = RestaurantPhotoSerializer(many=True, read_only=True)
#     owner = serializers.HiddenField(
#         default=serializers.CurrentUserDefault() 
#     )
#     cuisine_type = serializers.SlugRelatedField(
#         many=True, slug_field='name', queryset=CuisineType.objects.all()
#     )
#     food_type = serializers.SlugRelatedField(
#         many=True, slug_field='name', queryset=FoodType.objects.all()
#     )
#     review_count = serializers.SerializerMethodField()
#     average_rating = serializers.SerializerMethodField()

#     class Meta:
#         model = Restaurant
#         fields = [
#             'id', 'name', 'address', 'city', 'state', 'zip_code', 'price_range', 
#             'rating', 'hours_of_operation', 'website', 'phone_number', 'owner',
#             'cuisine_type', 'food_type', 'description', 'review_count', 'average_rating','photos'
#         ]
        
#     def get_cuisine_type(self, obj):
#         return [cuisine.name for cuisine in obj.cuisine_type.all()]

#     def get_food_type(self, obj):
#         return [food.name for food in obj.food_type.all()]
        
#     def get_review_count(self, obj):
#         return Review.objects.filter(restaurant=obj).count()

#     def get_average_rating(self, obj):
#         avg_rating = Review.objects.filter(restaurant=obj).aggregate(Avg('rating'))['rating__avg']
#         return round(avg_rating, 1) if avg_rating else None



# class RestaurantDetailSerializer(serializers.ModelSerializer):
#     reviews = serializers.SerializerMethodField()
#     photos = RestaurantPhotoSerializer(many=True, read_only=True)

#     class Meta:
#         model = Restaurant
#         fields = [
#             "name",
#             "cuisine_type",
#             "food_type",
#             "price_range",
#             "rating",
#             "address",
#             "city",
#             "state",
#             "zip_code",
#             "hours_of_operation",
#             "website",
#             "phone_number",
#             "latitude",
#             "longitude",
#             "reviews",
#             "description",
#             "photos",
#         ]

#     def get_reviews(self, obj):
#         return [
#             {
#                 "reviewer": review.user.username,
#                 "comment": review.review_text,
#                 "rating": review.rating,
#             }
#             for review in obj.reviews.all()
#         ]

# class RestaurantListingSerializer(serializers.ModelSerializer):
#     owner = serializers.ReadOnlyField(source='owner.username')  # Display owner's username
#     photos = RestaurantPhotoSerializer(many=True, read_only=True, source='photos')
#     class Meta:
#         model = Restaurant
#         fields = [
#             'id', 'name', 'address', 'city', 'state', 'zip_code', 'cuisine_type', 
#             'food_type', 'price_range', 'hours_of_operation', 'website', 'phone_number', 
#             'owner', 'photos'
#         ]
#         read_only_fields = ['id', 'owner','photos']  # Prevent manual updates to these fields

#     def get_category_display(self, obj):
#         # Translate the category choice to a human-readable value
#         return dict(Restaurant.CATEGORY_CHOICES).get(obj.cuisine_type, obj.cuisine_type)

#     def get_food_type_display(self, obj):
#         # Translate the food type choice to a human-readable value
#         return dict(Restaurant.FOOD_TYPE_CHOICES).get(obj.food_type, obj.food_type)

#     def get_price_range_display(self, obj):
#         # Translate the price range choice to a human-readable value
#         return dict(Restaurant.PRICE_RANGE_CHOICES).get(obj.price_range, obj.price_range)


