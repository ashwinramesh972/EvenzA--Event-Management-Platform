document.addEventListener('DOMContentLoaded', () => {
  // Add styles for leave button and notification
  

  const style = document.createElement('style');
  style.innerHTML = `
    /* Hide all leave buttons */
    .leave-button {
      display: none !important;
    }
    
    /* Join Button Styling - Only modify button appearance */
    .join-button[disabled], 
    .join-button.joined {
      background: linear-gradient(135deg, #10B981, #059669) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
      position: relative;
      overflow: hidden;
      border: none !important;
      font-weight: 600 !important;
    }
    
    .join-button[disabled]:after,
    .join-button.joined:after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: rgba(255, 255, 255, 0.1);
      transform: rotate(30deg);
      animation: shimmer 3s infinite linear;
    }
    
    @keyframes shimmer {
      from {
        transform: translateX(-100%) rotate(30deg);
      }
      to {
        transform: translateX(100%) rotate(30deg);
      }
    }
    
    /* Spinner for loading state */
    .joining-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 8px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .notification-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    .notification-toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    .notification-toast.success {
      background: linear-gradient(90deg, #10B981, #059669);
    }
    
    .notification-toast.error {
      background: linear-gradient(90deg, #E74C3C, #C0392B);
    }
  `;
  document.head.appendChild(style);

  // Function to remove all leave buttons
  function removeLeaveButtons() {
    document.querySelectorAll('.leave-button').forEach(button => {
      button.style.display = 'none';
    });
  }
  
  // Run immediately and set an interval to keep removing leave buttons
  removeLeaveButtons();
  setInterval(removeLeaveButtons, 500);

  // Initialize event listeners for join buttons
  const joinButtons = document.querySelectorAll('.join-button');
  joinButtons.forEach(button => {
    // Apply joined styling to already joined buttons
    if (button.innerText === 'Joined' || button.disabled) {
      button.classList.add('joined');
    }
    
    // Remove existing listeners to prevent default behavior
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add our custom listener
    newButton.addEventListener('click', handleJoinEvent);
  });

  function handleJoinEvent(e) {
    const button = e.currentTarget;
    const userId = button.getAttribute('data-user-id');
    const eventId = button.closest('.card')?.getAttribute('data-event-id') || 
                    button.getAttribute('data-event-id');
    
    if (!eventId) {
      showNotification('Event information is missing. Please refresh the page.', 'error');
      return;
    }

    // Check if the user is logged in; if not, redirect to login page immediately
    if (!isUserLoggedIn()) {
      showNotification('Please log in to join events', 'error');
      window.location.href = '/user-login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    // Check if already joined
    if (button.innerText === 'Joined' || button.disabled) {
      showNotification('You have already joined this event!');
      return;
    }
    
    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.innerText;
    const spinner = document.createElement('span');
    spinner.className = 'joining-spinner';
    button.innerHTML = '';
    button.appendChild(spinner);
    button.appendChild(document.createTextNode('Joining...'));
    
    const card = button.closest('.card');
    
    // Determine if it's a paid event
    const isPaid = originalText.includes('$');
    let eventCode = '';
    
    // For simplicity, only ask for event code for paid events
    if (isPaid) {
      // Redirect to Django view that handles payment
      window.location.href = `/payment/purchase-ticket/${eventId}/${userId}/`;
      return;
    }

    
    fetch(`/event/join/${eventId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ event_code: eventCode || '' })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        button.classList.add('joined');
        button.innerHTML = '';
        button.innerText = 'Joined';
        
        updateParticipantCount(card, data.participants_count);
        
        // Update all instances of this event card
        updateAllEventCards(eventId);
        
        // Make sure leave buttons are removed
        removeLeaveButtons();
        
        showNotification(data.message || 'Success! You have joined the event.');
      } else {
        button.disabled = false;
        button.innerHTML = '';
        button.innerText = originalText;
        showNotification(data.error || 'Failed to join the event.', 'error');
      }
    })
    .catch(error => {
      button.disabled = false;
      button.innerHTML = '';
      button.innerText = originalText;
      showNotification('An error occurred while joining the event. Please try again.', 'error');
      console.error('Error:', error);
    });
  }

  function updateParticipantCount(card, newCount) {
    if (!card) return;
    
    // Find the attendees element
    const attendeesElements = card.querySelectorAll('.event-details .value, .value');
    attendeesElements.forEach(element => {
      if (element.textContent.includes('attending')) {
        // Extract the max count if it exists
        const currentText = element.textContent;
        if (newCount !== undefined) {
          element.textContent = `${newCount} people attending`;
        }
      }
    });
  }

  function updateAllEventCards(eventId) {
    // Update all instances of this event card
    const allCards = document.querySelectorAll(`.card[data-event-id="${eventId}"]`);
    allCards.forEach(card => {
      const joinBtn = card.querySelector('.join-button');
      if (joinBtn) {
        joinBtn.disabled = true;
        joinBtn.innerText = 'Joined';
        joinBtn.classList.add('joined');
      }
      
      // Make sure no leave buttons appear
      const leaveBtn = card.querySelector('.leave-button');
      if (leaveBtn) {
        leaveBtn.style.display = 'none';
      }
    });
  }

  function isUserLoggedIn() {
    const loginLink = document.querySelector('.nav-link[href="/user-login"]');
    return !loginLink; // Returns true if the login link is NOT present (i.e., user is logged in)
  }

  function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    if (token) return token.getAttribute('content');
    
    // Fallback to cookie
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
      
    return cookieValue || '';
  }

  function showNotification(message, type = 'success') {
    let notification = document.querySelector('.notification-toast');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification-toast';
      document.body.appendChild(notification);
    }
    
    // Clear any existing classes and timeout
    notification.classList.remove('show', 'success', 'error');
    clearTimeout(notification.dataset.timeout);
    
    // Set new message and show
    notification.innerText = message;
    notification.classList.add('show', type);
    
    // Auto-hide after 3 seconds
    const timeout = setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.classList.remove('success', 'error');
      }, 500);
    }, 3000);
    
    notification.dataset.timeout = timeout;
  }
});