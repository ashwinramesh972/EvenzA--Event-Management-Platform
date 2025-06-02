// community_feed.js
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for like buttons
    const likeButtons = document.querySelectorAll('.like-button');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', handleLikeClick);
    });

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
        fetch(`/communitypost/post/${postId}/like/`, {
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
    const modal = document.getElementById('create-post-modal');
    
    // Get the button that opens the modal
    const createPostBtn = document.querySelector('.create-post-button');
    
    // Get the elements that close the modal
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-button');
    
    // Get the form elements
    const createPostForm = document.getElementById('create-post-form');
    const captionTextarea = document.getElementById('caption');
    const charCounter = document.querySelector('.char-counter');
    const imageInput = document.getElementById('image');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.querySelector('.remove-image');
    const errorMessage = document.getElementById('post-error');
    
    // Open the modal when the create post button is clicked
    createPostBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
    });
    
    // Close the modal when the close button is clicked
    closeBtn.addEventListener('click', function() {
        closeModal();
    });
    
    // Close the modal when the cancel button is clicked
    cancelBtn.addEventListener('click', function() {
        closeModal();
    });
    
    // Close the modal when clicking outside of the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Update the character counter as the user types
    captionTextarea.addEventListener('input', function() {
        const currentLength = captionTextarea.value.length;
        charCounter.textContent = `${currentLength}/500`;
        
        // Add visual indication when approaching limit
        if (currentLength > 450) {
            charCounter.style.color = '#E53935';
        } else {
            charCounter.style.color = 'var(--light-text)';
        }
    });
    
    // Handle image preview
    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Remove image preview when remove button is clicked
    removeImageBtn.addEventListener('click', function() {
        imageInput.value = '';
        imagePreviewContainer.style.display = 'none';
    });
    
    // Handle form submission with AJAX
    createPostForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const caption = captionTextarea.value.trim();
        const hasImage = imageInput.files.length > 0;
        
        // Validate the form
        if (!caption && !hasImage) {
            errorMessage.textContent = "Post must have a caption or image.";
            errorMessage.style.display = 'block';
            return;
        }
        
        if (caption && caption.length > 500) {
            errorMessage.textContent = "Caption cannot exceed 500 characters.";
            errorMessage.style.display = 'block';
            return;
        }
        
        // Create FormData object to send the form data
        const formData = new FormData(createPostForm);
        
        // Get CSRF token
        const csrftoken = getCookie('csrftoken');
        
        // Send the form data to the server
        fetch('/communitypost/post/new/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken,
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (response.redirected) {
                // If successful, refresh the page to show the new post
                window.location.href = response.url;
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (data && data.error) {
                errorMessage.textContent = data.error;
                errorMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = "An error occurred. Please try again.";
            errorMessage.style.display = 'block';
        });
    });
    
    // Function to close the modal and reset the form
    function closeModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        createPostForm.reset();
        imagePreviewContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        charCounter.textContent = '0/500';
        charCounter.style.color = 'var(--light-text)';
    }
});