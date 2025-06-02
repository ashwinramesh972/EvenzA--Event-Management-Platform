from django.urls import path
from App_Payment import views

app_name = 'payment'

urlpatterns = [
    path('select-plan/<str:plan_type>/<int:user_id>/', views.select_plan, name='select_plan'),
    path('purchase-ticket/<int:event_id>/<int:user_id>/', views.purchase_event_ticket, name='purchase_event_ticket'),
    path('webhook/stripe/', views.stripe_webhook, name='stripe-webhook'),
    path('success/', views.checkout_success, name='checkout_success'),
    path('cancel/', views.checkout_cancel, name='checkout_cancel'),
    path('cancellation-payment/<int:event_id>/', views.cancellation_payment, name='cancellation_payment'),
]