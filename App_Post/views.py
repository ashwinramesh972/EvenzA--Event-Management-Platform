from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import CommunityPost, Comment

# Create your views here.
def community_feed(request):
    posts = CommunityPost.objects.all().order_by('-created_at')

    formatted_posts = [
        {
            'post': post,
            'display_text': f"{post.user.username}'s post",
            'like_count': post.like_count,
            'caption': post.caption,
            'created_at': post.created_at,
            'image': post.image,
            'is_liked': post.likes.filter(id=request.user.id).exists() if request.user.is_authenticated else False,
            'profile_picture': post.user.profile_picture.url if post.user.profile_picture else None,
        }
        for post in posts
    ]
    return render(request, 'communitypost/community_feed.html', {'posts': formatted_posts})

def post_detail(request, post_id):
    post = get_object_or_404(CommunityPost, id=post_id)
    comments = post.comments.all().order_by('-created_at')
    error = None

    if request.method == 'POST' and request.user.is_authenticated:
        comment_text = request.POST.get('comment_text', '').strip()
        if not comment_text:
            error = "Comment cannot be empty."
        elif len(comment_text) > 250:
            error = "Comment cannot exceed 250 characters."
        else:
            Comment.objects.create(
                post=post,
                user=request.user,
                text=comment_text
            )
            return redirect('communitypost:post_detail', post_id=post.id)


    formatted_comments = [
        {
            'comment': comment,
            'display_text': f"Comment by {comment.user.username} on {post.user.username}'s post",
            'text': comment.text,
            'created_at': comment.created_at,
        }
        for comment in comments
    ]

    return render(request, 'communitypost/post_detail.html', {
        'post': post,
        'post_display': f"{post.user.username}'s post",
        'comments': formatted_comments,
        'error': error,
        'like_count': post.like_count,
        'is_liked': post.likes.filter(id=request.user.id).exists() if request.user.is_authenticated else False,
    })

@login_required
def add_comment(request, post_id):
    post = get_object_or_404(CommunityPost, id=post_id)
    if request.method == 'POST':
        comment_text = request.POST.get('comment_text', '').strip()
        if comment_text and len(comment_text) <= 250:
            Comment.objects.create(
                post=post,
                user=request.user,
                text=comment_text
            )
    return redirect('communitypost:post_detail', post_id=post.id)

@login_required
def create_post(request):
    if request.method == 'POST':
        caption = request.POST.get('caption', '').strip()
        image = request.FILES.get('image')
        
        if not caption and not image:

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'error': "Post must have a caption or image."})
            error = "Post must have a caption or image."
        elif caption and len(caption) > 500:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'error': "Caption cannot exceed 500 characters."})
            error = "Caption cannot exceed 500 characters."
        else:
            post = CommunityPost.objects.create(
                user=request.user,
                caption=caption,
                image=image
            )

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True})
            return redirect('communitypost:community_feed')
    

    return render(request, 'communitypost/create_post.html', {'error': error if 'error' in locals() else None})

@login_required
def toggle_like(request, post_id):
    post = get_object_or_404(CommunityPost, id=post_id)
    user = request.user

    if request.method == 'POST':
        if user not in post.likes.all():
  
            post.likes.add(user)
            post.like_count = post.likes.count()
            post.save(update_fields=['like_count'])
            return JsonResponse({
                'success': True,
                'like_count': post.like_count,
                'is_liked': True
            })
        else:

            post.likes.remove(user)
            post.like_count = post.likes.count()
            post.save(update_fields=['like_count'])
            return JsonResponse({
                'success': True,
                'like_count': post.like_count,
                'is_liked': False
            })
    return JsonResponse({'success': False, 'error': 'Invalid request'})