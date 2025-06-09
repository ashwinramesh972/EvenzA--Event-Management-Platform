from django.shortcuts import render, redirect, get_object_or_404
import os
import random
import string
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.utils import timezone
from .models import Event, UserActivity, EventParticipant
from App_User.models import CustomUser
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.core.exceptions import PermissionDenied
from datetime import timezone as py_timezone
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
import json
from django.urls import reverse
from django.contrib.auth import logout
from decimal import Decimal
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from .models import Event, EventParticipant, UserActivity
from App_User.models import CustomUser
from django.db import transaction


# Create your views here.
def EventDetailsJoiner(request):
    event_count = Event.objects.filter(creator=request.user).count()
    events_remaining = 3 - event_count
    if request.method=='POST':
        if event_count < 3:
            title=request.POST.get('title')
            date_time=request.POST.get('date_time')
            location=request.POST.get('location')
            description=request.POST.get('description')
            capacity=request.POST.get('capacity')
            event_type=request.POST.get('eventType')
            image = request.FILES.get('image')
            default_image = request.POST.get('default_image')
            status='pending'
            

            eventcreated=Event.objects.create(
                creator=request.user,
                title=title,
                date_time=date_time,
                location=location,
                description=description,
                capacity=capacity,
                status=status,
                event_type=event_type,
                visibility='public'
            )
            if image:
                eventcreated.image = image
            elif default_image:
                eventcreated.image = os.path.join('defaults', default_image)
                
            eventcreated.save()
            activity = UserActivity.objects.create(
                user=eventcreated.creator,
                activity_type='event_created',
                description=f'Created "{eventcreated.title}"'
            )
            activity.save()

            user = CustomUser.objects.get(id=request.user.id) 
            user.event_created_count += 1
            user.save()

            messages.success(request, "Event created successfully!")
            return redirect('users:Joiner-home')
        
        else:
            messages.error(request, "You’ve reached the limit of 3 free events.")
            return render(request, "EventCreation/eventdetailsjoiner.html")
    else:
        return render(request,"EventCreation/eventdetailsjoiner.html")  



def EventDetailsCreator(request):
    if request.method == 'POST':
   
        paid_events_count = Event.objects.filter(creator=request.user, is_paid=True).count()
        private_events_count = Event.objects.filter(creator=request.user, visibility='private').count()
        

        is_paid_str = request.POST.get('isPaid')  
        is_paid = is_paid_str == 'yes' 
        visibility = request.POST.get('visibility')
        

        if paid_events_count >= 3 and is_paid:
            return JsonResponse({
                'success': False,
                'message': "You've reached the limit of 3 paid event creation."
            })
                     
        if private_events_count >= 5 and visibility == 'private':
            return JsonResponse({
                'success': False,
                'message': "You've reached the limit of 5 private event creation."
            })
        

        try:
            title = request.POST.get('title')
            date_time = request.POST.get('date_time')
            location = request.POST.get('location')
            description = request.POST.get('description')
            capacity = request.POST.get('capacity')
            event_type = request.POST.get('eventType')
            price = request.POST.get('price') if is_paid else None
            image = request.FILES.get('image')
            default_image = request.POST.get('default_image')
            status = 'pending'
            

            eventcreated = Event.objects.create(
                creator=request.user,
                title=title,
                date_time=date_time,
                location=location,
                description=description,
                capacity=capacity,
                status=status,
                event_type=event_type,
                visibility=visibility,
                is_paid=is_paid,
                price=price
            )
            
 
            event_code = None
            if visibility == 'private':
                event_code = generate_event_code()  
                eventcreated.event_code = event_code
                         

            if image:
                eventcreated.image = image
            elif default_image and default_image != 'main.jpg':
                eventcreated.image = os.path.join('defaults', default_image)
                         
            eventcreated.save()
                         

            UserActivity.objects.create(
                user=eventcreated.creator,
                activity_type='event_created',
                description=f'Created "{eventcreated.title}"'
            )
            

            user = CustomUser.objects.get(id=request.user.id)
            user.event_created_count = (user.event_created_count or 0) + 1
            user.save()
            

            message = "Event created successfully! Please wait for admin approval."
            if visibility == 'private' and event_code:
                message += f" Your event code is: {event_code}"
                     
            return JsonResponse({
                'success': True,
                'message': message,
                'event_code': event_code if visibility == 'private' else None,
                'redirect_url': reverse('users:creator-home')
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error creating event: {str(e)}'
            })
    
    else:
        return render(request, "EventCreation/eventdetailscreator.html")

def generate_event_code(length=6):

    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choice(chars) for _ in range(length))
        if not Event.objects.filter(event_code=code).exists():
            return code


def EventDetailsPremiumCreator(request):
    if request.method == 'POST':

        title = request.POST.get('title')
        date_time = request.POST.get('date_time')
        location = request.POST.get('location')
        description = request.POST.get('description')
        visibility = request.POST.get('visibility')
        capacity = request.POST.get('capacity')
        event_type = request.POST.get('eventType')
        is_paid = request.POST.get('isPaid') == 'yes'
        price = request.POST.get('price') if is_paid else None
        image = request.FILES.get('image')
        default_image = request.POST.get('default_image')
        
        try:

            eventcreated = Event.objects.create(
                creator=request.user,
                title=title,
                date_time=date_time,
                location=location,
                description=description,
                visibility=visibility,
                capacity=capacity,
                status='pending',
                event_type=event_type,
                is_paid=is_paid,
                price=price,
                is_active=True,
                created_at=timezone.now()
            )
            

            if visibility == 'private':
                event_code = request.POST.get('event_code')
                if not event_code:
                    event_code = generate_event_code()  
                eventcreated.event_code = event_code
            

            if image:
                eventcreated.image = image
            elif default_image and default_image != 'None':
                eventcreated.image = os.path.join('defaults', default_image)
            
            eventcreated.save()
            

            UserActivity.objects.create(
                user=eventcreated.creator,
                activity_type='event_created',
                description=f'Created "{eventcreated.title}"'
            )
            

            user = CustomUser.objects.get(id=request.user.id)
            user.event_created_count = (user.event_created_count or 0) + 1
            user.save()
            

            message = "Event created successfully! Please wait for admin approval."
            if visibility == 'private' and event_code:
                message += f" Your event code is: {event_code}"
            
            return JsonResponse({
                'success': True,
                'message': message,
                'event_code': event_code if visibility == 'private' else None,
                'redirect_url': reverse('users:Premium-Home')
            })
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error creating event: {str(e)}'
            })
    
    else:
        return render(request, "EventCreation/eventdetailspremiumcreator.html")


def get_user_activities(request, user_id):
    try:
        activities = UserActivity.objects.filter(user_id=user_id).order_by('-timestamp')[:10]
        data = [{
            'type': activity.activity_type,
            'description': activity.description,
            'timestamp': activity.timestamp.isoformat()
        } for activity in activities]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def event_details(request, event_id):
    event = get_object_or_404(Event, id=event_id, is_active=True, is_approved=True)
    already_joined = EventParticipant.objects.filter(user=request.user, event=event).exists()
    return render(request, 'join/event_details.html', {
        'event': event,
        'already_joined': already_joined
    })

@login_required
@require_GET
def user_events_api(request, user_id):
    
    if request.user.id != user_id:
        return JsonResponse({"error": "Unauthorized"}, status=403)
    
    created_events = Event.objects.filter(creator_id=user_id)
    created_events_data = [{
        'id': event.id,
        'title': event.title,
        'date': event.date_time.astimezone(py_timezone.utc).date().isoformat(),
        'time': event.date_time.astimezone(py_timezone.utc).strftime('%I:%M %p'),
        'type': 'created',
        'status': event.status
    } for event in created_events]
    
    confirmed_participants = EventParticipant.objects.filter(user_id=request.user.id, status='confirmed')
    joined_events = Event.objects.filter(id__in=confirmed_participants.values_list('event_id', flat=True)).order_by('date_time')
    
    joined_events_data = [{
        'id': event.id,
        'title': event.title,
        'date': event.date_time.astimezone(py_timezone.utc).date().isoformat(),
        'time': event.date_time.astimezone(py_timezone.utc).strftime('%I:%M %p'),
        'type': 'joined',
        'status': event.status
    } for event in joined_events]
    
    all_events = created_events_data + joined_events_data
    return JsonResponse(all_events, safe=False)


@login_required
def leave_event(request, event_id):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                event = get_object_or_404(Event, id=event_id)
                participant = EventParticipant.objects.get(event=event, user=request.user)
                

                if request.content_type == 'application/json':
                    data = json.loads(request.body)
                    cancellation_reason = data.get('cancellation_reason', 'User left the event')
                else:
                    cancellation_reason = request.POST.get('cancellation_reason', 'User left the event')
                
                participant.cancellation_reason = cancellation_reason
                participant.status = 'canceled'
                participant.waitlist_position = None
                participant.save()
                
                UserActivity.objects.create(
                    user=request.user,
                    activity_type='event_left',
                    description=f"Left event: {event.title}",
                )
                

                current_participants = EventParticipant.objects.filter(event=event, status='confirmed').count()
                if event.capacity and current_participants < event.capacity:
                    next_waitlisted = EventParticipant.objects.filter(
                        event=event,
                        status='waitlisted'
                    ).order_by('waitlist_position').first()
                    
                    if next_waitlisted:
                        next_waitlisted.status = 'confirmed'
                        next_waitlisted.waitlist_position = None
                        next_waitlisted.payment_status = 'pending' if event.is_paid else 'not_required'
                        next_waitlisted.payment_amount = event.price if event.is_paid else None
                        next_waitlisted.save()
                        

                        UserActivity.objects.create(
                            user=next_waitlisted.user,
                            activity_type='event_joined',
                            description=f"Promoted from waitlist to confirmed for event: {event.title}",
                        )
                        

                        try:
                            payment_url = None  
                            subject = f"Confirmed: You're In for {event.title}!"
                            message = render_to_string('emails/event_confirmed_email.html', {
                                'user': next_waitlisted.user,
                                'event': event,
                                'participant': next_waitlisted,
                                'payment_url': payment_url,
                                'current_year': timezone.now().year,
                                'promotion_message': 'You have been promoted from the waitlist to confirmed status!'
                            })
                            send_mail(
                                subject=subject,
                                message='',  
                                from_email=None,  
                                recipient_list=[next_waitlisted.user.email],
                                html_message=message,
                                fail_silently=True,  
                            )
                        except Exception as email_error:
                            
                            print(f"Email sending failed: {email_error}")
                        
                        
                        remaining_waitlisted = EventParticipant.objects.filter(
                            event=event,
                            status='waitlisted'
                        ).order_by('waitlist_position')
                        
                        for index, waitlisted in enumerate(remaining_waitlisted, start=1):
                            waitlisted.waitlist_position = index
                            waitlisted.save()
                
                return JsonResponse({
                    'success': True,
                    'message': 'You have successfully left the event.',
                    'participants_count': current_participants
                })
        except Event.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Event not found'}, status=404)
        except EventParticipant.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'You are not a participant of this event'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
def view_event(request, event_id):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

    try:
        event = get_object_or_404(Event, id=event_id)
        user = request.user
        is_creator = (event.creator == user)
        is_participant = event.participants.filter(id=user.id).exists()

        if event.visibility == 'private' and not (is_creator or is_participant):
            raise PermissionDenied("You do not have permission to view this event.")

        event_data = {
            'id': event.id,
            'title': event.title,
            'date_time': event.date_time.isoformat(),
            'location': event.location,
            'description': event.description,
            'visibility': event.visibility,
            'event_type': event.event_type,
            'status': event.status,
            'is_paid': event.is_paid,
            'price': str(event.price) if event.is_paid else None,
            'capacity': event.capacity,
            'image': event.image.url if event.image else None,
        }

        response_data = {
            'success': True,
            'event': event_data,
            'is_creator': is_creator,
            'is_participant': is_participant,
        }

        return JsonResponse(response_data)

    except PermissionDenied as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=403)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'An error occurred: {str(e)}'}, status=500)


@login_required
@require_POST
def join_event_api(request, event_id):
    try:
        with transaction.atomic():
            event = get_object_or_404(Event, id=event_id, is_active=True, is_approved=True)
            
            if event.creator == request.user:
                return JsonResponse({'success': False, 'error': 'Creators cannot join their own events'}, status=400)
            
            if EventParticipant.objects.filter(user=request.user, event=event, status__in=['confirmed', 'waitlisted']).exists():
                return JsonResponse({'success': False, 'error': 'You have already joined or are waitlisted for this event'}, status=400)
            
            current_participants = EventParticipant.objects.filter(event=event, status='confirmed').count()
            waitlist_count = EventParticipant.objects.filter(event=event, status='waitlisted').count()
            
            if event.visibility == 'private':
                data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
                event_code = data.get('event_code', '')
                if event.event_code != event_code:
                    return JsonResponse({'success': False, 'error': 'Invalid event code'}, status=400)
            
            payment_status = 'pending' if event.is_paid else 'not_required'
            payment_amount = event.price if event.is_paid else None
            payment_url = None 
            
            if event.capacity and current_participants >= event.capacity:
 
                next_position = waitlist_count + 1 if waitlist_count else 1
                participant = EventParticipant.objects.create(
                    user=request.user,
                    event=event,
                    status='waitlisted',
                    waitlist_position=next_position,
                    payment_status='not_required',  
                    payment_amount=None
                )
                

                UserActivity.objects.create(
                    user=request.user,
                    activity_type='event_waitlisted',
                    description=f"Added to waitlist for event: {event.title}",
                )
                

                try:
                    subject = f"You're on the Waitlist for {event.title}"
                    message = render_to_string('emails/event_waitlisted_email.html', {
                        'user': request.user,
                        'event': event,
                        'participant': participant,
                        'current_year': timezone.now().year
                    })
                    send_mail(
                        subject=subject,
                        message='',  
                        from_email=None,  
                        recipient_list=[request.user.email],
                        html_message=message,
                        fail_silently=True, 
                    )
                except Exception as email_error:

                    print(f"Email sending failed: {email_error}")
                
                return JsonResponse({
                    'success': True,
                    'message': 'Event is full. You have been added to the waitlist.',
                    'is_waitlisted': True,
                    'waitlist_position': next_position
                })
            

            participant = EventParticipant.objects.create(
                user=request.user,
                event=event,
                status='confirmed',
                payment_status=payment_status,
                payment_amount=payment_amount
            )
            
 
            UserActivity.objects.create(
                user=request.user,
                activity_type='event_joined',
                description=f"Joined event: {event.title}",
            )
            

            user = CustomUser.objects.get(id=request.user.id)
            user.event_attended_count += 1
            user.save()
            

            try:
                subject = f"Participation Confirmed for {event.title}"
                message = render_to_string('emails/event_confirmed_email.html', {
                    'user': request.user,
                    'event': event,
                    'participant': participant,
                    'payment_url': payment_url,  
                    'current_year': timezone.now().year
                })
                send_mail(
                    subject=subject,
                    message='',  
                    from_email=None,  
                    recipient_list=[request.user.email],
                    html_message=message,
                    fail_silently=True,  
                )
            except Exception as email_error:

                print(f"Email sending failed: {email_error}")
            
            return JsonResponse({
                'success': True,
                'message': 'Successfully joined the event',
                'is_waitlisted': False,
                'participants_count': current_participants + 1
            })
    
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Event not found or not available'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def cancel_event(request, event_id):

    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required.'}, status=401)
    
    try:
        
        event = get_object_or_404(Event, id=event_id, creator=request.user)
        user_profile = request.user
        now = timezone.now()
        
   
        if request.method == 'POST' and request.body:
            import json
            data = json.loads(request.body)
            if data.get('action') == 'get_fee_details':
                if event.status != 'active' or not event.is_paid:
                    return JsonResponse({
                        'success': True,
                        'requires_payment': False,
                        'cancellation_fee': 0,
                        'fee_percentage': 0
                    })
                
                event_date_time = event.date_time
                if not timezone.is_aware(event_date_time):
                    event_date_time = timezone.make_aware(event_date_time, timezone.get_default_timezone())
                hours_to_event = (event_date_time - now).total_seconds() / 3600
                
                cancellation_fee = Decimal('0')
                fee_percentage = 0
                requires_payment = False
                
                if hours_to_event <= 72 and hours_to_event > 0:
                    requires_payment = True
                    if hours_to_event > 48:
                        fee_percentage = 50
                    elif hours_to_event > 24:
                        fee_percentage = 75
                    else:
                        fee_percentage = 100
                    cancellation_fee = event.price * Decimal(fee_percentage) / Decimal('100')
                
                return JsonResponse({
                    'success': True,
                    'requires_payment': requires_payment,
                    'cancellation_fee': float(cancellation_fee.quantize(Decimal('0.01'))),
                    'fee_percentage': fee_percentage
                })
        

        if event.status == 'pending':
            event.delete()
            return JsonResponse({
                'success': True,
                'message': 'Pending event deleted successfully.'
            })
        
        elif event.status == 'active':
            event_date_time = event.date_time
            if not timezone.is_aware(event_date_time):
                event_date_time = timezone.make_aware(event_date_time, timezone.get_default_timezone())
            hours_to_event = (event_date_time - now).total_seconds() / 3600
            
            user_profile.cancellation_count += 1
            
            if user_profile.cancellation_count >= 3:
                user_profile.is_banned = True
                user_profile.save()
                event.status = 'cancelled'
                event.canceled_at = now
                event.save()
                logout(request)
                return JsonResponse({
                    'success': False,
                    'message': 'Your account has been banned due to three cancellations. You have been logged out.'
                }, status=403)
            
            cancellation_fee = Decimal('0')
            fee_percentage = 0
            requires_payment = False
            redirect_url = None
            
            if event.is_paid and hours_to_event <= 72 and hours_to_event > 0:
                requires_payment = True
                if hours_to_event > 48:
                    fee_percentage = 50
                elif hours_to_event > 24:
                    fee_percentage = 75
                else:
                    fee_percentage = 100
                cancellation_fee = event.price * Decimal(fee_percentage) / Decimal('100')
                redirect_url = reverse('payment:cancellation_payment', args=[event_id])
                
            event.status = 'cancelled'
            event.canceled_at = now
            event.save()
            user_profile.save()
            
            response_data = {
                'success': True,
                'message': 'Event cancelled successfully.',
                'requires_payment': requires_payment,
                'cancellation_fee': float(cancellation_fee.quantize(Decimal('0.01'))),
                'fee_percentage': fee_percentage,
                'stripe_checkout_url': redirect_url
            }
            return JsonResponse(response_data)
        
        else:
            return JsonResponse({
                'success': False,
                'message': f'Cannot cancel event with status: {event.status}'
            }, status=400)
    
    except AttributeError as e:
        return JsonResponse({'success': False, 'message': f'Profile error: {str(e)}'}, status=400)
    except ValueError as e:
        return JsonResponse({'success': False, 'message': f'Datetime error: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Server error: {str(e)}'}, status=500)


def all_paid_events(request):
    now = timezone.now()

    active_events = Event.objects.filter(
        is_active=True,
        status='active',
        is_approved=True,
        date_time__gte=now
    ).exclude(visibility='private')

    if request.user.is_authenticated:
        try:
  
            active_events = active_events.exclude(creator=request.user)
            

            joined_event_ids = EventParticipant.objects.filter(
                user=request.user,
                status='confirmed'  
            ).values_list('event_id', flat=True)
            active_events = active_events.exclude(id__in=joined_event_ids)
            

            canceled_event_ids = EventParticipant.objects.filter(
                user=request.user,
                status='canceled'  
            ).values_list('event_id', flat=True)
            active_events = active_events.exclude(id__in=canceled_event_ids)
        except Exception as e:

            print(f"Error filtering events: {e}")

            active_events = Event.objects.none()
    

    paid_events = active_events.filter(
        is_paid=True
    ).order_by(
        '-creator__user_type',  
        'date_time'
    )

    
    context = {
        'paid_events': paid_events,
    }


    return render(request,'event/paidevents.html',context)
    

def all_free_events(request):
    now = timezone.now()

    active_events = Event.objects.filter(
        is_active=True,
        status='active',
        is_approved=True,
        date_time__gte=now
    ).exclude(visibility='private')

    if request.user.is_authenticated:
        try:
  
            active_events = active_events.exclude(creator=request.user)
            

            joined_event_ids = EventParticipant.objects.filter(
                user=request.user,
                status='confirmed'  
            ).values_list('event_id', flat=True)
            active_events = active_events.exclude(id__in=joined_event_ids)
            

            canceled_event_ids = EventParticipant.objects.filter(
                user=request.user,
                status='canceled'  
            ).values_list('event_id', flat=True)
            active_events = active_events.exclude(id__in=canceled_event_ids)
        except Exception as e:

            print(f"Error filtering events: {e}")

            active_events = Event.objects.none()
    
    
    non_paid_events = active_events.filter(
        is_paid=False
    ).order_by(
        '-creator__user_type', 
        'date_time'
    )
    
    context = {
        'non_paid_events': non_paid_events,
    }  

    return render(request,'event/freeevents.html',context)

def edit_event(request,id):
    user=request.user
    event=Event.objects.get(id=id)
    if request.method=='POST':
            title = request.POST.get('title')
            date_time = request.POST.get('date_time')
            location = request.POST.get('location')
            description = request.POST.get('description')
            capacity = request.POST.get('capacity')
            event_type = request.POST.get('eventType')
            
            image = request.FILES.get('image')
            default_image = request.POST.get('default_image')

            event.title=title
            event.date_time=date_time
            event.location=location
            event.description=description
            event.capacity=capacity
            event.event_type=event_type
            
            if image:
                event.image = image
            elif default_image:
                event.image = os.path.join('defaults', default_image)

            event.save()    
            return HttpResponse("edited")     
    else:
        event=Event.objects.get(id=id)
        return render(request,'EventCreation/eventdetailsjoiner.html',{'event':event})



@require_POST
@csrf_exempt
def search_private_event(request):
    try:
        data = json.loads(request.body)
        code = data.get('code')

        if not code:
            return JsonResponse({'success': False, 'message': 'No code provided'})

        event = Event.objects.filter(event_code=code, status='active').exclude(creator=request.user).first()
        if not event:
            return JsonResponse({'success': False, 'message': 'Event not found or you are the creator of this event'})

        html = render(request, 'event/privatecard.html', {'event': event}).content.decode('utf-8')
        return JsonResponse({'success': True, 'html': html})

    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})