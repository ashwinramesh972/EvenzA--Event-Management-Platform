from django.db import models
from App_User.models import CustomUser
from App_Event.models import Event


# Create your models here.
class Message(models.Model):
    MESSAGE_TYPES = [
        ('direct', 'Direct'),
        ('group', 'Group'),
        ('announcement', 'Announcement'),
    ]
    
    sender = models.ForeignKey(CustomUser, related_name='sent_messages', on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE,null=True)
    recipients = models.ManyToManyField(CustomUser, related_name='received_messages', blank=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='direct')
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.message_type.capitalize()} from {self.sender.username} for {self.event.title}"

    class Meta:
        ordering = ['-sent_at']