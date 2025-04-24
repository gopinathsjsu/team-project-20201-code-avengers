from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)  # Display username
    restaurant = serializers.StringRelatedField(read_only=True)  # Display restaurant name

    class Meta:
        model = Review
        fields = ['id', 'user', 'restaurant', 'review_text', 'rating', 'created_at']

    def validate_rating(self, value):
        """Ensure the rating is between 1 and 5."""
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value