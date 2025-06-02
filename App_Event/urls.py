from django.urls import path
from App_Event import views

app_name = 'event'

urlpatterns = [
    path('joiner/create/', views.EventDetailsJoiner, name='joiner_create_event'),
    path('creator/create/', views.EventDetailsCreator, name='creator_create_event'),
    path('premium/create/', views.EventDetailsPremiumCreator, name='premium_create_event'),
    path('user/<int:user_id>/activities/', views.get_user_activities, name='user_activities'),
    path('details/<int:event_id>/', views.event_details, name='event_details'),
    path('user/<int:user_id>/events/', views.user_events_api, name='user_events'),
    path('leave/<int:event_id>/', views.leave_event, name='leave_event'),
    path('view/<int:event_id>/', views.view_event, name='view_event'),
    path('join/<int:event_id>/', views.join_event_api, name='join_event'),
    path('cancel/<int:event_id>/', views.cancel_event, name='delete_event'),
    path('all-paid-events', views.all_paid_events,name='all-paid-events'),
    path('all-free-events',views.all_free_events,name='all-free-events'),
    path('search-private-event/', views.search_private_event, name='search_private_event'),
    path('edit-event/<int:id>/',views.edit_event,name='edit-event')
]