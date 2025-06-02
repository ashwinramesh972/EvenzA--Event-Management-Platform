from App_Reviews import views
from django.urls import path

app_name = 'ratings'

urlpatterns = [
    path('submit/', views.submit_rating, name='submit_rating'),
]