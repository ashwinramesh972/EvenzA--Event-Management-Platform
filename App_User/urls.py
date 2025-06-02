from django.urls import path
from App_User import views

app_name = 'users'

urlpatterns = [
  path('',views.home,name='home'),
  path('user-register',views.user_register,name='user-register'),
  path('user-login',views.user_login,name='user-login'),
  path('Joiner-home',views.Joinerhome,name='Joiner-home'),
  path('creator-home',views.creatorhome,name='creator-home'),
  path('Premium-Home',views.PremiumHome,name='Premium-Home'),
  path('user-logout',views.userlogout,name='user-logout'),
  path('user-upgrade/',views.upgrade,name='user-upgrade'),
  path('profile',views.user_profile,name='profile'),
  path('about',views.about,name='about'),
  path('contact',views.contact,name='contact'),
  path('get-event-participants/<int:event_id>/', views.get_event_participants, name='get_event_participants'),
]