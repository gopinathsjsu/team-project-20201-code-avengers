
#!/usr/bin/env python3
import os, django, random
from datetime import datetime, timedelta

# ─── 1) Bootstrap Django ───────────────────────────────────────────────
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "restaurant_review.settings")
django.setup()

# ─── 2) Imports ────────────────────────────────────────────────────────
from faker import Faker
from accounts.models import CustomUser
from restaurants.models import Restaurant, CuisineType, FoodType, Table   # ← NEW import

fake = Faker()

# ─── 3) Utility: build 30‑min slots between two “HH:MM” strings ─────────
def build_slots(open_time, close_time):
    start = datetime.strptime(open_time, "%H:%M")
    end   = datetime.strptime(close_time, "%H:%M")
    slots = []
    while start <= end:
        slots.append(start.strftime("%H:%M"))
        start += timedelta(minutes=30)
    return slots


# ─── 4) Users (unchanged) ──────────────────────────────────────────────
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



# ─── 5) Restaurants **+ tables** ───────────────────────────────────────
def populate_restaurants_with_owners(restaurants_per_owner=5):
    owners = CustomUser.objects.filter(role="owner")
    if not owners.exists():
        print("No business owners available.")
        return

    cuisines    = list(CuisineType.objects.all())
    food_types  = list(FoodType.objects.all())
    if not cuisines or not food_types:
        print("Populate CuisineType and FoodType first.")
        return

    Restaurant.objects.all().delete()   # Optional: start fresh
    Table.objects.all().delete()        # Optional: clear tables too

    BAY_AREA_CITIES = [
        {"city": "San Jose",      "zip_code": "95112"},
        {"city": "San Francisco", "zip_code": "94103"},
        {"city": "Oakland",       "zip_code": "94607"},
        {"city": "Santa Clara",   "zip_code": "95050"},
        {"city": "Fremont",       "zip_code": "94536"},
        {"city": "Palo Alto",     "zip_code": "94301"},
        {"city": "Sunnyvale",     "zip_code": "94086"},
    ]
    LAT_RANGE, LNG_RANGE = (37.2, 37.9), (-122.5, -121.5)

    for owner in owners:
        for _ in range(restaurants_per_owner):
            city_info = random.choice(BAY_AREA_CITIES)

            # Pick random opening / closing hours
            open_hour  = random.randint(8, 11)   # 08:00‑11:00
            close_hour = random.randint(20, 23)  # 20:00‑23:00
            open_str, close_str = f"{open_hour:02d}:00", f"{close_hour:02d}:00"
            hours_str = f"{open_hour}:00 AM - {close_hour % 12 or 12}:00 PM"

            restaurant = Restaurant.objects.create(
                owner            = owner,
                name             = fake.company(),
                address          = fake.street_address(),
                city             = city_info["city"],
                state            = "CA",
                zip_code         = city_info["zip_code"],
                price_range      = random.choice(["$", "$$", "$$$"]),
                rating           = round(random.uniform(1, 5), 1),
                hours_of_operation = hours_str,
                website          = fake.url(),
                phone_number     = fake.phone_number()[:15],
                latitude         = round(random.uniform(*LAT_RANGE), 6),
                longitude        = round(random.uniform(*LNG_RANGE), 6),
                description      = fake.text(max_nb_chars=200),
            )

            # Many‑to‑many tags
            restaurant.cuisine_type.set(random.sample(cuisines,  random.randint(1, 3)))
            restaurant.food_type.set(   random.sample(food_types,random.randint(1, 3)))

            # ── NEW: generate tables ───────────────────────────────
            available_slots = build_slots(open_str, close_str)  # ["11:00","11:30",…]
            for _ in range(random.randint(5, 12)):               # 5‑12 tables/restaurant
                Table.objects.create(
                    restaurant      = restaurant,
                    size            = random.choice([2, 4, 6, 8]),
                    available_times = available_slots,
                )

            print(f"Added restaurant {restaurant.name} with {restaurant.tables.count()} tables.")


# ─── 6) Run populate tasks ─────────────────────────────────────────────
if __name__ == "__main__":
    populate_users()
    populate_restaurants_with_owners(restaurants_per_owner=5)
    print("Done.")
