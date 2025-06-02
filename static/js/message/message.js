document.addEventListener('DOMContentLoaded', () => {
    // Ensure currentUserId is available globally
    window.currentUserId = typeof currentUserId !== 'undefined' ? currentUserId : null;
    
    // Initialize active tab based on URL or defaults to direct messages
    initializeActiveTab();
    
    // Initialize tooltips and popovers
    initializeBootstrapComponents();

    // Setup event listeners for the chat interface
    setupEventListeners();

    // If we're in a conversation view, initialize the chat
    initializeChat();
});

// Utility Functions
function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrftoken=')) {
            return cookie.substring('csrftoken='.length);
        }
    }
    // Fallback to get token from input field if cookie not found
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    return csrfInput ? csrfInput.value : null;
}

function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: message || 'An error occurred',
            icon: 'error',
            confirmButtonText: 'OK',
        });
    } else {
        console.error('Error:', message);
        alert(message || 'An error occurred');
    }
}

function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Success',
            text: message,
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 1500
        });
    } else {
        console.log('Success:', message);
        alert(message);
    }
}

// Initialization Functions
function initializeActiveTab() {
    // Set active tab based on URL or default to direct messages
    const url = window.location.href;
    const directTab = document.getElementById('direct-tab');
    const groupTab = document.getElementById('group-tab');
    
    if (url.includes('/messages/group/')) {
        if (groupTab) groupTab.click();
    } else {
        if (directTab) directTab.click();
    }
}

function initializeBootstrapComponents() {
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        
        // Initialize popovers
        const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
        popovers.forEach(popover => {
            new bootstrap.Popover(popover);
        });
    }
}

function setupEventListeners() {
    // Tab switching event listeners
    const directTab = document.getElementById('direct-tab');
    const groupTab = document.getElementById('group-tab');
    
    if (directTab) {
        directTab.addEventListener('click', () => {
            console.log('Switched to direct messages tab');
        });
    }
    
    if (groupTab) {
        groupTab.addEventListener('click', () => {
            console.log('Switched to group messages tab');
        });
    }
}

// Chat Initialization
function initializeChat() {
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    
    // If we're not in a chat view, exit early
    if (!chatMessages) return;
    
    // Scroll to bottom of chat
    scrollToBottom();
    
    // Check if we're in a group chat or direct message
    const isGroupChat = !!document.getElementById('group-indicator');
    
    // Setup message sending
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => sendMessage(isGroupChat));
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(isGroupChat);
            }
        });
    }
    
    // Setup polling for new messages
    setupMessagesPolling(isGroupChat);
    
    // Check message limits on load
    updateMessageLimit();
}

// Scroll chat to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Handle sending messages
function sendMessage(isGroupChat) {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    const content = messageInput ? messageInput.value.trim() : '';
    
    // Get event ID and recipient ID from URL or form
    let eventId, recipientId;
    
    // Try to get IDs from URL first
    const urlParts = window.location.pathname.split('/');
    if (urlParts.length >= 2) {
        eventId = urlParts[urlParts.length - 1];
        recipientId = isGroupChat ? null : urlParts[urlParts.length - 2];
    }
    
    // Fall back to form inputs if available
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        const eventIdInput = messageForm.querySelector('input[name="event_id"]');
        const recipientIdInput = messageForm.querySelector('input[name="recipient_id"]');
        
        if (eventIdInput && eventIdInput.value) {
            eventId = eventIdInput.value;
        }
        
        if (!isGroupChat && recipientIdInput && recipientIdInput.value) {
            recipientId = recipientIdInput.value;
        }
    }
    
    // Validate input
    if (!content) {
        showError('Message content is required');
        return;
    }
    
    if (!eventId || (!isGroupChat && !recipientId)) {
        showError('Missing event or recipient information');
        console.error('Missing eventId or recipientId:', { eventId, recipientId, isGroupChat });
        return;
    }
    
    // Disable UI while sending
    if (messageInput) messageInput.disabled = true;
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    let endpoint, payload;
    
    if (isGroupChat) {
        // Group message
        endpoint = `/message/send_group/${eventId}/`;
        payload = { content: content };
    } else {
        // Direct message
        endpoint = '/message/send_message_api/';
        payload = {
            event_id: eventId,
            recipient_id: recipientId,
            content: content
        };
    }
    
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
        console.warn('CSRF token not found, form submission may fail');
    }
    
    // Send message via API
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => {
        // First check if response is ok - THIS IS THE KEY CHANGE
        if (response.status === 403) {
            // This is likely a limit reached issue, handle it specially
            return response.json().then(data => {
                // Add a flag to indicate this was a 403 response
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
        // Re-enable UI
        if (messageInput) messageInput.disabled = false;
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
        
        // Check for limit error first (from the 403 handler)
        if (data._limitError || data.limit_reached) {
            handleMessageLimitError(data.message || data.error || 'Message limit reached');
            return;
        }
        
        if (data.success || data.status === 'success') {
            // Clear input
            if (messageInput) messageInput.value = '';
            
            // Add message to UI for direct messages or refresh for group messages
            if (!isGroupChat) {
                addMessageToUI({
                    content: content,
                    sent_at: new Date().toISOString(),
                    sender: { 
                        id: parseInt(window.currentUserId), 
                        username: 'You' 
                    }
                }, true);
            } else {
                if (typeof loadGroupMessages === 'function') {
                    loadGroupMessages(eventId);
                }
            }
            
            // Update message limit info
            updateMessageLimit();
            
            // Scroll to bottom
            scrollToBottom();
        } else {
            // Handle error
            showError(data.error || data.message || 'Failed to send message');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (messageInput) messageInput.disabled = false;
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
        showError('An error occurred while sending the message');
    });
}

// Add a message to UI
function addMessageToUI(message, isSent = false) {
    const chatMessages = document.getElementById('chat-messages');
    const userId = window.currentUserId;
    
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent || (message.sender && message.sender.id === parseInt(userId)) ? 'sent' : 'received'}`;
    
    // Only show sender name for received group messages
    let senderHTML = '';
    if (!isSent && message.sender && message.sender.id !== parseInt(userId) && document.getElementById('group-indicator')) {
        senderHTML = `<div class="message-sender">${message.sender.username || 'User'}</div>`;
    }
    
    messageDiv.innerHTML = `
        ${senderHTML}
        <div class="message-content">${message.content}</div>
        <div class="message-timestamp">${new Date(message.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Setup polling for new messages
function setupMessagesPolling(isGroupChat) {
    const urlParts = window.location.pathname.split('/');
    let eventId, recipientId;
    
    // Try to extract IDs from URL
    if (urlParts.length >= 2) {
        eventId = urlParts[urlParts.length - 1];
        recipientId = isGroupChat ? null : urlParts[urlParts.length - 2];
    }
    
    // Fall back to form inputs if available
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        const eventIdInput = messageForm.querySelector('input[name="event_id"]');
        const recipientIdInput = messageForm.querySelector('input[name="recipient_id"]');
        
        if (eventIdInput && eventIdInput.value) {
            eventId = eventIdInput.value;
        }
        
        if (!isGroupChat && recipientIdInput && recipientIdInput.value) {
            recipientId = recipientIdInput.value;
        }
    }
    
    // Validate we have the required IDs
    if (!eventId || (!isGroupChat && !recipientId)) {
        console.error('Missing eventId or recipientId for message polling', { eventId, recipientId, isGroupChat });
        return;
    }
    
    // Start polling with the appropriate function
    if (isGroupChat) {
        // For group messages
        if (typeof window.startMessagesPolling === 'function') {
            window.startMessagesPolling(eventId, null, true);
        } else if (typeof loadGroupMessages === 'function') {
            // Initial load and set up interval
            loadGroupMessages(eventId);
            setInterval(() => loadGroupMessages(eventId), 5000);
        }
    } else {
        // For direct messages
        if (typeof window.startMessagesPolling === 'function') {
            window.startMessagesPolling(eventId, recipientId, false);
        } else if (typeof loadDirectMessages === 'function') {
            // Initial load and set up interval
            loadDirectMessages(eventId, recipientId);
            setInterval(() => loadDirectMessages(eventId, recipientId), 5000);
        }
    }
}

// Load group messages
window.loadGroupMessages = function(eventId, eventTitle, element) {
    if (!eventId) {
        console.error('Missing eventId parameter for loadGroupMessages');
        return;
    }

    eventId = parseInt(eventId);
    if (isNaN(eventId)) {
        console.error('Invalid eventId parameter');
        return;
    }

    // Highlight the selected conversation
    highlightActiveConversation(element);

    const chatMessages = document.getElementById('chat-messages');
    const conversationHeader = document.getElementById('conversation-header');
    const messageInputContainer = document.getElementById('message-input-container');

    if (conversationHeader) {
        conversationHeader.innerHTML = `<h5>Group: ${eventTitle || 'Event'}</h5>`;
    }

    if (chatMessages) {
        chatMessages.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading messages...</p>';
    }

    fetch(`/message/get_group_messages/${eventId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                chatMessages.innerHTML = '';
                if (!data.messages || data.messages.length === 0) {
                    chatMessages.innerHTML = '<p class="text-muted text-center">No messages yet. Start the conversation!</p>';
                } else {
                    data.messages.forEach(message => {
                        const isCurrentUser = message.sender.id === parseInt(window.currentUserId);
                        const messageClass = isCurrentUser ? 'message-out' : 'message-in';
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `message ${messageClass} mb-2`;
                        messageDiv.dataset.messageId = message.id;

                        let quoteHtml = '';
                        if (message.content.startsWith('Replying to ')) {
                            const endOfQuote = message.content.indexOf('"\n');
                            if (endOfQuote > -1) {
                                const quote = message.content.substring(0, endOfQuote + 1);
                                const actualMessage = message.content.substring(endOfQuote + 2);
                                quoteHtml = `<div class="quoted-message">${quote}</div>`;
                                message.content = actualMessage;
                            }
                        }

                        messageDiv.innerHTML = `
                            ${!isCurrentUser ? `<div class="message-sender">${message.sender.username}</div>` : ''}
                            ${quoteHtml}
                            <div class="message-bubble">
                                <div class="message-content">${message.content}</div>
                                <div class="message-meta">
                                    <small class="text-muted">${new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                </div>
                            </div>
                        `;

                        messageDiv.addEventListener('contextmenu', function(e) {
                            e.preventDefault();
                            const existingMenu = document.querySelector('.message-context-menu');
                            if (existingMenu) {
                                existingMenu.remove();
                            }
                            const contextMenu = document.createElement('div');
                            contextMenu.className = 'message-context-menu';
                            contextMenu.style.position = 'absolute';
                            contextMenu.style.left = `${e.pageX}px`;
                            contextMenu.style.top = `${e.pageY}px`;
                            contextMenu.style.background = '#fff';
                            contextMenu.style.border = '1px solid #ddd';
                            contextMenu.style.borderRadius = '4px';
                            contextMenu.style.padding = '8px';
                            contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                            contextMenu.style.zIndex = '1000';
                            const replyButton = document.createElement('button');
                            replyButton.className = 'btn btn-sm btn-light';
                            replyButton.innerText = 'Reply';
                            replyButton.onclick = function() {
                                const contentInput = document.getElementById('message-input');
                                if (contentInput) {
                                    const replyContent = `Replying to ${message.sender.username}: "${message.content}"\n`;
                                    contentInput.value = replyContent;
                                    contentInput.focus();
                                    contextMenu.remove();
                                }
                            };
                            contextMenu.appendChild(replyButton);
                            document.body.appendChild(contextMenu);
                            document.addEventListener('click', function closeMenu() {
                                contextMenu.remove();
                                document.removeEventListener('click', closeMenu);
                            });
                        });

                        chatMessages.appendChild(messageDiv);
                    });
                }

                if (messageInputContainer) {
                    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
                    const csrfToken = csrfInput ? csrfInput.value : '';
                    messageInputContainer.innerHTML = `
                        <form id="message-form" class="message-form">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                            <input type="hidden" name="event_id" value="${eventId}">
                            <input type="hidden" name="message_type" value="group">
                            <div class="input-group">
                                <input type="text" class="form-control" id="message-input" name="content" placeholder="Type a message..." required>
                                <button type="submit" class="btn btn-primary send-btn" id="send-message">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    `;
                    setupMessageFormListener();
                }

                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (window.startMessagesPolling) {
                    window.startMessagesPolling(eventId, null, true);
                }
            } else {
                chatMessages.innerHTML = '<p class="text-danger text-center">Error loading messages: ' + (data.error || 'Unknown error') + '</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching group messages:', error);
            chatMessages.innerHTML = '<p class="text-danger text-center">Error loading messages. Please try again later.</p>';
            checkMessageLimit(eventId);
        });
};

// Load direct messages
function loadDirectMessages(eventId, recipientId, recipientUsername, eventTitle) {
    // Validate parameters
    if (!eventId || !recipientId) {
        console.error('Missing required parameters for loadDirectMessages');
        return;
    }

    // Convert to integers to ensure valid parameters
    try {
        eventId = parseInt(eventId);
        recipientId = parseInt(recipientId);
    } catch (e) {
        console.error('Invalid parameters for loadDirectMessages', e);
        return;
    }
    
    if (isNaN(eventId) || isNaN(recipientId)) {
        console.error('Invalid eventId or recipientId parameters');
        return;
    }

    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const conversationHeader = document.getElementById('conversation-header');

    // Update conversation header if it exists
    if (conversationHeader && recipientUsername) {
        conversationHeader.innerHTML = `<h5>Conversation with ${recipientUsername || 'User'} (Event: ${eventTitle || 'Event'})</h5>`;
    }

    // Show loading indicator if we have a container
    if (chatMessages) {
        chatMessages.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading messages...</p>';
    }

    fetch(`/message/get_direct_messages/${eventId}/${recipientId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Try to parse as JSON but handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                // Handle non-JSON responses - try to get text first
                throw new Error('Server did not return JSON');
            }
        })
        .then(data => {
            if (data.success) {
                // Update messages UI
                updateMessagesUI(data.messages);
                
                // Update form for direct messages if needed
                if (messageForm) {
                    const csrfToken = getCSRFToken();
                    
                    messageForm.innerHTML = `
                        <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken || ''}">
                        <input type="hidden" name="event_id" value="${eventId}">
                        <input type="hidden" name="recipient_id" value="${recipientId}">
                        <input type="hidden" name="message_type" value="direct">
                        <div class="input-group">
                            <input type="text" class="form-control" name="content" placeholder="Type a message..." required>
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    `;
                }
                
                // Start polling for new messages
                if (window.startMessagesPolling) {
                    window.startMessagesPolling(eventId, recipientId, false);
                }
            } else {
                // Handle error status
                if (chatMessages) {
                    chatMessages.innerHTML = '<p class="text-danger text-center">Error loading messages.</p>';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching direct messages:', error);
            
            if (chatMessages) {
                chatMessages.innerHTML = '<p class="text-danger text-center">Error loading messages. Please try again later.</p>';
            }
            
            // Try to check message limits
            checkMessageLimit();
        });
}

// Update the messages UI with fresh data
function updateMessagesUI(messages) {
    const chatMessages = document.getElementById('chat-messages');
    const userId = window.currentUserId;
    
    if (!chatMessages || !messages) return;
    
    // Store scroll position and check if we were at the bottom
    const wasAtBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 50;
    
    // Clear existing messages
    chatMessages.innerHTML = '';
    
    // Check if we have messages to display
    if (messages.length === 0) {
        chatMessages.innerHTML = '<p class="text-muted text-center">No messages yet. Start the conversation!</p>';
        return;
    }
    
    // Check if it's group chat
    const isGroupChat = document.getElementById('group-indicator') !== null;
    
    // Add all messages
    messages.forEach(message => {
        // Skip invalid messages
        if (!message || !message.content) return;
        
        const messageDiv = document.createElement('div');
        const isCurrentUser = message.sender && message.sender.id === parseInt(userId);
        messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
        
        if (message.id) {
            messageDiv.dataset.messageId = message.id;
        }
        
        // Decide whether to show sender name (only in group chats for received messages)
        let senderHTML = '';
        if (!isCurrentUser && isGroupChat && message.sender) {
            senderHTML = `<div class="message-sender">${message.sender.username || 'User'}</div>`;
        }
        
        // Format timestamp
        let timestamp;
        try {
            timestamp = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
            timestamp = 'Just now';
            console.warn('Error formatting message timestamp:', e);
        }
        
        messageDiv.innerHTML = `
            ${senderHTML}
            <div class="message-content">${message.content || ''}</div>
            <div class="message-timestamp">${timestamp}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // If we were at the bottom before, scroll back to bottom
    if (wasAtBottom) {
        scrollToBottom();
    }
}

// Check and update message limit
function updateMessageLimit() {
    checkMessageLimit();
}

// Check message limits with error handling
function checkMessageLimit() {
    const endpoint = '/message/check_message_limit/';  // Updated endpoint without event_id

    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Message limit endpoint not found');
                    return null;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Try to parse JSON but handle errors gracefully
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                console.warn('Non-JSON response from message limit check');
                return null;
            }
        })
        .then(data => {
            if (!data) return;

            const messageLimitDiv = document.getElementById('message-limit');
            const input = document.getElementById('message-input');
            const sendButton = document.getElementById('send-message');

            if (!messageLimitDiv) return;

            if (data.limit_reached || !data.success) {
                // Show limit message and disable input
                handleMessageLimitError(data.error || data.message || 'Message limit reached');
            } else {
                // No limit issues, clear limit message and enable input
                messageLimitDiv.innerHTML = '';
                if (input) input.disabled = false;
                if (sendButton) sendButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error checking message limit:', error);
            // Don't display UI errors for this to avoid bothering the user
        });
}

// Handle message limit error
function handleMessageLimitError(errorMessage) {
    const messageLimitDiv = document.getElementById('message-limit');
    const input = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    
    // Disable inputs
    if (input) input.disabled = true;
    if (sendButton) sendButton.disabled = true;

    // Add message limit warning to the UI
    if (messageLimitDiv) {
        messageLimitDiv.innerHTML = `
            <div class="alert alert-danger mb-2">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${errorMessage || 'Message limit reached'} 
                <a href="/user/upgrade/${window.currentUserId}" class="btn btn-danger btn-sm float-end">Upgrade Now</a>
            </div>
        `;
    }

    // Show SweetAlert popup if available
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Message Limit Reached',
            text: errorMessage || 'You have reached your message limit. Upgrade your account to continue messaging.',
            icon: 'warning',
            confirmButtonText: 'Upgrade Now',
            showCancelButton: true,
            cancelButtonText: 'Dismiss',
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = `/user-upgrade/`;
            }
        });
    } else {
        // Fallback to regular alert if SweetAlert is not available
        const upgrade = confirm(errorMessage + '\n\nWould you like to upgrade your account now?');
        if (upgrade) {
            window.location.href = `/user-upgrade/`;
        }
    }
}

// Make functions globally available
window.loadDirectMessages = loadDirectMessages;
window.loadGroupMessages = loadGroupMessages;

