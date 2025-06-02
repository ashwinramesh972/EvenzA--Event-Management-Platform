/**
 * Function to handle leaving an event
 * @param {number} eventId - The ID of the event to leave
 */
function leaveEvent(eventId) {
  // Use SweetAlert2 for confirmation
  Swal.fire({
    title: 'Leave Event',
    text: 'Are you sure you want to leave this event?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, leave it',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // Ask for reason using SweetAlert2
      Swal.fire({
        title: 'Reason for Leaving',
        input: 'textarea',
        inputPlaceholder: 'Why are you leaving this event? (Optional)',
        inputAttributes: {
          'aria-label': 'Reason for leaving'
        },
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Skip',
        showLoaderOnConfirm: true,
        preConfirm: (reason) => {
          return submitLeaveRequest(eventId, reason || 'User left the event');
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
          // User skipped providing a reason
          submitLeaveRequest(eventId, 'User left the event');
        }
      });
    }
  });
}

/**
 * Helper function to submit the leave request
 * @param {number} eventId - The ID of the event to leave
 * @param {string} reason - The reason for leaving
 */
function submitLeaveRequest(eventId, reason) {
  // Create form data
  const formData = new FormData();
  formData.append('cancellation_reason', reason);
  
  // Get CSRF token from cookies
  const csrftoken = getCookie('csrftoken');
  
  // Show loading state
  Swal.fire({
    title: 'Processing...',
    text: 'Please wait while we process your request.',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  // Send AJAX request
  return fetch(`/event/leave/${eventId}/`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': csrftoken
    },
    credentials: 'same-origin'
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Error leaving event');
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'You have successfully left the event.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        // Reload the current page
        window.location.reload();
      });
      return true;
    } else {
      throw new Error(data.error || 'Error leaving event');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    Swal.fire({
      title: 'Error!',
      text: error.message,
      icon: 'error',
      confirmButtonColor: '#3085d6'
    });
    return false;
  });
}

/**
 * Helper function to get CSRF token from cookies
 * @param {string} name - The name of the cookie
 * @returns {string} The cookie value
 */
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
