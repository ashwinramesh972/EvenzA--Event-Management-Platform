from django.db import models
from App_User.models import CustomUser
from django.utils import timezone


# Create your models here.

class Event(models.Model): 
  creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
  title = models.CharField(max_length=200)
  date_time = models.DateTimeField()
  location = models.CharField(max_length=200)
  description = models.TextField(blank=True)
  visibility = models.CharField(max_length=10)
  is_paid = models.BooleanField(default=False,null=True)
  price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
  capacity = models.IntegerField(null=True, blank=True) 
  event_type = models.CharField(max_length=50)
  event_code = models.CharField(max_length=10, unique=True, null=True, blank=True)
  status = models.CharField(max_length=10)
  canceled_at = models.DateTimeField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  is_active = models.BooleanField(default=True)
  image = models.ImageField(upload_to='event_images/', null=True, blank=True)
  is_approved=models.BooleanField(default=False,null=True)


class UserActivity(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50)  # login, event_created, etc.
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']

class EventParticipant(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='participated_events')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    joined_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20)
    payment_status = models.CharField(max_length=20,default='not_required')
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    attended = models.BooleanField(default=False)
    cancellation_reason = models.TextField(null=True, blank=True)
    notification_sent = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    waitlist_position = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'event')  
        verbose_name = 'Event Participant'
        verbose_name_plural = 'Event Participants'
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} - {self.event.title}"
    