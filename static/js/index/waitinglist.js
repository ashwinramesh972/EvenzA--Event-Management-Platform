function handleJoinEvent(e) {
    const button = e.currentTarget;
    const eventId = button.getAttribute('data-event-id');

    // Check if the user is logged in; if not, redirect to login page immediately
    if (!isUserLoggedIn()) {
      window.location.href = '/user-login';
      return;
    }
    
    button.disabled = true;
    button.innerText = 'Processing...';
    
    const card = button.closest('.event-card');
    const visibility = card.dataset.visibility;
    let eventCode = '';
    
    if (visibility === 'private') {
      eventCode = prompt('Please enter the event code:');
      if (!eventCode) {
        button.disabled = false;
        button.innerText = 'Join Event';
        showNotification('Event code is required for private events.', 'error');
        return;
      }
    }
    
    fetch(`/event/join/${eventId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ event_code: eventCode })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.is_waitlisted) {
          // Handle waitlist case
          button.innerText = `Waitlisted (#${data.waitlist_position})`;
          button.style.background = 'linear-gradient(90deg, #F39C12, #E67E22)';
          button.style.animation = 'pulse 1s';
          
          showNotification(`You've been added to the waiting list (Position: ${data.waitlist_position})`, 'info');
          
          // Add leave waitlist button
          const cardFooter = card.querySelector('.card-footer');
          const leaveButton = document.createElement('button');
          leaveButton.className = 'leave-button waitlist-leave';
          leaveButton.setAttribute('data-event-id', eventId);
          leaveButton.innerText = 'Leave Waitlist';
          leaveButton.addEventListener('click', handleLeaveEvent);
          cardFooter.appendChild(leaveButton);
          
        } else {
          // Handle confirmed case (existing logic)
          button.innerText = 'Joined';
          button.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
          button.style.animation = 'pulse 1s';
          
          const participantsElement = card.querySelector('.card-details p:first-child span');
          if (participantsElement && data.participants_count) {
            const maxCount = parseInt(participantsElement.innerText.split('/')[1]);
            participantsElement.innerText = `${data.participants_count}/${maxCount} people attending`;
          }
          
          // Add leave button
          const cardFooter = card.querySelector('.card-footer');
          const leaveButton = document.createElement('button');
          leaveButton.className = 'leave-button';
          leaveButton.setAttribute('data-event-id', eventId);
          leaveButton.innerText = 'Leave Event';
          leaveButton.addEventListener('click', handleLeaveEvent);
          cardFooter.appendChild(leaveButton);
          
          showNotification(data.message || 'Success! You have joined the event.');
        }
        
        // Update all instances of this event card
        updateAllEventCards(eventId, data);
        
      } else {
        button.disabled = false;
        button.innerText = 'Join Event';
        showNotification(data.error || 'Failed to join the event.', 'error');
      }
    })
    .catch(error => {
      button.disabled = false;
      button.innerText = 'Join Event';
      showNotification('An error occurred while joining the event.', 'error');
      console.error('Error:', error);
    });
}

function updateAllEventCards(eventId, data) {
  const allCards = document.querySelectorAll(`.event-card[data-event-id="${eventId}"]`);
  allCards.forEach(card => {
    const ctaBtn = card.querySelector('.cta-button');
    if (ctaBtn) {
      if (data.is_waitlisted) {
        ctaBtn.disabled = true;
        ctaBtn.innerText = `Waitlisted (#${data.waitlist_position})`;
        ctaBtn.style.background = 'linear-gradient(90deg, #F39C12, #E67E22)';
      } else {
        ctaBtn.disabled = true;
        ctaBtn.innerText = 'Joined';
        ctaBtn.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
      }
    }
    
    // Add leave button to other cards if not present
    const existingLeaveButton = card.querySelector('.leave-button');
    if (!existingLeaveButton) {
      const cardFooter = card.querySelector('.card-footer');
      const leaveButton = document.createElement('button');
      leaveButton.className = data.is_waitlisted ? 'leave-button waitlist-leave' : 'leave-button';
      leaveButton.setAttribute('data-event-id', eventId);
      leaveButton.innerText = data.is_waitlisted ? 'Leave Waitlist' : 'Leave Event';
      leaveButton.addEventListener('click', handleLeaveEvent);
      cardFooter.appendChild(leaveButton);
    }
  });
}

// Update the notification function to handle different types
function showNotification(message, type = 'success') {
  let notification = document.querySelector('.notification-toast');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification-toast';
    document.body.appendChild(notification);
    
    const notificationStyle = document.createElement('style');
    notificationStyle.innerHTML = `
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
        background: linear-gradient(90deg, #2ECC71, #27AE60);
      }
      
      .notification-toast.error {
        background: linear-gradient(90deg, #E74C3C, #C0392B);
      }
      
      .notification-toast.info {
        background: linear-gradient(90deg, #3498DB, #2980B9);
      }
      
      .notification-toast.warning {
        background: linear-gradient(90deg, #F39C12, #E67E22);
      }
      
      .waitlist-leave {
        background: linear-gradient(90deg, #F39C12, #E67E22) !important;
      }
      
      .waitlist-leave:hover {
        box-shadow: 0 4px 10px rgba(243, 156, 18, 0.3) !important;
      }
    `;
    document.head.appendChild(notificationStyle);
  }
  
  notification.innerText = message;
  notification.classList.add('show', type);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.classList.remove('success', 'error', 'info', 'warning');
    }, 500);
  }, 4000); // Show waitlist notifications longer
}