from django.urls import path
from App_Post import views

app_name = 'communitypost'

urlpatterns = [
    path('', views.community_feed, name='community_feed'),
    path('post/<int:post_id>/', views.post_detail, name='post_detail'),
    path('post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('post/new/', views.create_post, name='create_post'),
    path('post/<int:post_id>/like/', views.toggle_like, name='toggle_like'),
]