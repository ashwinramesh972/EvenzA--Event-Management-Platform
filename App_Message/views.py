from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import json
from django.db import transaction
from django.views.decorators.http import require_GET, require_POST
from App_Event.models import Event, EventParticipant
from .models import Message
from App_User.models import CustomUser
from django.db.models import Q, Max, Count
from django.utils import timezone


@login_required
def messages_home(request):

    # Direct conversations (no event participation check)
    direct_conversations = Message.objects.filter(
        Q(sender=request.user) | Q(recipients=request.user),
        message_type='direct'
    ).values(
        'sender',
        'recipients'
    ).annotate(
        last_message_time=Max('sent_at')
    ).order_by('-last_message_time')[:5]
    
    direct_messages_preview = []
    processed_conversations = set()
    
    for conv in direct_conversations:
        sender = CustomUser.objects.get(id=conv['sender'])
        
        if sender == request.user:
            recipient_id = Message.objects.filter(
                sender=request.user,
                message_type='direct'
            ).values_list('recipients', flat=True).first()
            if not recipient_id:
                continue
            partner = CustomUser.objects.get(id=recipient_id)
        else:
            partner = sender
        
        conv_identifier = f"{min(request.user.id, partner.id)}_{max(request.user.id, partner.id)}"
        
        if conv_identifier not in processed_conversations:
            last_message = Message.objects.filter(
                Q(sender=request.user, recipients=partner) | 
                Q(sender=partner, recipients=request.user),
                message_type='direct'
            ).order_by('-sent_at').first()
            
            direct_messages_preview.append({
                'partner': partner,
                'last_message': last_message,
                'unread_count': Message.objects.filter(
                    sender=partner,
                    recipients=request.user,
                    message_type='direct',
                    is_read=False
                ).count()
            })
            
            processed_conversations.add(conv_identifier)
    
    # My Events (created by the user)
    my_events = Event.objects.filter(
        creator=request.user
    ).annotate(
        last_message_time=Max('message__sent_at', filter=Q(message__message_type='group')),
        unread_count=Count('message', filter=Q(
            message__message_type='group',
            message__is_read=False,
            message__recipients=request.user
        ))
    ).order_by('-last_message_time')[:5]
    
    my_events_preview = []
    for event in my_events:
        last_message = Message.objects.filter(
            event=event,
            message_type='group'
        ).order_by('-sent_at').first()
        
        my_events_preview.append({
            'event': event,
            'last_message': last_message,
            'unread_count': event.unread_count
        })
    
    # Joined Events (user is a confirmed participant)
    joined_events = Event.objects.filter(
        participants__user=request.user,
        participants__status='confirmed',
        status='active'
    ).exclude(
        creator=request.user  # Exclude events created by the user
    ).annotate(
        last_message_time=Max('message__sent_at', filter=Q(message__message_type='group')),
        unread_count=Count('message', filter=Q(
            message__message_type='group',
            message__is_read=False,
            message__recipients=request.user
        ))
    ).order_by('-last_message_time')[:5]
    
    joined_events_preview = []
    for event in joined_events:
        last_message = Message.objects.filter(
            event=event,
            message_type='group'
        ).order_by('-sent_at').first()
        
        joined_events_preview.append({
            'event': event,
            'last_message': last_message,
            'unread_count': event.unread_count
        })
    
    # Initial chat area context (optional: pre-select a conversation via URL params)
    event = None
    recipient = None
    messages = []
    limit_message = None
    show_upgrade_prompt = False
    
    return render(request, 'messages/messages_home.html', {
        'direct_conversations': direct_messages_preview,
        'my_events_preview': my_events_preview,
        'joined_events_preview': joined_events_preview,
        'event': event,
        'recipient': recipient,
        'messages': messages,
        'limit_message': limit_message,
        'show_upgrade_prompt': show_upgrade_prompt,
        'userdata': request.user
    })

@login_required
def direct_messages(request):

    
    direct_conversations = Message.objects.filter(
        Q(sender=request.user) | Q(recipients=request.user),
        message_type='direct'
    ).values(
        'event',
        'sender',
        'recipients'
    ).annotate(
        last_message_time=Max('sent_at')
    ).order_by('-last_message_time')
    
    conversations = []
    processed_conversations = set()
    
    for conv in direct_conversations:
        event = Event.objects.get(id=conv['event'])
        
        users_in_conv = Message.objects.filter(
            event=event,
            message_type='direct'
        ).values_list('sender', 'recipients').distinct()
        
        for sender_id, recipient_id in users_in_conv:
            sender = CustomUser.objects.get(id=sender_id)
            recipient = CustomUser.objects.get(id=recipient_id)
            
            if sender == request.user:
                partner = recipient
            elif recipient == request.user:
                partner = sender
            else:
                continue
            
            conv_identifier = f"{min(request.user.id, partner.id)}_{max(request.user.id, partner.id)}_{event.id}"
            
            if conv_identifier not in processed_conversations:
                last_message = Message.objects.filter(
                    Q(sender=request.user, recipients=partner) | 
                    Q(sender=partner, recipients=request.user),
                    event=event,
                    message_type='direct'
                ).order_by('-sent_at').first()
                
                conversations.append({
                    'event': event,
                    'partner': partner,
                    'last_message': last_message,
                    'unread_count': Message.objects.filter(
                        sender=partner,
                        recipients=request.user,
                        event=event,
                        message_type='direct',
                        is_read=False
                    ).count()
                })
                
                processed_conversations.add(conv_identifier)
    
    return render(request, 'messages/direct_messages.html', {
        'conversations': conversations,
        'userdata': request.user
    })

@login_required
def get_direct_messages(request, recipient_id):

    
    recipient = get_object_or_404(CustomUser, id=recipient_id)

    messages = Message.objects.filter(
        Q(sender=request.user, recipients=recipient) |
        Q(sender=recipient, recipients=request.user),
        message_type='direct'
    ).order_by('sent_at')

    Message.objects.filter(
        sender=recipient,
        recipients=request.user,
        message_type='direct',
        is_read=False
    ).update(is_read=True)

    messages_data = [{
        'id': message.id,
        'content': message.content,
        'sent_at': message.sent_at.isoformat(),
        'sender': {
            'id': message.sender.id,
            'username': message.sender.username
        }
    } for message in messages]

    return JsonResponse({
        'success': True,
        'messages': messages_data
    })

@login_required
@csrf_exempt
def send_message(request):
    
    if request.method == 'POST':
        recipient_id = request.POST.get('recipient_id')
        content = request.POST.get('content')
        recipient = CustomUser.objects.filter(id=recipient_id).first()
        if  not recipient or not content:
            return JsonResponse({'status': 'error', 'message': 'Invalid data'}, status=400)
        
        # Check message limits
        user_type = request.user.user_type
        if user_type == 'premium':
            pass
        elif user_type == 'creator':
            direct_count = Message.objects.filter(
                sender=request.user,
                message_type='direct'
            ).count()
            if direct_count >= 10:
                return JsonResponse({'status': 'error', 'message': 'Direct message limit (10) reached for creators'}, status=403)
        elif user_type == 'joiner':
            direct_count = Message.objects.filter(
                sender=request.user,
                message_type='direct'
            ).count()
            if direct_count >= 3:
                return JsonResponse({'status': 'error', 'message': 'Direct message limit (3) reached for joiners'}, status=403)
        
        # Create message
        message = Message.objects.create(
            sender=request.user,
            content=content,
            message_type='direct'
        )
        message.recipients.add(recipient)
        return JsonResponse({
            'status': 'success',
            'message_id': message.id,
            'content': message.content,
            'sent_at': message.sent_at.isoformat(),
            'sender': {'id': request.user.id, 'username': request.user.username}
        })
    else:
        return redirect('message:messages_home')

@login_required
@csrf_exempt
def send_message_api(request):
    
    try:
        data = json.loads(request.body)
        recipient_id = data.get('recipient_id')
        content = data.get('content')
        recipient = CustomUser.objects.filter(id=recipient_id).first()
        if not recipient or not content:
            return JsonResponse({'status': 'error', 'message': 'Invalid data'}, status=400)
        
        # Check message limits
        user_type = request.user.user_type
        if user_type == 'premium':
            pass
        elif user_type == 'creator':
            direct_count = Message.objects.filter(
                sender=request.user,
                message_type='direct'
            ).count()
            if direct_count >= 10:
                return JsonResponse({'status': 'error', 'message': 'Direct message limit (10) reached for creators'}, status=403)
        elif user_type == 'joiner':
            direct_count = Message.objects.filter(
                sender=request.user,
                message_type='direct'
            ).count()
            if direct_count >= 3:
                return JsonResponse({'status': 'error', 'message': 'Direct message limit (3) reached for joiners'}, status=403)
        
        # Create message
        message = Message.objects.create(
            sender=request.user,
            content=content,
            message_type='direct'
        )
        message.recipients.add(recipient)
        return JsonResponse({
            'status': 'success',
            'message': {
                'id': message.id,
                'content': message.content,
                'sent_at': message.sent_at.isoformat(),
                'sender': {'id': request.user.id, 'username': request.user.username}
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)



@login_required
@require_GET
def check_message_limit(request):

    user_type = request.user.user_type
    limit_reached = False
    message = None

    if user_type == 'premium':
        # Premium users have no limit
        pass
    elif user_type == 'creator':
        direct_count = Message.objects.filter(
            sender=request.user,
            message_type='direct'
        ).count()
        if direct_count >= 10:
            limit_reached = True
            message = 'Direct message limit (10) reached for creators'
    elif user_type == 'joiner':
        direct_count = Message.objects.filter(
            sender=request.user,
            message_type='direct'
        ).count()
        if direct_count >= 3:
            limit_reached = True
            message = 'Direct message limit (3) reached for joiners'

    # Return response matching frontend expectations
    if limit_reached:
        return JsonResponse({
            'success': False,
            'limit_reached': True,
            'message': message
        }, status=403)  # Forbidden status for limit reached
    else:
        return JsonResponse({
            'success': True,
            'limit_reached': False,
            'message': None
        })
    


@login_required
def get_group_messages(request, event_id):
    
    userdata = request.user
    
    try:
        event = Event.objects.get(id=event_id)



        
        # Check if user has access to this event
        is_creator = event.creator == userdata
        is_participant = userdata.participated_events.filter(event=event).exists()
    

        
        if not (is_creator or is_participant):
            return JsonResponse({
                'success': False,
                'error': 'You do not have access to this event'
            }, status=403)
        
        # Get all messages for this event
        messages = Message.objects.filter(event_id=event.id).order_by('sent_at')
        
        # Determine user role for message limit purposes
        if userdata.user_type=='premium':
            user_role='premium'
        elif userdata.user_type=='creator':
            user_role='creator'
        elif userdata.user_type=='joiner':
            user_role='joiner'


        # Format messages for JSON response
        messages_data = []
        for message in messages:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'sent_at': message.sent_at.isoformat(),
                'sender': {
                    'id': message.sender_id,
                    'username': message.sender.username
                }
            })
        
        # Mark messages as read
        unread_messages = Message.objects.filter(
            event=event,
            is_read__isnull=True
        ).exclude(sender=userdata)
        
        for message in unread_messages:
            message.is_read.add(userdata)
        
        return JsonResponse({
            'success': True,
            'messages': messages_data,
            'is_creator': is_creator,
            'is_participant': is_participant,
            'user_role': user_role
        })
    
    except Event.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Event not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def send_group_message(request, event_id):
    
    userdata = request.user
    
    try:
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        
        if not content:
            return JsonResponse({
                'success': False,
                'error': 'Message content is required'
            }, status=400)
        
        event = get_object_or_404(Event, id=event_id)
        
        # Check user relationship to the event
        is_creator = event.creator == userdata
        is_participant = userdata.participated_events.filter(event=event).exists()
        
        if not (is_creator or is_participant):
            return JsonResponse({
                'success': False,
                'error': 'You do not have access to this event'
            }, status=403)
        
        # Check message limits based on user type and role in event
        if not can_send_group_message(userdata, event):
            limit_message = get_limit_message(userdata, event)
            return JsonResponse({
                'success': False,
                'limit_reached': True,
                'message': limit_message
            }, status=403)
        
        # Create and save the message
        message = Message.objects.create(
            sender=userdata,
            message_type="group",
            event=event,
            content=content,
            sent_at=timezone.now()
        )
        
        return JsonResponse({
            'success': True,
            'message_id': message.id,
            'username': userdata.username
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def get_new_group_messages(request, event_id, last_message_id=0):
    
    userdata = request.user
    
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Check if user has access to this event
        is_creator = event.creator == userdata
        is_participant = userdata.participated_events.filter(event=event).exists()
        
        if not (is_creator or is_participant):
            return JsonResponse({
                'success': False,
                'error': 'You do not have access to this event'
            }, status=403)
        
        # Get new messages since last_message_id
        messages = Message.objects.filter(
            event=event,
            id__gt=last_message_id
        ).order_by('sent_at')
        
        # Format messages for JSON response
        messages_data = []
        for message in messages:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'sent_at': message.sent_at.isoformat(),
                'sender': {
                    'id': message.sender_id,
                    'username':message.sender.username
                }
            })
        
        # Mark messages as read
        unread_messages = messages.exclude(sender=userdata)
        for message in unread_messages:
            message.is_read.add(userdata)
        
        return JsonResponse({
            'success': True,
            'messages': messages_data
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def check_group_message_limit(request, event_id):
   
    userdata = request.user
    
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Check if user has access to this event
        is_creator = event.creator == userdata
        is_participant = userdata.participated_events.filter(event=event).exists()
        
        if not (is_creator or is_participant):
            return JsonResponse({
                'success': False,
                'error': 'You do not have access to this event'
            }, status=403)
        
        # Get message count, limit info and status
        limit_reached, msg_count, msg_limit, approaching = get_message_limit_info(userdata, event)
        
        # Construct response based on limit status
        if limit_reached:
            return JsonResponse({
                'success': False,
                'limit_reached': True,
                'message': get_limit_message(userdata, event),
                'count': msg_count,
                'limit': msg_limit
            })
        
        return JsonResponse({
            'success': True,
            'limit_reached': False,
            'approaching_limit': approaching,
            'message': f'You have sent {msg_count}/{msg_limit} messages in this group' if approaching else '',
            'count': msg_count,
            'limit': msg_limit
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# Helper functions for message limits
def can_send_group_message(userdata, event):
    

    
    # Premium users have no limits
    if userdata.is_premium:
        return True
    
    is_creator = event.creator == userdata
    is_participant = userdata.participated_events.filter(event=event).exists()
    
    # Count messages for this event by this user
    message_count = Message.objects.filter(
        event=event,
        sender=userdata
    ).count()
    
    # Apply limits based on user role and relationship to event
    if is_creator:
        # User is the event creator
        if userdata.user_type == 'creator':
            # Creator user type has unlimited messages for their own events
            return True
        elif userdata.user_type == 'joiner':
            # Joiner user type who created this event has a limit of 5 messages
            return message_count < 5
    elif is_participant:
        # User is a participant in the event
        if userdata.user_type == 'creator':
            # Creator user type who joined someone else's event has a limit of 10 messages
            return message_count < 10
        elif userdata.user_type == 'joiner':
            # Joiner user type who joined someone else's event has a limit of 3 messages
            return message_count < 3
    
    # User has no relationship to the event
    return False

def get_message_limit_info(userdata, event):
    
    
    # For premium users
    if userdata.is_premium:
        return False, 0, float('inf'), False
    
    is_creator = event.creator == userdata
    
    # Count messages
    message_count = Message.objects.filter(
        event=event,
        sender=userdata
    ).count()
    
    # Determine limit based on user type and role
    if is_creator:
        if userdata.user_type == 'creator':
            # Unlimited messages
            return False, message_count, float('inf'), False
        elif userdata.user_type == 'joiner':
            # 5 messages for joiners who created this event
            limit = 5
            approaching = message_count >= 3
            return message_count >= limit, message_count, limit, approaching
    else:
        if userdata.user_type == 'creator':
            # 10 messages for creators participating in others' events
            limit = 10
            approaching = message_count >= 7
            return message_count >= limit, message_count, limit, approaching
        elif userdata.user_type == 'joiner':
            # 3 messages for joiners participating in others' events
            limit = 3
            approaching = message_count >= 2
            return message_count >= limit, message_count, limit, approaching

def get_limit_message(userdata, event):
    
    
    is_creator = event.creator == userdata
    
    if userdata.is_premium:
        return "You have unlimited messages as a premium user."
    
    if is_creator:
        if userdata.user_type == 'creator':
            return "You have unlimited messages as the creator of this event."
        elif userdata.user_type == 'joiner':
            return "You've reached your limit of 5 messages as a joiner who created this event. Upgrade for unlimited messages."
    else:
        if userdata.user_type == 'creator':
            return "You've reached your limit of 10 messages in this event. Upgrade to premium for unlimited messages."
        elif userdata.user_type == 'joiner':
            return "You've reached your limit of 3 messages in this event. Upgrade your account for more messages."