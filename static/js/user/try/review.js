/**
 * Event Review System JavaScript
 * Handles star rating interaction and review submission
 */
document.addEventListener('DOMContentLoaded', () => {
    let selectedRating = 0;
    let currentEventId = null;

    // Get modal and elements
    const modal = document.getElementById('ratingModal');
    const stars = document.querySelectorAll('.star');
    const ratingFeedback = document.querySelector('.ur-rating-feedback');
    const commentInput = document.getElementById('ratingComment');
    const submitButton = document.getElementById('submitRating');
    const cancelButton = document.getElementById('cancelRating');
    const closeButton = document.getElementById('modalCloseBtn');

    // Functions to show/hide modal
    function showModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function hideModal() {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Enable scrolling again
        
        // Reset state when closing
        selectedRating = 0;
        ratingFeedback.textContent = 'Select a rating by clicking a star';
        ratingFeedback.style.color = 'rgba(255, 255, 255, 0.7)';
        highlightStars(0);
        commentInput.value = '';
    }

    // Close modal buttons
    cancelButton.addEventListener('click', hideModal);
    closeButton.addEventListener('click', hideModal);

    // Star hover and click events
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const value = parseInt(star.dataset.value);
            highlightStars(value);
        });

        star.addEventListener('mouseout', () => {
            highlightStars(selectedRating);
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            highlightStars(selectedRating);
            ratingFeedback.textContent = `Selected: ${selectedRating} star${selectedRating > 1 ? 's' : ''}`;
            
            // Add animation effect
            star.classList.add('selected');
            setTimeout(() => {
                star.classList.remove('selected');
            }, 300);
        });
    });

    // Highlight stars up to the given value
    function highlightStars(value) {
        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            if (starValue <= value) {
                star.classList.remove('fa-regular');
                star.classList.add('fa-solid');
                star.style.color = '#FFC107';
            } else {
                star.classList.remove('fa-solid');
                star.classList.add('fa-regular');
                star.style.color = '#6c757d';
            }
        });
    }

    // Submit rating via AJAX
    submitButton.addEventListener('click', () => {
        if (selectedRating === 0) {
            ratingFeedback.textContent = 'Please select a rating.';
            ratingFeedback.style.color = '#FF5252';
            return;
        }

        const comment = commentInput.value.trim();
        const data = {
            event_id: currentEventId,
            rating: selectedRating,
            comment: comment || 'No comment'
        };

        // Add loading state to submit button
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitButton.disabled = true;

        fetch('/reviews/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                hideModal();
                // Show temporary success message
                showSuccessMessage(currentEventId);
                // Refresh the page after a short delay to show updated review
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                ratingFeedback.textContent = result.error || 'Failed to submit rating.';
                ratingFeedback.style.color = '#FF5252';
                
                // Reset button state
                submitButton.innerHTML = 'Submit Review';
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            ratingFeedback.textContent = 'An error occurred. Please try again.';
            ratingFeedback.style.color = '#FF5252';
            console.error('Error:', error);
            
            // Reset button state
            submitButton.innerHTML = 'Submit Review';
            submitButton.disabled = false;
        });
    });

    // Show success message on the card
    function showSuccessMessage(eventId) {
        const eventCard = document.querySelector(`.ur-card[data-event-id="${eventId}"]`);
        if (eventCard) {
            const ratingSection = eventCard.querySelector('.ur-rating-section');
            if (ratingSection) {
                const successMsg = document.createElement('div');
                successMsg.className = 'ur-rated';
                successMsg.innerHTML = `
                    <div class="ur-rated-label">
                        <i class="fa-solid fa-check-circle"></i> Review submitted successfully!
                    </div>
                `;
                
                // Replace content
                ratingSection.innerHTML = '';
                ratingSection.appendChild(successMsg);
            }
        }
    }

    // Open modal and reset state
    window.openRatingModal = function(eventId) {
        currentEventId = eventId;
        selectedRating = 0;
        commentInput.value = '';
        ratingFeedback.textContent = 'Select a rating by clicking a star';
        ratingFeedback.style.color = 'rgba(255, 255, 255, 0.7)';
        highlightStars(0);
        showModal();
    };

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideModal();
        }
    });

    // Handle escape key to close modal
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            hideModal();
        }
    });

    // Get CSRF token for AJAX
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