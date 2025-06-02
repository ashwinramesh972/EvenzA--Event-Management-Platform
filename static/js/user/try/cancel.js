document.addEventListener('DOMContentLoaded', function() {
  // Find all cancel buttons and attach event listeners
  const cancelButtons = document.querySelectorAll('.btn-cancel');
  
  cancelButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent the default link behavior
      
      // Get the event URL from the href attribute
      const cancelUrl = this.getAttribute('href');
      const eventId = cancelUrl.split('/').pop();
      
      // Find the closest event card to get event details
      const eventCard = this.closest('.event-card');
      const eventTitle = eventCard.querySelector('.card-title').textContent.trim();
      const eventDateStr = eventCard.querySelector('.event-date span').textContent.trim();
      const eventDate = new Date(eventDateStr);
      
      // Determine if the event is paid and status
      const isPaidEvent = eventCard.classList.contains('paid-event');
      const statusElement = eventCard.querySelector('.event-status');
      const isPendingEvent = statusElement && statusElement.textContent.trim().toLowerCase() === 'pending';
      
      // Calculate hours until event
      const currentDate = new Date();
      const hoursUntilEvent = (eventDate - currentDate) / (1000 * 60 * 60);
      
      // Initialize modal properties
      let warningTitle = 'Cancel Event';
      let warningMessage = '';
      let showPaymentButton = false;
      let confirmButtonText = 'Confirm Cancellation';
      let cancelButtonText = 'Keep My Event';
      
      // Handle paid event cancellation logic (fetch fee details from backend)
      if (isPaidEvent && !isPendingEvent) {
        // Perform a preliminary fetch to get fee details
        fetch(`/event/cancel/${eventId}/`, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
          },
          body: JSON.stringify({ 'action': 'get_fee_details' }) // New action to get fee info
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.requires_payment) {
            warningTitle = 'Cancellation Fee Required';
            warningMessage = `<p>You are about to cancel the paid event "${eventTitle}" with ${Math.round(hoursUntilEvent)} hours remaining.</p>
                             <p><strong>Cancellation Fee:</strong> $${data.cancellation_fee} (${data.fee_percentage}% of event price)</p>
                             <p class="text-danger"><strong>Warning:</strong> This cancellation will count towards your account's cancellation limit. Three cancellations may result in account suspension.</p>`;
            showPaymentButton = true;
            confirmButtonText = 'Proceed to Payment';
          } else {
            warningMessage = `<p>You are about to cancel the paid event "${eventTitle}".</p>
                             <p><strong>Good news:</strong> No cancellation fee applies (more than 72 hours notice).</p>
                             <p class="text-danger"><strong>Warning:</strong> This cancellation will count towards your account's cancellation limit. Three cancellations may result in account suspension.</p>`;
          }
          // Show the modal
          showCancellationModal(warningTitle, warningMessage, confirmButtonText, cancelButtonText, showPaymentButton, function() {
            performCancellation(cancelUrl, eventId, showPaymentButton);
          });
        })
        .catch(error => {
          console.error('Error fetching fee details:', error);
          showNotification('Error fetching cancellation details: Network issue.', 'error');
        });
      } else if (isPendingEvent) {
        // Pending event message
        warningMessage = `Are you sure you want to delete the pending event "${eventTitle}"? This action cannot be undone.`;
        confirmButtonText = 'Delete Event';
        // Show the modal
        showCancellationModal(warningTitle, warningMessage, confirmButtonText, cancelButtonText, showPaymentButton, function() {
          performCancellation(cancelUrl, eventId, showPaymentButton);
        });
      } else {
        // Free event or event already passed
        warningMessage = `<p>You are about to cancel the event "${eventTitle}".</p>
                         <p class="text-danger"><strong>Warning:</strong> This cancellation will count towards your account's cancellation limit. Three cancellations may result in account suspension.</p>`;
        // Show the modal
        showCancellationModal(warningTitle, warningMessage, confirmButtonText, cancelButtonText, showPaymentButton, function() {
          performCancellation(cancelUrl, eventId, showPaymentButton);
        });
      }
    });
  });
  
  // Function to perform cancellation via AJAX
  function performCancellation(cancelUrl, eventId, requiresPayment) {
    // Get CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                     document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                     getCookie('csrftoken');
    
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    // Show loading state
    showNotification('Processing cancellation...', 'info');
    
    fetch(`/event/cancel/${eventId}/`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        'action': 'cancel_event'
      })
    })
    .then(response => {
      // FIXED: Always try to parse the JSON response, even for error status codes
      return response.json().then(data => {
        return { data, status: response.status, ok: response.ok };
      });
    })
    .then(({ data, status, ok }) => {
      if (data.success) {
        if (requiresPayment && data.requires_payment && data.stripe_checkout_url) {
          // Redirect to payment page
          showNotification('Redirecting to payment...', 'info');
          window.location.href = data.stripe_checkout_url;
        } else {
          // Success case: event cancelled without payment
          showNotification(data.message, 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        // FIXED: Handle error cases properly, including 403 status
        if (status === 403 || data.message.includes('banned') || data.message.includes('logged out')) {
          showNotification(data.message, 'error');
          setTimeout(() => {
            window.location.href = '/user-login';
          }, 3000);
        } else {
          showNotification(data.message, 'error');
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      // FIXED: More specific error handling
      if (error.name === 'SyntaxError') {
        showNotification('Error cancelling event: Invalid server response.', 'error');
      } else {
        showNotification('Error cancelling event: Network issue.', 'error');
      }
    });
  }
  
  // Function to show notification
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('custom-notification', `notification-${type}`);
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles for notifications
    if (!document.getElementById('notification-styles')) {
      const notificationStyles = document.createElement('style');
      notificationStyles.id = 'notification-styles';
      notificationStyles.textContent = `
        .custom-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 2000;
          animation: slide-in 0.3s ease-out forwards;
          max-width: 350px;
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .notification-success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .notification-error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .notification-info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          margin-left: 15px;
          color: inherit;
        }
        
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(notificationStyles);
    }
    
    // Set auto-close timer
    setTimeout(() => {
      notification.style.animation = 'fade-out 0.3s forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      notification.style.animation = 'fade-out 0.3s forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    });
  }
  
  // Function to show a modal with cancellation warning
  function showCancellationModal(title, message, confirmText, cancelText, showPaymentButton, onConfirm) {
    // Create modal elements
    const modalBackground = document.createElement('div');
    modalBackground.classList.add('modal-background');
    
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.classList.add('modal-header');
    
    const modalTitle = document.createElement('h5');
    modalTitle.classList.add('modal-title');
    modalTitle.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = closeModal;
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.classList.add('modal-body');
    modalBody.innerHTML = message;
    
    // Modal footer
    const modalFooter = document.createElement('div');
    modalFooter.classList.add('modal-footer');
    
    const cancelButton = document.createElement('button');
    cancelButton.classList.add('btn', 'btn-secondary');
    cancelButton.textContent = cancelText;
    cancelButton.onclick = closeModal;
    
    const confirmButton = document.createElement('button');
    confirmButton.classList.add('btn', showPaymentButton ? 'btn-primary' : 'btn-danger');
    confirmButton.textContent = confirmText;
    confirmButton.onclick = function() {
      closeModal();
      onConfirm();
    };
    
    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(confirmButton);
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalBackground.appendChild(modalContent);
    document.body.appendChild(modalBackground);
    
    // Close modal when clicking outside
    modalBackground.addEventListener('click', function(e) {
      if (e.target === modalBackground) {
        closeModal();
      }
    });
    
    // Modal styles
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .modal-background {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 3000;
        }
        
        .modal-content {
          background: #fff;
          border-radius: 8px;
          width: 400px;
          max-width: 90%;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          animation: modal-fade-in 0.3s ease forwards;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-title {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }
        
        .modal-body {
          padding: 20px;
          font-size: 1rem;
          color: #333;
        }
        
        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        .btn {
          padding: 8px 16px;
          font-size: 1rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .btn-danger {
          background-color: #dc3545;
          color: #fff;
        }
        
        .btn-danger:hover {
          background-color: #c82333;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: #fff;
        }
        
        .btn-primary:hover {
          background-color: #0056b3;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: #fff;
        }
        
        .btn-secondary:hover {
          background-color: #5a6268;
        }
        
        .text-danger {
          color: #dc3545 !important;
        }
        
        @keyframes modal-fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    function closeModal() {
      if (document.body.contains(modalBackground)) {
        document.body.removeChild(modalBackground);
      }
    }
  }
  
  // Helper function to get cookie value
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