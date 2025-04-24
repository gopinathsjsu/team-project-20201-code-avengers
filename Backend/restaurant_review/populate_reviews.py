import random
from faker import Faker
from accounts.models import CustomUser
from restaurants.models import Restaurant
from reviews.models import Review

fake = Faker()

def populate_reviews(reviews_per_restaurant=5):
    # Ensure there are restaurants and users in the database
    restaurants = Restaurant.objects.all()
    users = CustomUser.objects.all()

    if not restaurants.exists():
        print("No restaurants available. Please populate the Restaurant model first.")
        return

    if not users.exists():
        print("No users available. Please populate the CustomUser model first.")
        return

    # Clear existing reviews (optional)
    Review.objects.all().delete()

    for restaurant in restaurants:
        print(f"Adding reviews for {restaurant.name}...")
        for _ in range(reviews_per_restaurant):
            try:
                user = random.choice(users)
                rating = random.randint(1, 5)  # Generate ratings between 1 and 5
                review_text = fake.text(max_nb_chars=200)  # Generate review text

                # Create review
                Review.objects.create(
                    user=user,
                    restaurant=restaurant,
                    rating=rating,
                    review_text=review_text,
                )
                print(f"Added review for {restaurant.name} by {user.username} with rating {rating}")
            except Exception as e:
                print(f"Error adding review for {restaurant.name}: {e}")

# Populate reviews for all restaurants
populate_reviews(reviews_per_restaurant=5)
