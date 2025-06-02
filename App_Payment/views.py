from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from App_Event.models import Event, EventParticipant,UserActivity
from App_User.models import CustomUser
from App_Payment.models import PaymentStatus, Payment, PaymentIntent, PaymentType, Subscription
import stripe
from django.conf import settings
import datetime
from decimal import Decimal

stripe.api_key = settings.STRIPE_SECRET_KEY

@login_required
def select_plan(request, plan_type, user_id):
    if request.user.id != int(user_id):
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    user = CustomUser.objects.get(id=user_id)
    pricing = {
        'creator_monthly': {'price_id': 'price_1RR2XdGfHv6NHZlmJANky0NV', 'amount': 19.99},
        'creator_yearly': {'price_id': 'price_1RR2h2GfHv6NHZlmIz4xxbwl', 'amount': 203.90},
        'premium_monthly': {'price_id': 'price_1RR2ZEGfHv6NHZlm9VuUZmN4', 'amount': 49.99},
        'premium_yearly': {'price_id': 'price_1RR2ZfGfHv6NHZlm2D1tMymR', 'amount': 509.90},
    }

    if plan_type.lower() == 'free':
        Subscription.objects.update_or_create(
            user=user,
            defaults={
                'plan_type': 'free',
                'billing_cycle': 'monthly',
                'status': 'active',
                'start_date': timezone.now(),
                'auto_renew': False,
            }
        )
        user.user_type = 'joiner'
        user.is_premium = False
        user.badge = 'Bronze'
        user.save()
        return redirect('users:home')

    if plan_type.lower() not in pricing:
        return JsonResponse({'error': 'Invalid plan type'}, status=400)

    try:
        subscription = Subscription.objects.filter(user=user, status='active').first()
        if subscription and subscription.stripe_customer_id:
            customer = stripe.Customer.retrieve(subscription.stripe_customer_id)
        else:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={'user_id': user_id}
            )

        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': pricing[plan_type]['price_id'],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.build_absolute_uri(reverse('payment:checkout_success')),
            cancel_url=request.build_absolute_uri(reverse('payment:checkout_cancel')),
            metadata={'plan': plan_type, 'user_id': user_id}
        )

        Subscription.objects.update_or_create(
            user=user,
            defaults={
                'plan_type': plan_type.split('_')[0],
                'billing_cycle': plan_type.split('_')[1],
                'status': 'pending',
                'stripe_customer_id': customer.id,
                'start_date': timezone.now(),
            }
        )

        return redirect(checkout_session.url)

    except stripe.error.StripeError as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def purchase_event_ticket(request, event_id, user_id):
    if request.user.id != int(user_id):
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    try:
        event = Event.objects.get(id=event_id, is_paid=True)
        user = CustomUser.objects.get(id=user_id)
    except (Event.DoesNotExist, CustomUser.DoesNotExist):
        return JsonResponse({'error': 'Invalid event or user'}, status=400)

    try:
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(email=user.email, metadata={'user_id': user_id})
            user.stripe_customer_id = customer.id
            user.save()
        else:
            customer = stripe.Customer.retrieve(user.stripe_customer_id)

        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(event.price * 100),
                    'product_data': {'name': event.title},
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.build_absolute_uri(reverse('payment:checkout_success')),
            cancel_url=request.build_absolute_uri(reverse('payment:checkout_cancel')),
            metadata={
                'event_id': event_id,
                'user_id': user_id,
                'type': 'event_ticket'  # ✅ add this
            }
        )

        participant, created = EventParticipant.objects.get_or_create(
            user=user, event=event, defaults={'status': 'pending', 'payment_status': 'pending'}
        )

        # Optional: save PaymentIntent if immediately available
        if checkout_session.payment_intent:
            stripe_pi = stripe.PaymentIntent.retrieve(checkout_session.payment_intent)
            PaymentIntent.objects.create(
                user=user,
                event=event,
                event_participant=participant,
                amount=event.price,
                currency='USD',
                payment_type=PaymentType.EVENT_TICKET,
                stripe_payment_intent_id=stripe_pi.id,
                stripe_client_secret=stripe_pi.client_secret,
                status=stripe_pi.status
            )

        return redirect(checkout_session.url)

    except stripe.error.StripeError as e:
        return JsonResponse({'error': str(e)}, status=400)


def checkout_success(request):
    return render(request, 'payment/success.html', {'message': 'Payment successful! Your plan or ticket has been activated.'})

def checkout_cancel(request):
    return render(request, 'payment/cancel.html', {'message': 'Payment cancelled. Please try again or contact support.'})

@csrf_exempt
@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        metadata = session.get('metadata', {})

        user_id = metadata.get('user_id')
        plan = metadata.get('plan')
        event_id = metadata.get('event_id')
        payment_type = metadata.get('type')  # can be 'subscription', 'event_ticket', 'cancellation_fee'

        print(f"✅ Webhook received: user_id={user_id}, plan={plan}, event_id={event_id}, type={payment_type}")

        if not user_id:
            print("⚠️ Missing user_id in metadata")
            return HttpResponse(status=200)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            print("❌ User not found:", user_id)
            return HttpResponse(status=404)

        # Handle subscription payments
        if plan:
            plan_type, billing_cycle = plan.split('_')
            is_premium = plan_type == 'premium'
            badge = 'Diamond' if is_premium else 'Silver'
            amount = {
                'creator_monthly': 19.99,
                'creator_yearly': 203.90,
                'premium_monthly': 49.99,
                'premium_yearly': 509.90
            }.get(plan, 0)

            Subscription.objects.update_or_create(
                user=user,
                defaults={
                    'plan_type': plan_type,
                    'billing_cycle': billing_cycle,
                    'status': 'active',
                    'stripe_subscription_id': session.subscription,
                    'stripe_customer_id': session.customer,
                    'start_date': timezone.now(),
                    'current_period_end': timezone.now() + datetime.timedelta(days=30 if billing_cycle == 'monthly' else 365),
                    'auto_renew': True,
                }
            )

            Payment.objects.create(
                user=user,
                amount=amount,
                currency='USD',
                payment_type=PaymentType.SUBSCRIPTION,
                payment_status=PaymentStatus.COMPLETED,
                transaction_id=session.payment_intent
            )

            user.is_premium = is_premium
            user.user_type = plan_type
            user.badge = badge
            user.save()

            print(f"✅ Subscription for {user.email} upgraded to {plan_type}")

        # Handle event ticket payments
        elif payment_type == 'event_ticket' and event_id:
            try:
                event_obj = Event.objects.get(id=event_id)
                participant, created = EventParticipant.objects.get_or_create(
                    user=user,
                    event=event_obj,
                    defaults={
                        'status': 'confirmed',
                        'payment_status': 'completed',
                        'payment_amount': event_obj.price,
                    }
                )
                if not created:
                    participant.status = 'confirmed'
                    participant.payment_status = 'completed'
                    participant.payment_amount = event_obj.price
                    participant.cancellation_reason = None
                    participant.save()

                Payment.objects.create(
                    user=user,
                    event=event_obj,
                    event_participant=participant,
                    amount=event_obj.price,
                    currency='USD',
                    payment_type=PaymentType.EVENT_TICKET,
                    payment_status=PaymentStatus.COMPLETED,
                    transaction_id=session.payment_intent
                )

                UserActivity.objects.create(
                    user=user,
                    activity_type='event_joined',
                    description=f"Joined event: {event_obj.title}"
                )

                user.event_attended_count += 1
                user.save()

                print(f"✅ User {user.email} successfully joined event: {event_obj.title}")

            except Event.DoesNotExist:
                print("❌ Event not found:", event_id)
            except Exception as e:
                print("❌ Error handling event participant:", str(e))

        # ✅ Handle cancellation fee payment
        elif payment_type == 'cancellation_fee' and event_id:
            try:
                event_obj = Event.objects.get(id=event_id)

                Payment.objects.create(
                    user=user,
                    event=event_obj,
                    amount=event_obj.price,  
                    currency='USD',
                    payment_type=PaymentType.CANCELLATION_FEE,
                    payment_status=PaymentStatus.COMPLETED,
                    transaction_id=session.payment_intent
                )

                
                event_obj.status = 'cancelled'
                event_obj.canceled_at = timezone.now()
                event_obj.save()

                UserActivity.objects.create(
                    user=user,
                    activity_type='event_cancelled',
                    description=f"Paid cancellation fee for event: {event_obj.title}"
                )

                print(f"✅ Cancellation fee processed for {user.email} on event: {event_obj.title}")

            except Event.DoesNotExist:
                print("❌ Event not found for cancellation:", event_id)
            except Exception as e:
                print("❌ Error handling cancellation fee:", str(e))

    return HttpResponse(status=200)




@login_required
def cancellation_payment(request, event_id):
    try:
        event = Event.objects.get(id=event_id)
        user = request.user

        # Only allow the creator to pay the cancellation fee
        if event.creator != user:
            return JsonResponse({'success': False, 'message': 'Unauthorized'}, status=403)

        # Calculate hours until event
        now = timezone.now()
        event_date_time = event.date_time
        if not timezone.is_aware(event_date_time):
            event_date_time = timezone.make_aware(event_date_time)
        hours_to_event = (event_date_time - now).total_seconds() / 3600

        # Determine cancellation fee
        if hours_to_event > 72 or not event.is_paid:
            return redirect('payment:checkout_cancel')

        if hours_to_event > 48:
            fee_percentage = 50
        elif hours_to_event > 24:
            fee_percentage = 75
        else:
            fee_percentage = 100

        fee_amount = (event.price * Decimal(fee_percentage) / Decimal('100')).quantize(Decimal('0.01'))

        # Ensure Stripe customer
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(email=user.email)
            user.stripe_customer_id = customer.id
            user.save()
        else:
            customer = stripe.Customer.retrieve(user.stripe_customer_id)

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(fee_amount * 100),
                    'product_data': {'name': f"Cancellation Fee: {event.title}"}
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.build_absolute_uri(reverse('payment:checkout_success')),
            cancel_url=request.build_absolute_uri(reverse('payment:checkout_cancel')),
            metadata={
                'user_id': str(user.id),
                'event_id': str(event.id),
                'type': 'cancellation_fee'
            }
        )

        return redirect(checkout_session.url)

    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Server error: {str(e)}'}, status=500)
