from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.db.models import Q
# ---------------------------------------------------------------------
#  Lookup tables
# ---------------------------------------------------------------------

class CuisineType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class FoodType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------
#  Restaurant & photos
# ---------------------------------------------------------------------

class Restaurant(models.Model):
    CATEGORY_CHOICES = [
        ('fast_food', 'Fast Food'),
        ('fine_dining', 'Fine Dining'),
        ('cafe',        'Cafe'),
    ]
    PRICE_RANGE_CHOICES = [
        ('$',   'Low'),
        ('$$',  'Moderate'),
        ('$$$', 'Expensive'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,                 # ← always point to AUTH_USER_MODEL
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'owner'},       # you already enforce roles
        related_name='restaurants',
    )

    # Basic info
    name               = models.CharField(max_length=255)
    address            = models.CharField(max_length=255)
    city               = models.CharField(max_length=100)
    state              = models.CharField(max_length=100)
    zip_code           = models.CharField(max_length=10)
    latitude           = models.FloatField(null=True, blank=True)
    longitude          = models.FloatField(null=True, blank=True)

    # Meta & tags
    cuisine_type       = models.ManyToManyField(CuisineType, related_name='restaurants')
    food_type          = models.ManyToManyField(FoodType,   related_name='restaurants')
    price_range        = models.CharField(max_length=3, choices=PRICE_RANGE_CHOICES)
    category           = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='cafe')

    # Misc
    rating             = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    review_count       = models.PositiveIntegerField(default=0)
    hours_of_operation = models.CharField(max_length=100)
    website            = models.URLField(blank=True, null=True)
    phone_number       = models.CharField(max_length=15)
    description        = models.TextField(blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        indexes  = [
            models.Index(fields=['city', 'state']),
        ]

    def __str__(self):
        return self.name


class RestaurantPhoto(models.Model):
    restaurant        = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='photos')
    photo_key         = models.CharField(max_length=255)          # S3 object key (full-size)
    thumbnail_s3_key  = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.restaurant.name} – {self.photo_key}'


# ---------------------------------------------------------------------
#  Table & Booking
# ---------------------------------------------------------------------

class Table(models.Model):
    restaurant      = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables')
    size            = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])  # seats
    # List of strings like ["18:00", "18:30", ...] describing **starts** allowed for this table
    available_times = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ('restaurant', 'id')   # one table id per restaurant
        ordering        = ['restaurant', 'size']

    def __str__(self):
        return f'{self.restaurant.name} | Table {self.id} (seats {self.size})'


class Booking(models.Model):
    class Status(models.TextChoices):
        BOOKED    = 'BOOKED',    'Booked'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='bookings')
    restaurant  = models.ForeignKey(Restaurant, on_delete=models.CASCADE,
                                    related_name='bookings')
    table       = models.ForeignKey(Table, on_delete=models.CASCADE,
                                    related_name='bookings')
    date        = models.DateField()
    time        = models.TimeField()
    num_people  = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.BOOKED)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    status_changed_at = models.DateTimeField(null=True, blank=True)


    class Meta:
        # Prevent double-booking the same table slot
        constraints = [
            models.UniqueConstraint(
                fields=['table', 'date', 'time'],
                condition=Q(status='BOOKED'),
                name='unique_active_table_booking'
            ),
        ]
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['restaurant', 'date']),
        ]

    def __str__(self):
        return (f'Booking #{self.id} – {self.restaurant.name} – '
                f'{self.date} {self.time} – {self.user.get_full_name() or self.user.username}')
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        old_status = None

        if not is_new:
            try:
                old = Booking.objects.get(pk=self.pk)
                old_status = old.status
            except Booking.DoesNotExist:
                pass

        if old_status != self.status:
            self.status_changed_at = timezone.now()

        super().save(*args, **kwargs)


    # A quick helper you may call from views/serializers
    def is_past(self):
        return timezone.localdate() > self.date or (
            timezone.localdate() == self.date and timezone.localtime().time() > self.time
        )
