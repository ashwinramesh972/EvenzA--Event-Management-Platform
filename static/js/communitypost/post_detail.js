// post_detail.js
document.addEventListener('DOMContentLoaded', function() {
    // Set up like button functionality
    const likeButton = document.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', handleLikeClick);
    }
    
    // Set up character counter for comment textarea
    const commentTextarea = document.querySelector('textarea[name="comment_text"]');
    const charCounter = document.querySelector('.char-counter');
    
    if (commentTextarea && charCounter) {
        commentTextarea.addEventListener('input', updateCharCounter);
        
        // Initialize counter
        updateCharCounter();
    }
    
    // Function to handle like button clicks
    function handleLikeClick(event) {
        const button = event.currentTarget;
        const postId = button.dataset.postId;
        
        // Prevent clicking if button is disabled
        if (button.disabled) {
            return;
        }
        
        // Send the like request to the server
        toggleLike(postId, button);
    }
    
    // Function to toggle like status with the server
    function toggleLike(postId, button) {
        // Get CSRF token from cookies
        const csrftoken = getCookie('csrftoken');
        
        // Create a fetch request to toggle like
        fetch(`communitypost/post_detail/post/${postId}/like/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update the like count and button appearance
                const likeCountElement = button.querySelector('.like-count');
                likeCountElement.textContent = data.like_count;
                
                if (data.is_liked) {
                    button.classList.add('liked');
                } else {
                    button.classList.remove('liked');
                }
            } else {
                console.error('Error toggling like:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    // Function to update character counter
    function updateCharCounter() {
        const currentLength = commentTextarea.value.length;
        charCounter.textContent = `${currentLength}/250`;
        
        // Optional: Add visual indication when approaching limit
        if (currentLength > 220) {
            charCounter.style.color = '#E53935';
        } else {
            charCounter.style.color = 'var(--light-text)';
        }
    }
    
    // Function to get cookie value by name (for CSRF token)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});