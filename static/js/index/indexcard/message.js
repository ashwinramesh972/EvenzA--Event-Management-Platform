document.addEventListener('DOMContentLoaded', () => {
  console.log('message.js loaded'); // Debug: Confirm script runs

  const messageModal = document.getElementById('messageModal');
  const recipientAvatar = document.getElementById('recipientAvatar');
  const recipientName = document.getElementById('messageModalTitle');
  const messageContent = document.getElementById('messageContent');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const closeModalBtn = document.querySelector('.close-modal-btn');
  // Update selector to match your new HTML structure
  const messageButtons = document.querySelectorAll('.message-button');
  const upgradeModal = document.getElementById('upgradeModal');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const closeUpgradeBtn = document.querySelector('.close-upgrade-btn');
  const cancelBtn = document.querySelector('.cancel-btn');

  console.log(`Found ${messageButtons.length} message buttons`); // Debug: Check buttons

  if (!messageModal) console.error('messageModal not found');
  if (!recipientAvatar) console.error('recipientAvatar not found');
  if (!recipientName) console.error('recipientName not found');
  if (!messageContent) console.error('messageContent not found');
  if (!sendMessageBtn) console.error('sendMessageBtn not found');

  // Function to check if the user is logged in
  function isUserLoggedIn() {
    const loginLink = document.querySelector('.nav-link[href="/user-login"]');
    return !loginLink; // Returns true if the login link is NOT present (i.e., user is logged in)
  }

  function openMessageModal(eventId, recipientId, avatarUrl, name) {
    console.log('Opening message modal', { eventId, recipientId, avatarUrl, name }); // Debug
    if (!messageModal) {
      console.error('Cannot open message modal: messageModal not found');
      return;
    }
    recipientAvatar.src = avatarUrl || '/api/placeholder/40/40';
    recipientName.innerText = name || 'Unknown User';
    messageContent.value = '';
    messageModal.setAttribute('data-event-id', eventId);
    messageModal.setAttribute('data-recipient-id', recipientId);
    messageModal.style.display = 'flex';
    setTimeout(() => {
      messageModal.classList.add('visible');
    }, 10);
    messageContent.focus();
  }

  function closeMessageModal() {
    console.log('Closing message modal'); // Debug
    messageModal.classList.remove('visible');
    setTimeout(() => {
      messageModal.style.display = 'none';
      messageModal.removeAttribute('data-event-id');
      messageModal.removeAttribute('data-recipient-id');
    }, 300);
  }

  function openUpgradeModal() {
    console.log('Opening upgrade modal'); // Debug
    if (!upgradeModal) {
      console.error('Cannot open upgrade modal: upgradeModal not found');
      return;
    }
    upgradeModal.style.display = 'flex';
    setTimeout(() => {
      upgradeModal.classList.add('visible');
    }, 10);
  }

  function closeUpgradeModal() {
    console.log('Closing upgrade modal'); // Debug
    upgradeModal.classList.remove('visible');
    setTimeout(() => {
      upgradeModal.style.display = 'none';
    }, 300);
  }

  messageButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log('Message button clicked', button); // Debug

      // Check if the user is logged in; if not, redirect to login page immediately
      if (!isUserLoggedIn()) {
        window.location.href = '/user-login';
        return;
      }

      // Find the card container
      const card = button.closest('.card');
      if (!card) {
        console.error('Card not found for message button');
        return;
      }

      // Get event ID and creator info based on your new structure
      const eventId = card.getAttribute('data-event-id') || '0';
      
      // Find the profile area that contains the creator information
      const profileArea = card.querySelector('.profile-area');
      if (!profileArea) {
        console.error('Profile area not found in card');
        return;
      }
      
      // Get recipient ID from data attribute or fallback
      const recipientId = profileArea.getAttribute('data-recipient-id') || '0';
      
      // Find avatar image and username
      const avatar = profileArea.querySelector('.profile-icon img')?.src || '/api/placeholder/40/40';
      const name = profileArea.querySelector('.profile-name')?.innerText || 'Event Creator';
      
      // Open the message modal with the retrieved information
      openMessageModal(eventId, recipientId, avatar, name);
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeMessageModal);
  } else {
    console.error('closeModalBtn not found');
  }

  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', () => {
      console.log('Send message button clicked'); // Debug
      const eventId = messageModal.getAttribute('data-event-id');
      const recipientId = messageModal.getAttribute('data-recipient-id');
      const content = messageContent.value.trim();

      if (!content) {
        showNotification('Please enter a message.', 'error');
        return;
      }

      sendMessageBtn.disabled = true;
      sendMessageBtn.innerText = 'Sending...';

      const csrfToken = getCsrfToken();
      console.log('CSRF Token:', csrfToken); // Debug: Log the CSRF token

      fetch('/message/api/send_message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          event_id: eventId,
          recipient_id: recipientId,
          content: content,
        }),
      })
        .then(response => {
          console.log('Fetch response received', response.status); // Debug
          return response.json().then(data => ({ response, data }));
        })
        .then(({ response, data }) => {
          console.log('Fetch data', data); // Debug
          if (response.ok && data.status === 'success') {
            showNotification('Message sent successfully!', 'success');
            closeMessageModal();
            // Optional: Redirect to the reply page
            // window.location.href = `/message/send_message/?event_id=${eventId}&recipient_id=${recipientId}`;
          } else if (data.status === 'upgrade_required') {
            openUpgradeModal();
          } else {
            showNotification(data.message || 'Failed to send message.', 'error');
          }
        })
        .catch(error => {
          console.error('Error sending message:', error);
          showNotification('Failed to send message. Please try again.', 'error');
        })
        .finally(() => {
          sendMessageBtn.disabled = false;
          sendMessageBtn.innerText = 'Send';
        });
    });
  }

  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      console.log('Upgrade button clicked'); // Debug
      window.location.href = '/accounts/upgrade/';
    });
  } else {
    console.error('upgradeBtn not found');
  }

  if (closeUpgradeBtn) {
    closeUpgradeBtn.addEventListener('click', closeUpgradeModal);
  } else {
    console.error('closeUpgradeBtn not found');
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeUpgradeModal);
  } else {
    console.error('cancelBtn not found');
  }

  function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
  }

  function showNotification(message, type = 'success') {
    console.log('Showing notification:', message, type); // Debug
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
      `;
      document.head.appendChild(notificationStyle);
    }
    notification.innerText = message;
    notification.classList.add('show', type);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.classList.remove('success', 'error');
      }, 500);
    }, 3000);
  }
});