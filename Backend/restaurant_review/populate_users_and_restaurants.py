#!/usr/bin/env python3

import os
import django
import random
from datetime import time

# 1) point Django at your settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "restaurant_review.settings")
# 2) bootstrap Django
django.setup()

from faker import Faker

# Now it's safe to import your models
from accounts.models import CustomUser
from restaurants.models import Restaurant, CuisineType, FoodType, OperatingHours

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


def populate_operating_hours(restaurants):
    """Create operating hours for each restaurant with diverse timing patterns."""
    # Delete existing operating hours
    OperatingHours.objects.all().delete()
    
    # Restaurant types with different scheduling patterns
    restaurant_types = [
        "standard",      
        "breakfast",     
        "dinner_only",   
        "cafe",          
        "bar",           
        "late_night",    
        "early_bird",    
        "24_hour",       
    ]
    
    for i, restaurant in enumerate(restaurants):
        # Assign a restaurant type - cycle through them to ensure variety
        restaurant_type = restaurant_types[i % len(restaurant_types)]
        
        # Different closed days based on restaurant type
        if restaurant_type == "breakfast":
            # Some breakfast places closed on a weekend day
            closed_days = [random.choice([5, 6])] if random.choice([True, False]) else []
        elif restaurant_type == "bar" or restaurant_type == "late_night":
            # Some bars closed on Monday
            closed_days = [0] if random.choice([True, False]) else []
        elif restaurant_type == "24_hour":
            # 24-hour places typically don't close
            closed_days = []
        else:
            # Random closed day (if any)
            closed_days = [random.randint(0, 6)] if random.choice([True, False, False]) else []
        
        for day in range(7):  # 0=Monday, 6=Sunday
            is_closed = day in closed_days
            
            # Skip to next iteration if the restaurant is closed on this day
            if is_closed:
                OperatingHours.objects.create(
                    restaurant=restaurant,
                    day_of_week=day,
                    opening_time=time(0, 0),
                    closing_time=time(0, 0),
                    is_closed=True
                )
                continue
            
            # Set hours based on restaurant type and day
            if restaurant_type == "breakfast":
                # Breakfast places: early open, early close
                weekday_open = time(5, 30)
                weekday_close = time(14, 0)
                weekend_open = time(6, 30)
                weekend_close = time(15, 0)
                
                opening = weekday_open if day < 5 else weekend_open
                closing = weekday_close if day < 5 else weekend_close
            
            elif restaurant_type == "dinner_only":
                # Dinner-only places: open late afternoon, close late
                weekday_open = time(16, 0)
                weekday_close = time(22, 0)
                weekend_open = time(15, 0)
                weekend_close = time(23, 0)
                
                opening = weekday_open if day < 5 else weekend_open
                closing = weekday_close if day < 5 else weekend_close
            
            elif restaurant_type == "cafe":
                # Cafes: early morning open, mid-afternoon close
                weekday_open = time(6, 30)
                weekday_close = time(17, 0)
                weekend_open = time(7, 30)
                weekend_close = time(16, 0)
                
                opening = weekday_open if day < 5 else weekend_open
                closing = weekday_close if day < 5 else weekend_close
            
            elif restaurant_type == "bar":
                # Bars: open afternoon, close late night
                weekday_open = time(16, 0)
                weekday_close = time(23, 0)
                weekend_open = time(14, 0)
                weekend_close = time(2, 0)
                
                opening = weekday_open if day < 5 else weekend_open
                closing = weekday_close if day < 5 else weekend_close
            
            elif restaurant_type == "late_night":
                # Late night spots: open evening, close very late
                weekday_open = time(18, 0)
                weekday_close = time(2, 0)
                weekend_open = time(18, 0)
                weekend_close = time(4, 0)
                
                opening = weekday_open if day < 5 else weekend_open
                closing = weekday_close if day < 5 else weekend_close
            
            elif restaurant_type == "early_bird":
                # Opens extremely early
                weekday_open = time(4, 0)
                weekday_close = time(16, 0)
                weekend_open = time(5, 0)
                weekend_close = time(14, 0)
                
                opening = weekday_open if day < 5 else weekend_open
                closing = weekday_close if day < 5 else weekend_close
            
            elif restaurant_type == "24_hour":
                # Nearly 24 hours - some jurisdictions require brief closing
                if day == 6:  # Sunday
                    opening = time(4, 0)  # Open at 4 AM Sunday
                    closing = time(2, 0)  # Close at 2 AM Monday
                else:
                    opening = time(3, 0)  # Open at 3 AM
                    closing = time(2, 0)  # Close at 2 AM next day
            
            else:  # standard restaurant
                # Standard restaurants have more "normal" hours
                if day < 5:  # Weekday
                    opening = time(random.choice([10, 11]), random.choice([0, 30]))
                    closing = time(random.choice([20, 21]), random.choice([0, 30]))
                else:  # Weekend
                    opening = time(random.choice([9, 10]), random.choice([0, 30]))
                    closing = time(random.choice([21, 22]), random.choice([0, 30]))
            
            # Create the operating hours record
            OperatingHours.objects.create(
                restaurant=restaurant,
                day_of_week=day,
                opening_time=opening,
                closing_time=closing,
                is_closed=False
            )
        
        print(f"Created operating hours for {restaurant.name} ({restaurant_type} type)")
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

    created_restaurants = []
    
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
                
                created_restaurants.append(restaurant)
                print(f"Added restaurant: {restaurant.name} for owner: {owner.email}")
            except Exception as e:
                print(f"Error adding restaurant: {e}")
    
    return created_restaurants


# Populate users and restaurants
populate_users()
restaurants = populate_restaurants_with_owners(restaurants_per_owner=5)
populate_operating_hours(restaurants)

print("Population complete!")