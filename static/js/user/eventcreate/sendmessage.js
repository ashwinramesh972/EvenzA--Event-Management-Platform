// Global variable to store the current recipient ID
let currentRecipientId = null;

/**
 * Opens the message modal for a specific creator
 * @param {number} creatorId - The ID of the creator to message
 */
function messageCreator(creatorId) {
    currentRecipientId = creatorId;
    const modal = document.getElementById('messageModal');
    const messageText = document.getElementById('messageText');
    
    // Clear previous message and reset counter
    messageText.value = '';
    updateCounter();
    
    // Show the modal
    modal.classList.add('active');
    
    // Focus on the textarea
    setTimeout(() => {
        messageText.focus();
    }, 100);
}

/**
 * Closes the message modal
 */
function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    modal.classList.remove('active');
    currentRecipientId = null;
    
    // Clear the form
    document.getElementById('messageText').value = '';
    updateCounter();
}

/**
 * Updates the character counter for the message textarea
 */
function updateCounter() {
    const messageText = document.getElementById('messageText');
    const charCount = document.getElementById('charCount');
    const currentLength = messageText.value.length;
    
    charCount.textContent = currentLength;
    
    // Change color when approaching limit
    if (currentLength > 450) {
        charCount.style.color = '#ef4444';
    } else if (currentLength > 400) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = '#718096';
    }
}

/**
 * Sends a direct message to the selected recipient
 */
async function sendMessage() {
    const messageText = document.getElementById('messageText');
    const content = messageText.value.trim();
    
    // Validation
    if (!content) {
        showNotification('Please enter a message', 'error');
        messageText.focus();
        return;
    }
    
    if (!currentRecipientId) {
        showNotification('No recipient selected', 'error');
        return;
    }
    
    // Get CSRF token
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        showNotification('Security token not found. Please refresh the page.', 'error');
        return;
    }
    
    // Disable send button to prevent double-sending
    const sendButton = document.querySelector('.message-modal-send');
    const originalText = sendButton.textContent;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    
    try {
        const response = await fetch('/message/api/send_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                recipient_id: currentRecipientId,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showNotification('Message sent successfully!', 'success');
            closeMessageModal();
        } else {
            // Handle specific error messages from the server
            const errorMessage = data.message || 'Failed to send message';
            showNotification(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.textContent = originalText;
    }
}

/**
 * Gets the CSRF token from the page
 * @returns {string|null} The CSRF token or null if not found
 */
function getCsrfToken() {
    // Try to get from meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.getAttribute('content');
    }
    
    // Try to get from cookie
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
    
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    
    // Try to get from form input
    const formToken = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (formToken) {
        return formToken.value;
    }
    
    return null;
}

/**
 * Shows a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    // Set colors based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#10b981';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#ef4444';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = '#3b82f6';
        notification.style.color = 'white';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Alternative function for form-based message sending (if needed)
 * @param {number} recipientId - The ID of the recipient
 * @param {string} content - The message content
 */
async function sendMessageForm(recipientId, content) {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
        showNotification('Security token not found. Please refresh the page.', 'error');
        return false;
    }
    
    const formData = new FormData();
    formData.append('recipient_id', recipientId);
    formData.append('content', content);
    formData.append('csrfmiddlewaretoken', csrfToken);
    
    try {
        const response = await fetch('/send_message/', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showNotification('Message sent successfully!', 'success');
            return true;
        } else {
            const errorMessage = data.message || 'Failed to send message';
            showNotification(errorMessage, 'error');
            return false;
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
        return false;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeMessageModal();
            }
        });
    }
    
    // Handle Enter key in textarea (Ctrl+Enter to send)
    const messageText = document.getElementById('messageText');
    if (messageText) {
        messageText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Handle Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeMessageModal();
        }
    });
});

