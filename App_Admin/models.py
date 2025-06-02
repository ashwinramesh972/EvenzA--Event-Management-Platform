from django.db import models
from App_User.models import CustomUser
from django.utils import timezone
import uuid

# Create your models here.

class Appeal(models.Model):
  user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
  username=models.CharField(max_length=20)
  email=models.EmailField()
  appeal_message = models.TextField()
  subject=models.CharField(max_length=50)
  submitted_at = models.DateTimeField(auto_now_add=True)
  uploaded_file = models.FileField(upload_to='appeal/files/',null=True)




class PasswordResetToken(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    email=models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"PasswordResetToken(user={self.user.username}, used={self.used})"