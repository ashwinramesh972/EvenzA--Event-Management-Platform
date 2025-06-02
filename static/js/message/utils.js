document.addEventListener('DOMContentLoaded', function() {
    // Global currentUserId handling
    window.currentUserId = typeof currentUserId !== 'undefined' ? currentUserId : null;
    
    // Tab switching logic with error handling
    const directTab = document.querySelector('a[href="#direct"]');
    const groupTab = document.querySelector('a[href="#group"]');
    const directContent = document.getElementById('direct');
    const groupContent = document.getElementById('group');

    if (directTab && groupTab && directContent && groupContent) {
        directTab.addEventListener('click', function(e) {
            e.preventDefault();
            directTab.classList.add('active');
            groupTab.classList.remove('active');
            directContent.classList.add('show', 'active');
            groupContent.classList.remove('show', 'active');
        });

        groupTab.addEventListener('click', function(e) {
            e.preventDefault();
            groupTab.classList.add('active');
            directTab.classList.remove('active');
            groupContent.classList.add('show', 'active');
            directContent.classList.remove('show', 'active');
        });
    } else {
        console.warn('Message tabs or content elements not found in the DOM');
    }

    // Error handling helper
    window.handleFetchError = function(error, element, message = 'An error occurred') {
        console.error(error);
        if (element) {
            element.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        }
    };

    // Add retry mechanism for failed API calls
    window.fetchWithRetry = function(url, options = {}, maxRetries = 2) {
        return new Promise((resolve, reject) => {
            const makeRequest = (retriesLeft) => {
                fetch(url, options)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        resolve(response);
                    })
                    .catch(error => {
                        if (retriesLeft > 0) {
                            console.log(`Retrying fetch to ${url}, ${retriesLeft} retries left`);
                            setTimeout(() => makeRequest(retriesLeft - 1), 1000);
                        } else {
                            reject(error);
                        }
                    });
            };
            makeRequest(maxRetries);
        });
    };
});

// Improved polling for new messages with better error handling
let pollingInterval;
let lastEventId = null;
let lastRecipientId = null;
let failedAttempts = 0;
const MAX_FAILED_ATTEMPTS = 3;

function startMessagesPolling(eventId, recipientId, isGroup = false) {
    // Reset failed attempts counter
    failedAttempts = 0;
    
    // Validate inputs
    if (!eventId || (!recipientId && !isGroup)) {
        console.error('Invalid parameters for message polling');
        return;
    }

    // Clear existing polling
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    // Update tracking variables
    lastEventId = eventId;
    lastRecipientId = isGroup ? null : recipientId;

    const url = isGroup 
        ? `/message/get_group_messages/${eventId}/` 
        : `/message/get_direct_messages/${eventId}/${recipientId}/`;

    pollingInterval = setInterval(() => {
        fetch(url)
            .then(response => {
                // Reset failed attempts counter on success
                failedAttempts = 0;
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                // Check content type
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Server did not return JSON');
                }
                
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    updateMessages(data.messages, isGroup);
                } else if (data.limit_reached) {
                    // Handle limit reached
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        chatMessages.innerHTML = `
                            <div class="alert alert-danger" role="alert">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                ${data.message || 'Message limit reached. Please upgrade your account.'}
                                <a href="/user/upgrade/${window.currentUserId}" class="btn btn-danger btn-sm float-end">Upgrade Now</a>
                            </div>
                        `;
                    }
                    
                    // Stop polling if limit reached
                    clearInterval(pollingInterval);
                }
            })
            .catch(error => {
                console.error('Error polling messages:', error);
                failedAttempts++;
                
                // Stop polling after multiple consecutive failures
                if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                    console.warn(`Stopped polling after ${MAX_FAILED_ATTEMPTS} failed attempts`);
                    clearInterval(pollingInterval);
                    
                    // Show error to user
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'alert alert-warning text-center';
                        errorDiv.innerHTML = `
                            <p>Connection lost. <button class="btn btn-sm btn-link" onclick="reconnectMessaging()">Reconnect</button></p>
                        `;
                        
                        // Only append if not already shown
                        if (!chatMessages.querySelector('.alert-warning')) {
                            chatMessages.appendChild(errorDiv);
                        }
                    }
                }
            });
    }, 5000);
}

// Update messages when polling returns results
function updateMessages(messages, isGroup) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Get list of existing message IDs to avoid duplicates
    const currentMessages = Array.from(chatMessages.querySelectorAll('[data-message-id]'))
        .map(element => element.dataset.messageId)
        .filter(id => id);
    
    // Filter to only new messages
    const newMessages = messages.filter(message => 
        !currentMessages.includes(message.id.toString())
    );

    if (newMessages.length > 0) {
        // Check if we need to scroll to bottom (if already at bottom)
        const wasAtBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= 
            chatMessages.scrollTop + 50; // 50px threshold for "at bottom"
        
        // Remove "no messages yet" placeholder if present
        const placeholder = chatMessages.querySelector('.text-muted');
        if (placeholder && placeholder.textContent.includes('No messages yet')) {
            chatMessages.removeChild(placeholder);
        }
        
        // Add new messages
        newMessages.forEach(message => {
            const userId = window.currentUserId;
            const messageClass = message.sender.id === userId ? 'text-end' : 'text-start';
            const messageDiv = document.createElement('div');
            messageDiv.className = `${messageClass} mb-2`;
            messageDiv.dataset.messageId = message.id;
            
            // Add timestamp formatting with error handling
            let formattedTime;
            try {
                formattedTime = new Date(message.sent_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } catch (e) {
                formattedTime = 'Just now';
                console.warn('Error formatting message timestamp:', e);
            }
            
            messageDiv.innerHTML = `
                <strong>${message.sender.username}</strong>
                <p>${message.content}</p>
                <small class="text-muted">${formattedTime}</small>
            `;
            chatMessages.appendChild(messageDiv);
        });

        // Scroll to bottom if we were already at bottom
        if (wasAtBottom) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Play notification sound for received messages
        const receivedMessages = newMessages.filter(message => 
            message.sender.id !== window.currentUserId
        );
        
        if (receivedMessages.length > 0) {
            playNotificationSound();
        }
    }
}

// Function to play notification sound
function playNotificationSound() {
    try {
        const notificationSound = new Audio('/static/sounds/notification.mp3');
        notificationSound.volume = 0.5;
        notificationSound.play().catch(e => {
            console.warn('Could not play notification sound:', e);
        });
    } catch (e) {
        console.warn('Error creating Audio object:', e);
    }
}

// Reconnect messaging function (called by reconnect button)
window.reconnectMessaging = function() {
    if (lastEventId) {
        if (lastRecipientId) {
            // Reconnect direct messages
            window.loadDirectMessages(lastEventId, lastRecipientId, '', '');
        } else {
            // Reconnect group messages
            window.loadGroupMessages(lastEventId, '');
        }
    }
};

window.startMessagesPolling = startMessagesPolling;