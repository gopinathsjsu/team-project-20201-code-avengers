import random
from faker import Faker
from accounts.models import CustomUser

fake = Faker()

def create_admin_accounts(n=5):
    """Create admin accounts."""
    for _ in range(n):
        CustomUser.objects.create_superuser(
            username=fake.user_name(),
            email=fake.email(),
            password="admin123",  # Default password for all admins
            role="admin"  # Assuming role is a field in CustomUser
        )
    print(f"{n} admin accounts created successfully!")

def create_business_owner_accounts(n=10):
    """Create business owner accounts."""
    for _ in range(n):
        CustomUser.objects.create_user(
            username=fake.user_name(),
            email=fake.email(),
            password="owner123",  # Default password for all owners
            role="owner"  # Assuming role is a field in CustomUser
        )
    print(f"{n} business owner accounts created successfully!")

def create_user_accounts(n=20):
    """Create regular user accounts."""
    for _ in range(n):
        CustomUser.objects.create_user(
            username=fake.user_name(),
            email=fake.email(),
            password="user123",  # Default password for all users
            role="user"  # Assuming role is a field in CustomUser
        )
    print(f"{n} user accounts created successfully!")

# Main function to create accounts
def main():
    create_admin_accounts(n=5)  # Create 5 admin accounts
    create_business_owner_accounts(n=10)  # Create 10 business owners
    create_user_accounts(n=20)  # Create 20 regular users

if __name__ == "__main__":
    main()
