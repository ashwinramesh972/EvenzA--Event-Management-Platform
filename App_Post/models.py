from django.db import models
from App_User.models import CustomUser

# Create your models here.

class CommunityPost(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='community_posts')
    image = models.ImageField(upload_to='community_posts/', blank=True, null=True)
    caption = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(CustomUser, related_name='liked_community_posts', blank=True)
    like_count = models.PositiveIntegerField(default=0, editable=False)  # Field for like count

    class Meta:
        ordering = ['-created_at']

class Comment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=250)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']