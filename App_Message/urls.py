from django.urls import path
from . import views

app_name = 'message'

urlpatterns = [
    path('', views.messages_home, name='messages_home'), 
    path('direct/', views.direct_messages, name='direct_messages'),  
    path('get_direct_messages/<int:recipient_id>/', views.get_direct_messages, name='get_direct_messages'),
    path('send_message/', views.send_message, name='send_message'),  
    path('api/send_message/', views.send_message_api, name='send_message_api'),  
    path('check_message_limit/', views.check_message_limit, name='check_message_limit'),
    path('get_group_messages/<int:event_id>/', views.get_group_messages, name='get_group_messages'),
    path('send_group_message/<int:event_id>/', views.send_group_message, name='send_group_message'),
    path('get_new_group_messages/<int:event_id>/<int:last_message_id>/', views.get_new_group_messages, name='get_new_group_messages'),
    path('check_group_message_limit/<int:event_id>/', views.check_group_message_limit, name='check_group_message_limit'),
    
]