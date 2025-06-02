from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('admin/approve/', views.Admin_Event_approve_Page, name='admin_approve_page'),
    path('admin/approve/<int:id>/', views.Admin_Event_approve, name='admin_approve_event'),
    path('admin/reject/<int:id>/', views.Admin_Event_reject, name='admin_reject_event'),
    path('events-created-over-time/', views.events_created_over_time, name='events_created_over_time'),
    path('paid-vs-non-paid/', views.paid_vs_non_paid, name='paid_vs_non_paid'),
    path('canceled-vs-completed/', views.canceled_vs_completed, name='canceled_vs_completed'),
    path('new-user-registration/', views.new_user_registration, name='new_user_registration'),
    path('event-price-distribution/', views.event_price_distribution, name='event_price_distribution'),
    path('top-events-by-participation/', views.top_events_by_participation, name='top_events_by_participation'),
    path('revenue-from-subscriptions/', views.revenue_from_subscriptions, name='revenue_from_subscriptions'),
    path('revenue-from-events/', views.revenue_from_events, name='revenue_from_events'),
    path('community-posts-over-time/', views.community_posts_over_time, name='community_posts_over_time'),
    path('average-event-ratings/', views.average_event_ratings, name='average_event_ratings'),
    path('payment-status-distribution/', views.payment_status_distribution, name='payment_status_distribution'),
    path('user-activity-types/', views.user_activity_types, name='user_activity_types'),
    path('subscription-plan-distribution/', views.subscription_plan_distribution, name='subscription_plan_distribution'),
    path('top-active-users/', views.top_active_users, name='top_active_users'),
    path('admin-analitics',views.admin_analitics,name='admin-analitics'),
    path('admin-view-user',views.Admin_view_user,name='admin-view-user'),
    path('users-details/<int:user_id>/', views.get_user_details, name='get_user_details'),
    path('users/', views.get_users, name='get_users'),
    path('banned-user',views.Banneduser,name="banneduser"),
    path('revoke-ban/<int:user_id>/', views.revoke_ban, name='revoke_ban'),
    path('admin-view-event',views.view_events,name='admin-view-events'),
    path('reset-password/', views.reset_password, name='reset_password'),  
    path('reset-password-form/', views.reset_password_form, name='reset_password_form'),  
    path('reset-password-confirm/', views.reset_password_confirm, name='reset_password_confirm'), 
]
