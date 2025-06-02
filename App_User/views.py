from django.shortcuts import render, redirect,get_object_or_404
from django.contrib.auth import login,authenticate,logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from App_Event.models import Event,UserActivity,EventParticipant
from .models import CustomUser
from App_Message.models import Message
from App_Reviews.models import Rating
import stripe
from django.conf import settings
stripe.api_key = settings.STRIPE_SECRET_KEY
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum,Avg


# Create your views here.


def home(request):
    now = timezone.now()

    
    # Calculate statistics
    total_users = CustomUser.objects.count()
    total_cities = Event.objects.values('location').distinct().count()
    total_events = Event.objects.count()
    
    # Filter active, approved, upcoming events
    active_events = Event.objects.filter(
        is_active=True,
        status='active',
        is_approved=True,
        date_time__gte=now
    ).exclude(visibility='private')
    
    # Exclude events for authenticated users
    if request.user.is_authenticated:
        try:
            # Exclude events created by the user
            active_events = active_events.exclude(creator=request.user)
            
            # Exclude events where the user has joined
            joined_event_ids = EventParticipant.objects.filter(
                user=request.user,
                status='confirmed'  # Case-insensitive match
            ).values_list('event_id', flat=True)
            active_events = active_events.exclude(id__in=joined_event_ids)
            
            # Exclude events where the user canceled participation
            canceled_event_ids = EventParticipant.objects.filter(
                user=request.user,
                status='canceled'  # Case-insensitive match
            ).values_list('event_id', flat=True)
            active_events = active_events.exclude(id__in=canceled_event_ids)
        except Exception as e:
            # Log the error for debugging (in a real app, use proper logging)
            print(f"Error filtering events: {e}")
            # Fallback to showing no events to avoid incorrect data
            active_events = Event.objects.none()
    
    # Split into paid and non-paid events, prioritizing premium users
    paid_events = active_events.filter(
        is_paid=True
    ).order_by(
        '-creator__user_type',  # Premium first
        'date_time'
    )
    
    non_paid_events = active_events.filter(
        is_paid=False
    ).order_by(
        '-creator__user_type',  # Premium first
        'date_time'
    )
    
    context = {
        'paid_events': paid_events,
        'non_paid_events': non_paid_events,
        'total_users': total_users,
        'total_cities': total_cities,
        'total_events': total_events,
    }
    
    return render(request, "index/index.html", context)


def user_register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        profile_picture = request.FILES.get('profile_picture')

        # Validate inputs
        if not all([username, email, password1, password2]):
            return render(request, 'index/users-register.html', {
                'error': 'missing_fields',
                'message': 'All required fields must be filled.'
            })

        if CustomUser.objects.filter(username__iexact=username).exists():
            return render(request, 'index/users-register.html', {
                'error': 'username_exists',
                'message': 'Username exists, please choose another.'
            })

        if CustomUser.objects.filter(email__iexact=email).exists():
            return render(request, 'index/users-register.html', {
                'error': 'email_exists',
                'message': 'Your email already exists, please log in.'
            })

        if password1 != password2:
            return render(request, 'index/users-register.html', {
                'error': 'password_mismatch',
                'message': 'Passwords do not match.'
            })

        # Create user
        try:
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password1,
                first_name=first_name,
                last_name=last_name,
                profile_picture=profile_picture,
                user_type='joiner'
            )
            login(request, user)
            
            # Always render the plan selection page
            return render(request, 'index/users-plan_selection.html', {'userdata': user})
                     
        except Exception as e:
            return render(request, 'index/users-register.html', {
                'error': 'server_error',
                'message': f'An error occurred: {str(e)}'
            })
    else:
        return render(request, 'index/users-register.html')
    

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Check if user is banned
            if user.is_banned:
                return render(request,'admin/appeal.html')  # Redirect to banned user page

            login(request, user)

            if user.is_superuser:
                request.session['a_id'] = user.id
                return redirect('dashboard:admin-view-user')

            # Standard users (joiner, creator, premium)
            request.session['user_id'] = user.id
            request.session['user_type'] = user.user_type

            UserActivity.objects.create(
                user=user,
                activity_type='login',
                description='User logged in'
            )

            return redirect('users:home')

        return render(request, 'index/users-login.html', {'error': 'Invalid username or password.'})
    else:
        return render(request, 'index/users-login.html')

    
def planFree(request,id):
    User=CustomUser.objects.get(id=id)
    User.user_type = 'joiner'
    User.is_premium = False
    User.badge = 'Bronze'
    User.save()
    return redirect('users:user-login')


def planCreator(request,id):
    User=CustomUser.objects.get(id=id)
    User.user_type = 'creator'
    User.is_premium = False
    User.badge = 'Silver'
    User.save()
    return redirect('users:user-login')


def planPremium(request,id):
    User=CustomUser.objects.get(id=id)
    User.user_type = 'premium'
    User.is_premium = True
    User.badge = 'Diamond'
    User.save()
    return redirect("users:user-login")


@login_required
def Adminhome(request):
    id=request.session['a_id']
    User=CustomUser.objects.get(id=id)
    event=Event.objects.filter(status='pending')
    data={
        "User":User,
        "event":event
    }
    
    return render(request,'admin/homeadmin.html',data)


@login_required
def Joinerhome(request):
    if not request.user.is_authenticated:
        return redirect('login')  # Ensure this matches your login URL name

    user = request.user

    # Calculate the number of events created by the user
    user.created_events_count = Event.objects.filter(creator=user).count()
    
    # Calculate remaining events (3 - created_events_count)
    remaining_events = 3 - user.created_events_count

    # Get events created by the user
    eventcreated = Event.objects.select_related('creator').filter(creator=user)

    # Get confirmed events the user has joined
    confirmed_participants = EventParticipant.objects.filter(user_id=user.id, status='confirmed')

    # Upcoming joined events
    eventjoined = Event.objects.select_related('creator').filter(
        id__in=confirmed_participants.values_list('event_id', flat=True),
        date_time__gte=timezone.now()
    ).order_by('date_time')

    # Past joined events with ratings
    eventjoined_over = Event.objects.select_related('creator').prefetch_related('rating_set').filter(
        id__in=confirmed_participants.values_list('event_id', flat=True),
        date_time__lt=timezone.now()
    ).order_by('date_time')

    # Fetch ratings for eventjoined_over by the current user
    event_ids = eventjoined_over.values_list('id', flat=True)
    user_ratings = Rating.objects.filter(
        event_id__in=event_ids,
        user=user
    ).select_related('event')

    # Get recommended events (active events the user hasn't joined)
    joined_event_ids = confirmed_participants.values_list('event_id', flat=True)
    recommended_events = Event.objects.select_related('creator').filter(
        status='Active'
    ).exclude(id__in=joined_event_ids).order_by('date_time')[:5]

    # Fetch recent messages
    recent_messages = Message.objects.filter(recipients=user).order_by('-sent_at')[:3].values(
        'event__title', 'content', 'is_read'
    )
    recent_messages = [
        {
            'event_name': msg['event__title'],
            'preview': msg['content'][:50] + '...' if len(msg['content']) > 50 else msg['content'],
            'unread_count': 1 if not msg['is_read'] else 0,
        }
        for msg in recent_messages
    ]

    # Fetch direct messages
    direct_messages = Message.objects.filter(
        recipients=user,
        message_type='direct'
    ).select_related('sender', 'event').order_by('-sent_at')[:10]

    # Pass the context to the template
    context = {
        'data': {
            'id': user.id,
            'username': user.username,
        },
        'eventcreated': eventcreated,
        'eventjoined': eventjoined,
        'eventjoined_over': eventjoined_over,
        'user_ratings': user_ratings,
        'recommended_events': recommended_events,
        'recent_messages': recent_messages,
        'remaining_events': remaining_events,
        'direct_messages': direct_messages,
    }

    return render(request, 'user-homepage/homeJoiner.html', context)


@login_required
def creatorhome(request):
    user=request.user

    # Created events (only upcoming)
    eventcreated = Event.objects.select_related('creator').filter(
        creator=user,
        date_time__gte=timezone.now()
    )
    eventdate = Event.objects.select_related('creator').filter(
        creator=user,
        date_time__gte=timezone.now()
    )
    eventover = Event.objects.select_related('creator').filter(
        creator=user,
        date_time__lt=timezone.now()
    )
    paid_events_count = Event.objects.filter(creator=user, is_paid=True).count()

    # Joined events (only upcoming)
    confirmed_participants = EventParticipant.objects.filter(user_id=request.user.id, status='confirmed')

    eventjoined = Event.objects.select_related('creator').filter(
        id__in=confirmed_participants.values_list('event_id', flat=True),
        date_time__gte=timezone.now()
    ).order_by('date_time')

    # Joined events (already over) with ratings
    eventjoined_over = Event.objects.select_related('creator').prefetch_related('rating_set').filter(
        id__in=confirmed_participants.values_list('event_id', flat=True),
        date_time__lt=timezone.now()
    ).order_by('date_time')

    # Fetch ratings for eventjoined_over by the current user
    event_ids = eventjoined_over.values_list('id', flat=True)
    user_ratings = Rating.objects.filter(
        event_id__in=event_ids,
        user=request.user
    ).select_related('event')

    # Direct messages
    direct_messages = Message.objects.filter(
        recipients=user,
        message_type='direct'
    ).select_related('sender', 'event').order_by('-sent_at')[:10]

    context = {
        'data': user,
        'eventcreated': eventcreated,
        'eventdate': eventdate,
        'eventover': eventover,
        'eventjoined': eventjoined,
        'eventjoined_over': eventjoined_over,
        'user_ratings': user_ratings,
        'paid_events_count': paid_events_count,
        'direct_messages': direct_messages,
    }

    return render(request, 'user-homepage/homecreator.html', context)


@login_required
def PremiumHome(request):
    user=request.user

    # Created events (only upcoming)
    eventcreated = Event.objects.select_related('creator').filter(
        creator=user,
        date_time__gte=timezone.now()
    )

    # Joined events
    confirmed_participants = EventParticipant.objects.filter(user_id=request.user.id, status='confirmed')

    # Upcoming joined events
    eventjoined = Event.objects.select_related('creator').filter(
        id__in=confirmed_participants.values_list('event_id', flat=True),
        date_time__gte=timezone.now()
    ).order_by('date_time')

    # Past joined events with ratings
    eventjoined_over = Event.objects.select_related('creator').prefetch_related('rating_set').filter(
        id__in=confirmed_participants.values_list('event_id', flat=True),
        date_time__lt=timezone.now()
    ).order_by('date_time')

    # Fetch ratings for eventjoined_over by the current user
    event_ids = eventjoined_over.values_list('id', flat=True)
    user_ratings = Rating.objects.filter(
        event_id__in=event_ids,
        user=request.user
    ).select_related('event')


    active_events=Event.objects.filter(
        creator=user,
        status='active'
    ).count()

    total_attendees = EventParticipant.objects.filter(
        event__creator=user,
        event__status__in=['active', 'completed']
    ).count()

    total_revenue = EventParticipant.objects.filter(
        event__creator=user,
        event__is_paid=True,
        event__status__in=['active', 'completed']
    ).aggregate(total=Sum('payment_amount'))['total'] or 0

    total_tickets_sold = EventParticipant.objects.filter(
        event__creator=user,
        event__is_paid=True,
        event__status__in=['active', 'completed']
    ).count()
    

    context = {
        'data': user,
        'eventcreated': eventcreated,
        'eventjoined': eventjoined,
        'eventjoined_over': eventjoined_over,
        'user_ratings': user_ratings,
        "active_events":active_events,
        "total_attendees":total_attendees,
        "total_revenue":total_revenue,
        "total_tickets_sold":total_tickets_sold
    }

    return render(request, 'user-homepage/homePremium.html', context)


def userlogout(request):
  user = request.user
  activity=UserActivity.objects.create(
            user=user,
            activity_type='logout',
            description='User logged out'
        )
  activity.save()
  logout(request)
  return redirect("users:user-login")


def upgrade(request,):
    user=request.user
    return render(request,'index/users-plan_selection.html', {'userdata':user})


@login_required
def user_profile(request):
    user = request.user
    
    # Ensure user is authenticated and a valid CustomUser
    if not isinstance(user, CustomUser):
        return render(request, 'user-homepage/profile.html', {'error': 'Invalid user'})
    
    # Fetch user details
    user_data = {
        'username': user.username,
        'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'joined_date': user.date_joined.strftime('%B %Y') if user.date_joined else 'Unknown',
        'profile_picture': user.profile_picture.url if user.profile_picture else '/static/default.jpg',
    }
    
    avg_rating = Rating.objects.filter(
        event__creator=user
    ).aggregate(avg=Avg('rating'))['avg'] or 0
    avg_rating = round(avg_rating, 1) if avg_rating else 0
    
    total_attendees = EventParticipant.objects.filter(
        event__creator=user,
        event__is_active=True
    ).count()
    
    upcoming_events_count = Event.objects.filter(
        creator=user,
        date_time__gte=timezone.now(),
        is_active=True
    ).count()
    
    completed_events_count = Event.objects.filter(
        creator=user,
        date_time__lt=timezone.now(),
        is_active=True
    ).count()
    
    events_created_count = user.event_created_count
    
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    events_created_this_month = Event.objects.filter(
        creator=user,
        created_at__gte=current_month
    ).count()
    
    events_joined_count = user.event_attended_count
    
    events_joined_this_month = EventParticipant.objects.filter(
        user=user,
        joined_at__gte=current_month
    ).count()
    
    recent_events_created = Event.objects.filter(
        creator=user,
        is_active=True
    ).order_by('-created_at')[:3]
    
    # Updated to include event ID for the eye button
    recent_events_created_data = [
        {
            'id': event.id,  # Added event ID
            'title': event.title,
            'description': event.description,
            'date': event.date_time.strftime('%B %d, %Y'),
            'location': event.location,
            'participants': event.participants.count(),
            'status': 'Upcoming' if event.date_time >= timezone.now() else 'Completed',
        }
        for event in recent_events_created
    ]
    
    recent_events_joined = EventParticipant.objects.filter(
        user=user
    ).select_related('event').order_by('-joined_at')[:3]
    
    recent_events_joined_data = [
        {
            'title': ep.event.title,
            'description': ep.event.description,
            'date': ep.event.date_time.strftime('%B %d, %Y'),
            'location': ep.event.location,
            'creator': ep.event.creator.username,
            'status': 'Upcoming' if ep.event.date_time >= timezone.now() else 'Completed',
        }
        for ep in recent_events_joined
    ]
    
    context = {
        'user_data': user_data,
        'stats': {
            'avg_rating': avg_rating,
            'total_attendees': total_attendees,
            'upcoming_events': upcoming_events_count,
            'completed_events': completed_events_count,
            'events_created': events_created_count,
            'events_created_this_month': events_created_this_month,
            'events_joined': events_joined_count,
            'events_joined_this_month': events_joined_this_month,
        },
        'recent_events_created': recent_events_created_data,
        'recent_events_joined': recent_events_joined_data,
    }
    
    return render(request, 'user-homepage/profile.html', context)


@login_required
def get_event_participants(request, event_id):

    try:
        # Get the event and ensure the current user is the creator
        event = get_object_or_404(Event, id=event_id, creator=request.user, is_active=True)
        
        # Get all participants for this event
        participants = EventParticipant.objects.filter(
            event=event
        ).select_related('user').order_by('-joined_at')
        
        # Prepare participant data
        participant_data = []
        for participant in participants:
            participant_data.append({
                'username': participant.user.username,
                'full_name': f"{participant.user.first_name} {participant.user.last_name}".strip() or participant.user.username,
                'email': participant.user.email,
                'profile_picture': participant.user.profile_picture.url if participant.user.profile_picture else '/static/default.jpg',
                'joined_at': participant.joined_at.strftime('%B %d, %Y at %I:%M %p'),
                'status': participant.status,
                'payment_status': participant.payment_status,
                'attended': participant.attended,
            })
        
        return JsonResponse({
            'success': True,
            'event_title': event.title,
            'total_participants': len(participant_data),
            'participants': participant_data
        })
        
    except Event.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Event not found or you do not have permission to view participants.'
        }, status=404)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': 'An error occurred while fetching participants.'
        }, status=500)


@login_required
def Adminhome(request):   
    return render(request,'admin/homeadmin.html')




def about(request):
    return render(request,'index/about.html')

def contact(request):
    return render(request,'index/contact.html')