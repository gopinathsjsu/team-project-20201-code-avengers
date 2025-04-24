import random
from faker import Faker
from accounts.models import CustomUser
from restaurants.models import Restaurant, CuisineType, FoodType

fake = Faker()

def populate_users():
    # Clear existing users (optional)
    CustomUser.objects.all().delete()

    # Create admin account
    CustomUser.objects.create_superuser(
        email="admin@example.com",
        username="admin",
        password="admin123",
        role="admin"
    )
    print("Admin account created: admin@example.com")

    # Create business owners
    for _ in range(10):  # Adjust number of owners as needed
        owner = CustomUser.objects.create_user(
            email=fake.email(),
            username=fake.user_name(),
            password="password123",
            role="owner",
            business_name=fake.company(),
            address=fake.address(),
            contact=fake.phone_number()[:15]
        )
        print(f"Business Owner created: {owner.email}")

    # Create regular users
    for _ in range(20):  # Adjust number of users as needed
        user = CustomUser.objects.create_user(
            email=fake.email(),
            username=fake.user_name(),
            password="password123",
            role="user"
        )
        print(f"User account created: {user.email}")

def populate_restaurants_with_owners(restaurants_per_owner=5):
    # Ensure there are business owners
    owners = CustomUser.objects.filter(role="owner")
    if not owners.exists():
        print("No business owners available. Please create owner accounts first.")
        return

    # Ensure cuisine and food types exist
    cuisines = list(CuisineType.objects.all())
    food_types = list(FoodType.objects.all())

    if not cuisines or not food_types:
        print("No cuisines or food types available. Please populate these models first.")
        return

    # Clear existing restaurants (optional)
    Restaurant.objects.all().delete()

    # Bay Area locations
    BAY_AREA_CITIES = [
        {"city": "San Jose", "zip_code": "95112"},
        {"city": "San Francisco", "zip_code": "94103"},
        {"city": "Oakland", "zip_code": "94607"},
        {"city": "Santa Clara", "zip_code": "95050"},
        {"city": "Fremont", "zip_code": "94536"},
        {"city": "Palo Alto", "zip_code": "94301"},
        {"city": "Sunnyvale", "zip_code": "94086"},
    ]
    BAY_AREA_LATITUDE_RANGE = (37.2, 37.9)
    BAY_AREA_LONGITUDE_RANGE = (-122.5, -121.5)

    for owner in owners:
        for _ in range(restaurants_per_owner):
            try:
                bay_area_location = random.choice(BAY_AREA_CITIES)
                restaurant = Restaurant.objects.create(
                    owner=owner,
                    name=fake.company(),
                    address=fake.street_address(),
                    city=bay_area_location["city"],
                    state="CA",
                    zip_code=bay_area_location["zip_code"],
                    price_range=random.choice(["$", "$$", "$$$"]),
                    rating=round(random.uniform(1, 5), 1),
                    hours_of_operation=f"{random.randint(8, 11)}:00 AM - {random.randint(8, 11)}:00 PM",
                    website=fake.url(),
                    phone_number=fake.phone_number()[:15],
                    latitude=round(random.uniform(*BAY_AREA_LATITUDE_RANGE), 6),
                    longitude=round(random.uniform(*BAY_AREA_LONGITUDE_RANGE), 6),
                    description=fake.text(max_nb_chars=200),
                )

                # Assign random cuisines and food types
                restaurant.cuisine_type.set(random.sample(cuisines, k=random.randint(1, 3)))
                restaurant.food_type.set(random.sample(food_types, k=random.randint(1, 3)))

                print(f"Added restaurant: {restaurant.name} for owner: {owner.email}")
            except Exception as e:
                print(f"Error adding restaurant: {e}")

# Populate users and restaurants
populate_users()
populate_restaurants_with_owners(restaurants_per_owner=5)
