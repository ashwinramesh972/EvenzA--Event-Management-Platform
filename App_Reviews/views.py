from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from .models import Rating
from App_Event.models import Event
from App_User.models import CustomUser
import json

# Create your views here.
@require_POST
@login_required
def submit_rating(request):
    try:
        data = json.loads(request.body)
        event_id = data.get('event_id')
        rating = data.get('rating')
        comment = data.get('comment', 'No comment')


        if not event_id or not rating:
            return JsonResponse({'success': False, 'error': 'Event ID and rating are required.'}, status=400)

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return JsonResponse({'success': False, 'error': 'Rating must be between 1 and 5.'}, status=400)
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid rating value.'}, status=400)


        event = get_object_or_404(Event, id=event_id)


        if Rating.objects.filter(user=request.user, event=event).exists():
            return JsonResponse({'success': False, 'error': 'You have already rated this event.'}, status=400)


        Rating.objects.create(
            user=request.user,
            event=event,
            rating=rating,
            comment=comment
        )

        return JsonResponse({'success': True, 'message': 'Rating submitted successfully.'})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)