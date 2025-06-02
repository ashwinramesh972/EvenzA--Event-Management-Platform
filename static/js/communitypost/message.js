document.addEventListener('DOMContentLoaded', function() {
    // Variables to control popup display and message functionality
    let currentPopup = null;
    let timeoutId = null;
    const messageModalId = 'message-modal';
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Set up event listeners for profile picture hover
    setupProfileHoverEvents();
    
    // Create message modal if it doesn't exist yet
    createMessageModal();

    /**
     * Set up event listeners for profile picture hover effects
     */
    function setupProfileHoverEvents() {
        const profilePics = document.querySelectorAll('.profile-pic-container');
        
        profilePics.forEach(pic => {
            // Show popup on mouseenter
            pic.addEventListener('mouseenter', function() {
                const popup = this.querySelector('.pop-up-user-info');
                if (popup) {
                    // Clear any existing timeout
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    
                    // Hide any other open popup
                    if (currentPopup && currentPopup !== popup) {
                        currentPopup.style.display = 'none';
                    }
                    
                    // Show this popup
                    popup.style.display = 'flex';
                    currentPopup = popup;
                }
            });
            
            // Hide popup on mouseleave after a delay
            pic.addEventListener('mouseleave', function() {
                const popup = this.querySelector('.pop-up-user-info');
                if (popup) {
                    timeoutId = setTimeout(() => {
                        popup.style.display = 'none';
                        currentPopup = null;
                    }, 300); // Small delay to allow moving cursor to popup
                }
            });
        });

        // Set up event delegation for message buttons
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('pop-up-user-info-message-button')) {
                const popup = e.target.closest('.pop-up-user-info');
                if (popup) {
                    const recipientId = popup.getAttribute('data-recipient-id');
                    openMessageModal(recipientId);
                }
            }
        });
    }

    /**
     * Create the message modal that will be shown when clicking message button
     */
    function createMessageModal() {
        // Check if the modal already exists
        if (document.getElementById(messageModalId)) {
            return;
        }

        // Create modal elements
        const modal = document.createElement('div');
        modal.id = messageModalId;
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content message-modal-content">
                <div class="modal-header">
                    <h2>Send Message</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="send-message-form">
                        <input type="hidden" id="recipient-id" name="recipient_id">
                        <div class="form-group">
                            <label for="message-content">Message</label>
                            <textarea id="message-content" name="content" placeholder="Type your message here..." maxlength="500" required></textarea>
                            <div class="char-counter">0/500</div>
                        </div>
                        <div id="message-error" class="error-message" style="display: none;"></div>
                        <div class="form-actions">
                            <button type="button" class="cancel-button">Cancel</button>
                            <button type="submit" class="send-message-button">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.appendChild(modal);

        // Set up event listeners for the modal
        const closeButton = modal.querySelector('.close-modal');
        const cancelButton = modal.querySelector('.cancel-button');
        const messageForm = modal.querySelector('#send-message-form');
        const messageContent = modal.querySelector('#message-content');
        const charCounter = modal.querySelector('.char-counter');

        // Close modal events
        closeButton.addEventListener('click', closeMessageModal);
        cancelButton.addEventListener('click', closeMessageModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeMessageModal();
            }
        });

        // Character counter for message content
        messageContent.addEventListener('input', function() {
            charCounter.textContent = `${this.value.length}/500`;
        });

        // Form submission
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });
    }

    /**
     * Open the message modal with recipient details
     * @param {string} recipientId - The ID of the message recipient
     */
    function openMessageModal(recipientId) {
        const modal = document.getElementById(messageModalId);
        if (!modal) return;

        // Set recipient ID in the form
        document.getElementById('recipient-id').value = recipientId;
        
        // Reset form state
        document.getElementById('message-content').value = '';
        document.querySelector('#' + messageModalId + ' .char-counter').textContent = '0/500';
        document.getElementById('message-error').style.display = 'none';
        
        // Display modal
        modal.style.display = 'block';
    }

    /**
     * Close the message modal
     */
    function closeMessageModal() {
        const modal = document.getElementById(messageModalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Send message via AJAX
     */
    function sendMessage() {
        const recipientId = document.getElementById('recipient-id').value;
        const content = document.getElementById('message-content').value.trim();
        const errorElement = document.getElementById('message-error');
        
        if (!content) {
            showError(errorElement, 'Please enter a message');
            return;
        }

        // Display loading state
        const sendButton = document.querySelector('.send-message-button');
        const originalText = sendButton.textContent;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';

        // Send AJAX request
        fetch('/message/api/send_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                recipient_id: recipientId,
                content: content
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            sendButton.disabled = false;
            sendButton.textContent = originalText;

            if (data.status === 'success') {
                // Show success message and close modal
                showNotification('Message sent successfully');
                closeMessageModal();
            } else {
                // Show error message
                showError(errorElement, data.message || 'Failed to send message');
            }
        })
        .catch(error => {
            // Reset button state and show error
            sendButton.disabled = false;
            sendButton.textContent = originalText;
            showError(errorElement, 'Error sending message. Please try again.');
            console.error('Error:', error);
        });
    }

    /**
     * Display error message in the form
     * @param {HTMLElement} element - Error element 
     * @param {string} message - Error message to display
     */
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    /**
     * Show a notification message to the user
     * @param {string} message - Message to display
     */
    function showNotification(message) {
        // Check if notification container exists, create if not
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.top = '20px';
            notificationContainer.style.right = '20px';
            notificationContainer.style.zIndex = '9999';
            document.body.appendChild(notificationContainer);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        // Add notification to container
        notificationContainer.appendChild(notification);

        // Remove notification after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
});