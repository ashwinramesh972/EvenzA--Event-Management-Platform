// Group Message View Functions
// Handles loading, displaying and sending group messages

// Initialize variables for polling
let groupMessagePollingInterval = null;
let currentEventId = null;

/**
 * Load group messages for a specific event
 * @param {number} eventId - The ID of the event
 * @param {string} eventTitle - The title of the event (optional)
 * @param {HTMLElement} element - The element that was clicked (optional)
 */
function loadGroupMessages(eventId, eventTitle = '', element = null) {
    if (!eventId) return;
    eventId = parseInt(eventId);
    if (isNaN(eventId)) return;

    currentEventId = eventId;
    if (groupMessagePollingInterval) clearInterval(groupMessagePollingInterval);

    if (element) {
        document.querySelectorAll('.conversation-item, .list-group-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
    }

    // Hide the "no-conversation" div
    const noConversationDiv = document.querySelector('.no-conversation');
    if (noConversationDiv) {
        noConversationDiv.style.display = 'none';
    }

    const conversationHeader = document.getElementById('conversation-header');
    if (conversationHeader) {
        conversationHeader.innerHTML = `<h5>Group: ${eventTitle || 'Event Chat'}</h5><span class="badge bg-info" id="group-indicator">Group Chat</span>`;
    }

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
    }

    fetch(`/message/get_group_messages/${eventId}/`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayGroupMessages(data.messages);
                updateGroupMessageForm(eventId, data.user_role, data.isCreator);
                startGroupMessagesPolling(eventId);
                checkGroupMessageLimit(eventId);
            } else if (chatMessages) {
                chatMessages.innerHTML = `<div class="alert alert-danger">Error loading messages: ${data.error || 'Unknown error'}</div>`;
            }
        })
        .catch(error => {
            console.error('Error loading group messages:', error);
            if (chatMessages) {
                chatMessages.innerHTML = '<div class="alert alert-danger">Failed to load messages. Please try again later.</div>';
            }
        });
}

/**
 * Display group messages in the chat area
 * @param {Array} messages - Array of message objects
 */
function displayGroupMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Store scroll position info
    const wasAtBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 50;
    
    // Clear existing messages
    chatMessages.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = '<div class="text-center text-muted p-3">No messages yet. Start the conversation!</div>';
        return;
    }
    
    const userId = window.currentUserId;
    
    messages.forEach(message => {
        const isCurrentUser = message.sender && message.sender.id === parseInt(userId);
        const messageClass = isCurrentUser ? 'message-out' : 'message-in';
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${messageClass} mb-2`;
        messageDiv.dataset.messageId = message.id || '';
        
        // Format date/time
        let timeDisplay;
        try {
            const messageDate = new Date(message.sent_at);
            timeDisplay = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch(e) {
            timeDisplay = 'Unknown time';
        }
        
        // Include sender name for non-current users
        const senderHTML = !isCurrentUser ? `<div class="message-sender">${message.sender.username}</div>` : '';
        
        messageDiv.innerHTML = `
            ${senderHTML}
            <div class="message-bubble">
                <div class="message-content">${message.content}</div>
                <div class="message-meta">
                    <small class="text-muted">${timeDisplay}</small>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Restore scroll position if needed
    if (wasAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Update or create the message input form for group chats
 * @param {number} eventId - The ID of the event
 * @param {string} userRole - The user's role (joiner, creator, premium)
 * @param {boolean} isCreator - Whether the user is the creator of this event
 */
function updateGroupMessageForm(eventId, userRole, isCreator) {
    const container = document.getElementById('message-input-container') || document.querySelector('.chat-area');
    const csrfToken = getCSRFToken();
    
    let formHTML = `
        <div id="message-limit" class="mb-2"></div>
        <form id="message-form" class="message-form">
            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
            <input type="hidden" name="event_id" value="${eventId}">
            <input type="hidden" name="message_type" value="group">
            <div class="input-group">
                <input type="text" class="form-control" id="message-input" name="content" placeholder="Type a message..." required>
                <button type="button" class="btn btn-primary send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </form>
    `;

    if (container) container.innerHTML = formHTML;

    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-btn');

    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => sendGroupMessage(eventId));
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendGroupMessage(eventId);
            }
        });
    }
}

/**
 * Send a group message
 * @param {number} eventId - The ID of the event
 */
function sendGroupMessage(eventId) {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-btn');
    
    if (!messageInput || !messageInput.value.trim()) {
        return;
    }
    
    const content = messageInput.value.trim();
    
    // Disable UI while sending
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Get CSRF token
    const csrfToken = getCSRFToken();
    
    // Add temporary message to UI
    const chatMessages = document.getElementById('chat-messages');
    const tempMessageId = 'temp-' + Date.now();
    const tempMessageDiv = document.createElement('div');
    tempMessageDiv.className = 'message message-out mb-2';
    tempMessageDiv.dataset.messageId = tempMessageId;
    
    tempMessageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${content}</div>
            <div class="message-meta">
                <small class="text-muted">Sending...</small>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(tempMessageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Send message via API
    fetch(`/message/send_group_message/${eventId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            event_id: eventId
        }),
    })
    .then(response => {
        if (response.status === 403) {
            // Handle limit exceeded
            return response.json().then(data => {
                data._limitError = true;
                return data;
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        // Remove temporary message
        const tempMsg = chatMessages.querySelector(`[data-message-id="${tempMessageId}"]`);
        if (tempMsg) {
            chatMessages.removeChild(tempMsg);
        }
        
        // Re-enable UI
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        if (data._limitError || data.limit_reached) {
            // Handle message limit reached
            handleGroupMessageLimitError(data.message || data.error || 'Message limit reached');
            return;
        }
        
        if (data.success) {
            // Clear input
            messageInput.value = '';
            
            // Add the new message to UI
            const newMessage = {
                id: data.message_id || Date.now(),
                content: content,
                sender: {
                    id: parseInt(window.currentUserId),
                    username: data.username || 'You'
                },
                sent_at: new Date().toISOString()
            };
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message message-out mb-2';
            messageDiv.dataset.messageId = newMessage.id;
            
            let timeDisplay;
            try {
                const messageDate = new Date(newMessage.sent_at);
                timeDisplay = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } catch(e) {
                timeDisplay = 'Just now';
            }
            
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    <div class="message-content">${newMessage.content}</div>
                    <div class="message-meta">
                        <small class="text-muted">${timeDisplay}</small>
                    </div>
                </div>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Update message limit info
            checkGroupMessageLimit(eventId);
        } else {
            // Handle error
            showError(data.error || data.message || 'Failed to send message');
        }
    })
    .catch(error => {
        console.error('Error sending group message:', error);
        
        // Update temporary message to show error
        const tempMsg = chatMessages.querySelector(`[data-message-id="${tempMessageId}"]`);
        if (tempMsg) {
            const messageMeta = tempMsg.querySelector('.message-meta');
            if (messageMeta) {
                messageMeta.innerHTML = '<small class="text-danger">Failed to send. Tap to retry.</small>';
                tempMsg.style.opacity = '0.7';
                tempMsg.style.cursor = 'pointer';
                tempMsg.addEventListener('click', function() {
                    chatMessages.removeChild(tempMsg);
                    messageInput.value = content;
                    messageInput.focus();
                });
            }
        }
        
        // Re-enable UI
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    });
}

/**
 * Check group message limit for the current user
 * @param {number} eventId - The ID of the event
 */
function checkGroupMessageLimit(eventId) {
    fetch(`/message/check_group_message_limit/${eventId}/`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Group message limit endpoint not found');
                    return null;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            
            const messageLimitDiv = document.getElementById('message-limit');
            if (!messageLimitDiv) return;
            
            if (data.limit_reached) {
                // Show limit message
                handleGroupMessageLimitError(data.message || 'Group message limit reached');
            } else if (data.approaching_limit) {
                // Show warning for approaching limit
                messageLimitDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${data.message || 'You are approaching your group message limit'}
                    </div>
                `;
            } else {
                // Clear limit message
                messageLimitDiv.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error checking group message limit:', error);
        });
}

/**
 * Handle group message limit error
 * @param {string} errorMessage - The error message to display
 */
function handleGroupMessageLimitError(errorMessage) {
    const messageLimitDiv = document.getElementById('message-limit');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-btn');
    
    // Disable input
    if (messageInput) messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;
    
    // Show error message
    if (messageLimitDiv) {
        messageLimitDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${errorMessage || 'Group message limit reached'}
                <a href="/user/upgrade/${window.currentUserId}" class="btn btn-danger btn-sm float-end">Upgrade Now</a>
            </div>
        `;
    }
    
    // Show popup if available
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Message Limit Reached',
            text: errorMessage || 'You have reached your group message limit. Upgrade your account to continue messaging.',
            icon: 'warning',
            confirmButtonText: 'Upgrade Now',
            showCancelButton: true,
            cancelButtonText: 'Dismiss',
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = `/user-upgrade/`;
            }
        });
    }
}

/**
 * Start polling for new group messages
 * @param {number} eventId - The ID of the event
 */
function startGroupMessagesPolling(eventId) {
    // Clear any existing interval
    if (groupMessagePollingInterval) {
        clearInterval(groupMessagePollingInterval);
    }
    
    // Set up new polling interval
    const POLLING_INTERVAL = 5000; // 5 seconds
    
    // Store last message ID to fetch only new messages
    let lastMessageId = getLastMessageId();
    
    groupMessagePollingInterval = setInterval(() => {
        // Only poll if this tab is visible
        if (!document.hidden) {
            pollNewGroupMessages(eventId, lastMessageId);
        }
    }, POLLING_INTERVAL);
}

/**
 * Poll for new group messages
 * @param {number} eventId - The ID of the event
 * @param {number} lastMessageId - The ID of the last message received
 */
function pollNewGroupMessages(eventId, lastMessageId) {
    fetch(`/message/get_new_group_messages/${eventId}/${lastMessageId || 0}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.messages && data.messages.length > 0) {
                // Append new messages to the UI
                appendNewGroupMessages(data.messages);
                
                // Update last message ID
                const newLastId = getLastMessageId();
                if (newLastId) {
                    lastMessageId = newLastId;
                }
            }
        })
        .catch(error => {
            console.error('Error polling for new group messages:', error);
        });
}

/**
 * Append new group messages to the UI
 * @param {Array} messages - Array of new message objects
 */
function appendNewGroupMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const userId = window.currentUserId;
    const wasAtBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 50;
    
    messages.forEach(message => {
        // Skip if message already exists in DOM
        if (document.querySelector(`[data-message-id="${message.id}"]`)) {
            return;
        }
        
        const isCurrentUser = message.sender && message.sender.id === parseInt(userId);
        const messageClass = isCurrentUser ? 'message-out' : 'message-in';
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${messageClass} mb-2`;
        messageDiv.dataset.messageId = message.id || '';
        
        // Format time
        let timeDisplay;
        try {
            const messageDate = new Date(message.sent_at);
            timeDisplay = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch(e) {
            timeDisplay = 'Just now';
        }
        
        // Include sender name for non-current users
        const senderHTML = !isCurrentUser ? `<div class="message-sender">${message.sender.username}</div>` : '';
        
        messageDiv.innerHTML = `
            ${senderHTML}
            <div class="message-bubble">
                <div class="message-content">${message.content}</div>
                <div class="message-meta">
                    <small class="text-muted">${timeDisplay}</small>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Scroll to bottom if we were already at bottom
    if (wasAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Get the ID of the last message in the chat
 * @returns {number|null} The ID of the last message or null if no messages
 */
function getLastMessageId() {
    const messages = document.querySelectorAll('[data-message-id]');
    if (messages.length === 0) return null;
    
    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage.dataset.messageId;
    
    return lastId ? parseInt(lastId) : null;
}

function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrftoken=')) {
            return cookie.substring('csrftoken='.length);
        }
    }
    return '';
}

// Export functions
window.loadGroupMessages = loadGroupMessages;
window.sendGroupMessage = sendGroupMessage;
window.checkGroupMessageLimit = checkGroupMessageLimit;
window.startGroupMessagesPolling = startGroupMessagesPolling;