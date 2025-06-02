from django.shortcuts import render,redirect
from django.http import JsonResponse
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from App_Event.models import Event, EventParticipant, UserActivity
from App_User.models import CustomUser
from App_Payment.models import Payment, Subscription
from App_Post.models import CommunityPost,Comment
from App_Reviews.models import Rating
from App_Message.models import Message
from datetime import datetime
import json
from django.http import Http404
from .models import Appeal
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Sum, Count
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from .models import PasswordResetToken
from django.core.mail import send_mail
from datetime import timedelta
import uuid
from django.contrib.auth.hashers import make_password


# Create your views here.
def Admin_Event_approve_Page(request):

    event=Event.objects.filter(status='pending')
    banned_users = CustomUser.objects.filter(is_banned=True)
    suspended_users = Appeal.objects.filter(user__in=banned_users)


    data={
        "event":event,
        "suspendeduser":suspended_users
    }
    return render(request,"admin/adminapprove.html",data)

def Admin_Event_approve(request,id):
    event=Event.objects.get(id=id)
    event.is_approved=True
    event.status='active'
    event.save()
    return redirect('dashboard:admin_approve_page')

def Admin_Event_reject(request,id):
    event=Event.objects.get(id=id)
    event.status='rejected'
    event.save()
    return redirect('dashboard:admin_approve_page')


def events_created_over_time(request):
    period = request.GET.get('period', 'monthly')  # Default to monthly
    if period == 'daily':
        data = Event.objects.annotate(date=TruncDay('created_at')).values('date').annotate(count=Count('id')).order_by('date')
    elif period == 'yearly':
        data = Event.objects.annotate(date=TruncYear('created_at')).values('date').annotate(count=Count('id')).order_by('date')
    else:  # monthly
        data = Event.objects.annotate(date=TruncMonth('created_at')).values('date').annotate(count=Count('id')).order_by('date')
    labels = [item['date'].strftime('%Y-%m-%d') if period == 'daily' else item['date'].strftime('%Y-%m') for item in data]
    counts = [item['count'] for item in data]
    return JsonResponse({'labels': labels, 'data': counts})

def paid_vs_non_paid(request):
    data = Event.objects.aggregate(paid=Count('id', filter=Q(is_paid=True)), non_paid=Count('id', filter=Q(is_paid=False)))
    return JsonResponse({'labels': ['Paid', 'Non-Paid'], 'data': [data['paid'], data['non_paid']]})

def canceled_vs_completed(request):
    data = Event.objects.aggregate(
        canceled=Count('id', filter=Q(canceled_at__isnull=False)),
        completed=Count('id', filter=Q(canceled_at__isnull=True, status='completed'))
    )
    return JsonResponse({'labels': ['Canceled', 'Completed'], 'data': [data['canceled'], data['completed']]})

def new_user_registration(request):
    period = request.GET.get('period', 'monthly')
    if period == 'daily':
        data = CustomUser.objects.annotate(date=TruncDay('date_joined')).values('date').annotate(count=Count('id')).order_by('date')
    elif period == 'yearly':
        data = CustomUser.objects.annotate(date=TruncYear('date_joined')).values('date').annotate(count=Count('id')).order_by('date')
    else:  # monthly
        data = CustomUser.objects.annotate(date=TruncMonth('date_joined')).values('date').annotate(count=Count('id')).order_by('date')
    labels = [item['date'].strftime('%Y-%m-%d') if period == 'daily' else item['date'].strftime('%Y-%m') for item in data]
    counts = [item['count'] for item in data]
    return JsonResponse({'labels': labels, 'data': counts})

def event_price_distribution(request):
    data = Event.objects.filter(is_paid=True).values('id', 'price', 'created_at')
    return JsonResponse({
        'data': [{'x': item['created_at'].strftime('%Y-%m-%d'), 'y': float(item['price']), 'id': item['id']} for item in data]
    })

def top_events_by_participation(request):
    data = Event.objects.annotate(participant_count=Count('participants')).order_by('-participant_count')[:3]
    return JsonResponse({
        'labels': [item.title for item in data],
        'data': [item.participant_count for item in data]
    })

def revenue_from_subscriptions(request):
    data = Payment.objects.filter(payment_type='subscription').annotate(month=TruncMonth('created_at')).values('month').annotate(total=Sum('amount')).order_by('month')
    labels = [item['month'].strftime('%Y-%m') for item in data]
    totals = [float(item['total']) for item in data]
    return JsonResponse({'labels': labels, 'data': totals})

def revenue_from_events(request):
    data = Payment.objects.filter(payment_type='event_ticket').annotate(month=TruncMonth('created_at')).values('month').annotate(total=Sum('amount')).order_by('month')
    labels = [item['month'].strftime('%Y-%m') for item in data]
    totals = [float(item['total']) for item in data]
    return JsonResponse({'labels': labels, 'data': totals})

def community_posts_over_time(request):
    data = CommunityPost.objects.annotate(month=TruncMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month')
    labels = [item['month'].strftime('%Y-%m') for item in data]
    counts = [item['count'] for item in data]
    return JsonResponse({'labels': labels, 'data': counts})

def average_event_ratings(request):
    data = Rating.objects.values('event__title').annotate(avg_rating=Avg('rating')).order_by('-avg_rating')[:5]
    return JsonResponse({
        'labels': [item['event__title'] for item in data],
        'data': [float(item['avg_rating']) for item in data]
    })

def payment_status_distribution(request):
    data = Payment.objects.aggregate(
        pending=Count('id', filter=Q(payment_status='pending')),
        completed=Count('id', filter=Q(payment_status='completed')),
        failed=Count('id', filter=Q(payment_status='failed')),
        refunded=Count('id', filter=Q(payment_status='refunded')),
        partially_refunded=Count('id', filter=Q(payment_status='partially_refunded')),
        cancelled=Count('id', filter=Q(payment_status='cancelled'))
    )
    return JsonResponse({
        'labels': ['Pending', 'Completed', 'Failed', 'Refunded', 'Partially Refunded', 'Cancelled'],
        'data': [data['pending'], data['completed'], data['failed'], data['refunded'], data['partially_refunded'], data['cancelled']]
    })

def user_activity_types(request):
    data = UserActivity.objects.values('activity_type').annotate(count=Count('id')).order_by('-count')
    return JsonResponse({
        'labels': [item['activity_type'] for item in data],
        'data': [item['count'] for item in data]
    })

def subscription_plan_distribution(request):
    data = Subscription.objects.aggregate(
        free=Count('id', filter=Q(plan_type='free')),
        creator=Count('id', filter=Q(plan_type='creator')),
        premium=Count('id', filter=Q(plan_type='premium'))
    )
    return JsonResponse({
        'labels': ['Free', 'Creator', 'Premium'],
        'data': [data['free'], data['creator'], data['premium']]
    })

def top_active_users(request):
    data = CustomUser.objects.annotate(activity_score=Count('activities') + Count('community_posts') + Count('participated_events')).order_by('-activity_score')[:5]
    return JsonResponse({
        'labels': [item.username for item in data],
        'data': [item.activity_score for item in data]
    })


def admin_analitics(request):
    return render(request,'admin/adminanalitics.html')

def Admin_view_user(request):
    all_user=CustomUser.objects.all().exclude(is_superuser=True)

    joiner=CustomUser.objects.filter(user_type='joiner')
    creator=CustomUser.objects.filter(user_type='creator')
    premium=CustomUser.objects.filter(user_type='premium')

    suspended_user=CustomUser.objects.filter(is_banned=True)

    context={
        'all_user':all_user,
        'joiner':joiner,
        'creator':creator,
        'premium':premium,
        'suspended_user':suspended_user
    }

    return render(request,"admin/adminviewuser.html",context)   


def Banneduser(request):
    if request.method == 'POST':
        now = timezone.now()
        username = request.POST.get('username')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        reason = request.POST.get('reason')
        uploaded_file = request.FILES.get('proof')
        
        # Check if username exists
        if not CustomUser.objects.filter(username__iexact=username).exists():
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'username__not_exists',
                    'message': 'Username does not exist, please check and try again.'
                }, status=400)
            else:
                return render(request, 'admin/appeal.html', {
                    'error': 'username__not_exists',
                    'message': 'Username does not exist, please check and try again.'
                })
        
        # Check if email exists
        elif not CustomUser.objects.filter(email__iexact=email).exists():
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'email_not_exists',
                    'message': 'Your email does not exist in our system.'
                }, status=400)
            else:
                return render(request, 'admin/appeal.html', {
                    'error': 'email_not_exists',
                    'message': 'Your email does not exist in our system.'
                })
        
        # Check if username and email belong to the same user
        user_by_username = CustomUser.objects.filter(username__iexact=username).first()
        user_by_email = CustomUser.objects.filter(email__iexact=email).first()
        
        if user_by_username != user_by_email:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'user_mismatch',
                    'message': 'Username and email do not match the same account.'
                }, status=400)
            else:
                return render(request, 'admin/appeal.html', {
                    'error': 'user_mismatch',
                    'message': 'Username and email do not match the same account.'
                })
        
        # Check if user is actually banned
        if not user_by_username.is_banned:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'user_not_banned',
                    'message': 'This account is not currently banned.'
                }, status=400)
            else:
                return render(request, 'admin/appeal.html', {
                    'error': 'user_not_banned',
                    'message': 'This account is not currently banned.'
                })
        
        # Check if user has already submitted an appeal recently (optional)
        recent_appeal = Appeal.objects.filter(
            username__iexact=username,
            submitted_at__gte=now - timezone.timedelta(days=7)
        ).first()
        
        if recent_appeal:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'recent_appeal_exists',
                    'message': 'You have already submitted an appeal within the last 7 days. Please wait for review.'
                }, status=400)
            else:
                return render(request, 'admin/appeal.html', {
                    'error': 'recent_appeal_exists',
                    'message': 'You have already submitted an appeal within the last 7 days. Please wait for review.'
                })
        
        try:
            # Create the appeal
            appeal = Appeal.objects.create(
                user=user_by_username,  # Add the user relationship
                username=username,
                email=email,
                subject=subject,
                appeal_message=reason,
                submitted_at=now,
                uploaded_file=uploaded_file
            )
            
            # Log the appeal submission (optional)
            # You might want to create a log entry here
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Appeal submitted successfully!'
                })
            else:
                return render(request, 'admin/appeal.html', {
                    'success': True,
                    'message': 'Appeal submitted successfully!'
                })
                
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'submission_failed',
                    'message': 'Failed to submit appeal. Please try again later.'
                }, status=500)
            else:
                return render(request, 'admin/appeal.html', {
                    'error': 'submission_failed',
                    'message': 'Failed to submit appeal. Please try again later.'
                })
    
    else:
        return render(request, 'admin/appeal.html')


def revoke_ban(request,user_id):
    user=CustomUser.objects.get(id=user_id)
    user.is_banned=False
    user.cancellation_count=0
    user.save()
    return redirect('dashboard:admin_approve_page')





@login_required
def view_events(request):
    now = timezone.now()
    
    # Active Events (with date_time__gte=now reintroduced)
    active_events = Event.objects.filter(
        status='active',
        is_active=True,
        date_time__gte=now
    ).annotate(
        attendee_count=Count('participants', filter=Q(participants__status='confirmed'))
    ).select_related('creator').order_by('date_time')
    
    # Completed Events
    completed_events = Event.objects.filter(
        date_time__lt=now,
        status='completed',
        is_active=True
    ).annotate(
        attendee_count=Count('participants', filter=Q(participants__attended=True)),
        average_rating=Avg('rating__rating')
    ).select_related('creator').order_by('-date_time')
    
    # Cancelled Events
    cancelled_events = Event.objects.filter(
        Q(status='cancelled') | Q(is_active=False)
    ).annotate(
        attendee_count=Count('participants')
    ).select_related('creator').order_by('-canceled_at', '-created_at')
    
    # Format data for template
    active_events_data = [{
        'id': event.id,
        'title': event.title,
        'date': event.date_time,
        'attendees': event.attendee_count,
        'capacity': event.capacity,
        'created_date': event.created_at,
        'price': event.price if event.is_paid else 0,
        'is_paid': event.is_paid,
        'location': event.location,
        'creator': event.creator.username,
        'event_type': event.event_type,
    } for event in active_events]
    
    completed_events_data = [{
        'id': event.id,
        'title': event.title,
        'date': event.date_time,
        'attendees': event.attendee_count,
        'average_rating': round(event.average_rating, 1) if event.average_rating is not None else 0,
        'price': event.price if event.is_paid else 0,
        'is_paid': event.is_paid,
        'location': event.location,
        'creator': event.creator.username,
        'event_type': event.event_type,
    } for event in completed_events]
    
    cancelled_events_data = [{
        'id': event.id,
        'title': event.title,
        'date': event.date_time,
        'cancelled_date': event.canceled_at if event.canceled_at else event.created_at,
        'attendees': event.attendee_count,
        'price': event.price if event.is_paid else 0,
        'is_paid': event.is_paid,
        'location': event.location,
        'creator': event.creator.username,
        'event_type': event.event_type,
    } for event in cancelled_events]
    
    context = {
        'active_events': active_events_data,
        'completed_events': completed_events_data,
        'cancelled_events': cancelled_events_data,
        'active_count': len(active_events_data),
        'completed_count': len(completed_events_data),
        'cancelled_count': len(cancelled_events_data),
    }
    
    return render(request, 'admin/adminviewevents.html', context)



def get_users(request):
    users = CustomUser.objects.all().exclude(is_superuser=True)
    user_data = [
        {
            'id': user.id,
            'username': user.username or f'user_{user.id}',  # Fallback for null/empty username
            'email': user.email,
            'user_type': user.user_type,
            'profile_picture': user.profile_picture.url if user.profile_picture else '/media/profile_pics/default.jpg',
            'is_banned': user.is_banned
        }
        for user in users
    ]
    return JsonResponse({'users': user_data})


def get_user_details(request, user_id):
    try:
        # Fetch the user with minimal database queries
        user = CustomUser.objects.get(id=user_id)

        # Fetch message counts and group message details
        messages = Message.objects.filter(sender=user).select_related('event')
        direct_message_count = messages.filter(message_type='direct').count()
        group_messages = messages.filter(message_type='group')
        group_message_details = (
            group_messages
            .values('event__title')
            .annotate(message_count=Count('id'))
            .exclude(event__title__isnull=True)
            .order_by('event__title')
        )
        group_message_details_list = [
            {'group_name': detail['event__title'], 'message_count': detail['message_count']}
            for detail in group_message_details
        ]

        # Fetch posts, likes, and comments
        posts = CommunityPost.objects.filter(user=user)
        total_posts = posts.count()
        total_likes = posts.aggregate(total_likes=Sum('like_count'))['total_likes'] or 0

        # Fetch and paginate comments
        comments = Comment.objects.filter(post__in=posts).order_by('-created_at')
        total_comments = comments.count()
        comments_per_page = 5
        paginator = Paginator(comments, comments_per_page)
        page_number = request.GET.get('page', 1)
        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            # If page is out of range, return the last page
            page_obj = paginator.page(paginator.num_pages)
        paginated_comments = [
            {
                'content': comment.text,
                'created_at': comment.created_at,
            }
            for comment in page_obj
        ]

        # Fetch events the user left
        events_left = EventParticipant.objects.filter(user=user, status='canceled').select_related('event')
        events_left_data = [
            {
                'event_title': participant.event.title if participant.event else 'Unknown Event',
                'cancellation_reason': participant.cancellation_reason or 'Not specified',
            }
            for participant in events_left
        ]

        # Prepare response data
        response_data = {
            'user': {
                'username': user.username,  # Add username
                'profile_picture': user.profile_picture.url if user.profile_picture else '/media/profile_pics/default.jpg',  # Add profile_picture
                'full_name': user.full_name if hasattr(user, 'full_name') else f"{user.first_name} {user.last_name}".strip() or 'N/A',
                'email': user.email,
                'user_type': user.user_type or 'N/A',  # Add user_type for modal header
                'events_created': user.event_created_count,
                'events_attended': user.event_attended_count,
            },
            'messages': {
                'total_direct_messages': direct_message_count,
                'total_group_messages': group_messages.count(),
                'group_message_details': group_message_details_list,
            },
            'posts': {
                'total_posts': total_posts,
                'total_likes': total_likes,
                'total_comments': total_comments,
                'comments': {
                    'current_page': page_obj.number,
                    'total_pages': paginator.num_pages,
                    'comments': paginated_comments,
                },
            },
            'events_left': {
                'total': events_left.count(),
                'details': events_left_data,
            },
        }

        return JsonResponse(response_data)

    except CustomUser.DoesNotExist:
        raise Http404("User does not exist")
    except Exception as e:
        # Log unexpected errors for debugging (in production, use proper logging)
        print(f"Error in get_user_details: {str(e)}")
        return JsonResponse({'error': 'An unexpected error occurred'}, status=500)
    


def reset_password(request):
    if request.method == "POST":
        username = request.POST.get('username')
        email = request.POST.get('email')

        # Check if username exists
        user_by_username = CustomUser.objects.filter(username__iexact=username).first()
        if not user_by_username:
            return JsonResponse({
                'success': False,
                'error': 'username_not_exists',
                'message': 'Username does not exist.'
            }, status=400) if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else render(
                request, 'admin/forgetpassword.html', {'error': 'username_not_exists', 'message': 'Username does not exist.'}
            )

        # Check if email exists
        user_by_email = CustomUser.objects.filter(email__iexact=email).first()
        if not user_by_email:
            return JsonResponse({
                'success': False,
                'error': 'email_not_exists',
                'message': 'Email does not exist.'
            }, status=400) if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else render(
                request, 'admin/forgetpassword.html', {'error': 'email_not_exists', 'message': 'Email does not exist.'}
            )

        # Check if they refer to the same user
        if user_by_username != user_by_email:
            return JsonResponse({
                'success': False,
                'error': 'user_mismatch',
                'message': 'Username and email do not match.'
            }, status=400) if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else render(
                request, 'admin/forgetpassword.html', {'error': 'user_mismatch', 'message': 'Username and email do not match.'}
            )

        user = user_by_username  # now confirmed to be the same

        # Create a password reset token
        token = PasswordResetToken.objects.create(
            user=user,
            token=uuid.uuid4(),
            expires_at=timezone.now() + timedelta(minutes=30)
        )

        # Create reset link
        reset_link = f"http://127.0.0.1:8000/dashboard/reset-password-form/?token={token.token}"


        # Send reset email
        send_mail(
            subject="Password Reset Request",
            message=f"Click the following link to reset your password:\n{reset_link}",
            from_email=None,
            recipient_list=[user.email],
        )

        return JsonResponse({
            'success': True,
            'message': 'Password reset link sent to your email.'
        }) if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else render(
            request, 'admin/forgetpassword.html', {'success': True, 'message': 'Password reset link sent.'}
        )
    else:
        return render(request,'admin/forgetpassword.html')
    

def reset_password_form(request):
    token = request.GET.get('token')
    return render(request, 'admin/reset_password.html', {'token': token})



def reset_password_confirm(request):
    if request.method == "POST":
        token_value = request.POST.get("token")
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")

        # Basic validations
        if not all([token_value, new_password, confirm_password]):
            return render(request, "reset_password_form.html", {
                "error": "Missing required fields.",
                "token": token_value
            })

        if new_password != confirm_password:
            return render(request, "reset_password_form.html", {
                "error": "Passwords do not match.",
                "token": token_value
            })

        try:
            token = PasswordResetToken.objects.get(token=token_value)
        except PasswordResetToken.DoesNotExist:
            return render(request, "reset_password_form.html", {
                "error": "Invalid or expired token."
            })

        if token.used:
            return render(request, "reset_password_form.html", {
                "error": "This token has already been used."
            })

        if token.is_expired():
            return render(request, "reset_password_form.html", {
                "error": "This token has expired."
            })

        user = token.user

        # Update user's password
        user.password = make_password(new_password)
        user.save()

        # Mark token as used
        token.used = True
        token.save()

        return render(request, "admin/reset_password_success.html")
