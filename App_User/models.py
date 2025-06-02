from django.db import models
from django.contrib.auth.models import AbstractUser 

# Create your models here.
class CustomUser(AbstractUser):
  user_type=models.CharField(max_length=20,null=True)
  email = models.EmailField(unique=True, blank=False)
  cancellation_count = models.IntegerField(default=0)
  is_banned = models.BooleanField(default=False)
  successful_events = models.IntegerField(default=0)
  event_created_count = models.IntegerField(default=0)
  message_count = models.IntegerField(default=0)
  is_deleted = models.BooleanField(default=False)
  is_premium = models.BooleanField(default=False)
  profile_picture = models.ImageField(upload_to='profile_pics/', default='profile_pics/default.jpg', blank=True)
  event_attended_count=models.IntegerField(default=0)
  badge = models.CharField(max_length=20, default='None')
  stripe_customer_id = models.CharField(max_length=100, blank=True, null=True, help_text="Stripe customer ID for payment processing")

  def __str__(self):
    return self.username