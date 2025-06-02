window.currentUserId = window.currentUserId || null;

window.loadDirectMessages = function(recipientId, recipientUsername) {
    // Check if user is authenticated
    if (!window.currentUserId) {
        console.error('User not authenticated. Please log in to view messages.');
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '<p class="text-danger text-center">Please log in to view messages.</p>';
        }
        return;
    }

    // Validate parameters to prevent 404 errors
    if (!recipientId) {
        console.error('Missing required parameter for loadDirectMessages');
        return;
    }

    // Sanitize input parameters
    recipientId = parseInt(recipientId);
    if (isNaN(recipientId)) {
        console.error('Invalid recipientId parameter');
        return;
    }

    // Hide the "no-conversation" div
    const noConversationDiv = document.querySelector('.no-conversation');
    if (noConversationDiv) {
        noConversationDiv.style.display = 'none';
    }

    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const conversationHeader = document.getElementById('conversation-header');
    const messageInputContainer = document.getElementById('message-input-container');

    // Update conversation header
    if (conversationHeader) {
        conversationHeader.innerHTML = `<h5>Conversation with ${recipientUsername || 'User'}</h5>`;
    }

    // Clear previous messages and show loading indicator
    if (chatMessages) {
        chatMessages.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading messages...</p>';
    }

    // Fetch messages
    fetch(`/message/get_direct_messages/${recipientId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server did not return JSON');
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
                        const isCurrentUser = message.sender.id === currentUserId;
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
                    if (!csrfToken) {
                        console.warn('CSRF token not found, form submission may fail');
                    }
                    
                    messageInputContainer.innerHTML = `
                        <form id="message-form" class="message-form">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                            <input type="hidden" name="recipient_id" value="${recipientId}">
                            <input type="hidden" name="message_type" value="direct">
                            <div class="input-group">
                                <input type="text" class="form-control" id="message-input" name="content" placeholder="Type a message..." required>
                                <button type="submit" class="btn btn-primary send-btn">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    `;
                    
                    setupMessageFormListener();
                }

                chatMessages.scrollTop = chatMessages.scrollHeight;

                if (window.startMessagesPolling) {
                    window.startMessagesPolling(null, recipientId, false);
                } else {
                    console.error('startMessagesPolling function not found');
                }
            } else {
                chatMessages.innerHTML = '<p class="text-danger text-center">Error loading messages.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching direct messages:', error);
            chatMessages.innerHTML = '<p class="text-danger text-center">Error loading messages. Please try again later.</p>';
            fetch('/check_message_limit/')
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to check message limits');
                })
                .then(data => {
                    if (data.limit_reached) {
                        chatMessages.innerHTML = `
                            <div class="alert alert-danger" role="alert">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                ${data.message || 'Message limit reached. Please upgrade your account.'}
                                <a href="/user/upgrade/${currentUserId}" class="btn btn-danger btn-sm float-end">Upgrade Now</a>
                            </div>
                        `;
                    }
                })
                .catch(limitError => {
                    console.error('Error checking message limits:', limitError);
                });
        });
};

function setupMessageFormListener() {
    const messageForm = document.getElementById('message-form');
    if (!messageForm) return;
    
    messageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const recipientIdInput = messageForm.querySelector('input[name="recipient_id"]');
        const contentInput = document.getElementById('message-input');
        const csrfInput = messageForm.querySelector('input[name="csrfmiddlewaretoken"]');

        if (!recipientIdInput || !contentInput || !csrfInput) {
            console.error('Required form fields not found');
            return;
        }

        const recipientId = recipientIdInput.value;
        const content = contentInput.value.trim();
        if (!content) return;

        const submitBtn = messageForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        const chatMessages = document.getElementById('chat-messages');
        const tempMessageId = 'temp-' + Date.now();
        const tempMessageDiv = document.createElement('div');
        tempMessageDiv.className = 'message message-out mb-2';
        tempMessageDiv.dataset.messageId = tempMessageId;
        
        // Create a quoted message if this is a reply
        let quoteHtml = '';
        if (content.startsWith('Replying to ')) {
            const endOfQuote = content.indexOf('"\n');
            if (endOfQuote > -1) {
                const quote = content.substring(0, endOfQuote + 1);
                const actualMessage = content.substring(endOfQuote + 2);
                quoteHtml = `<div class="quoted-message">${quote}</div>`;
            }
        }
        
        tempMessageDiv.innerHTML = `
            ${quoteHtml}
            <div class="message-bubble">
                <div class="message-content">${content}</div>
                <div class="message-meta">
                    <small class="text-muted">Sending...</small>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(tempMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        fetch('/message/api/send_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfInput.value
            },
            body: JSON.stringify({
                recipient_id: recipientId,
                content: content
            })
        })
        .then(response => {
            // First check for 403 status (limit reached)
            if (response.status === 403) {
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
            const tempMsg = chatMessages.querySelector(`[data-message-id="${tempMessageId}"]`);
            if (tempMsg) {
                chatMessages.removeChild(tempMsg);
            }
            
            // Handle limit error first
            if (data._limitError || data.limit_reached) {
                // Show in-page alert
                chatMessages.innerHTML += `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        ${data.message || 'Message limit reached. Please upgrade your account.'}
                        <a href="/user/upgrade/${currentUserId}" class="btn btn-danger btn-sm float-end">Upgrade Now</a>
                    </div>
                `;
                
                // Show popup if SweetAlert is available
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Message Limit Reached',
                        text: data.message || 'You have reached your message limit. Upgrade your account to continue messaging.',
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
                    // Fallback to regular confirm dialog
                    const upgrade = confirm(data.message + '\n\nWould you like to upgrade your account now?');
                    if (upgrade) {
                        window.location.href = `/user-upgrade/`;
                    }
                }
                return;
            }
            
            if (data.status === 'success') {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message message-out mb-2';
                messageDiv.dataset.messageId = data.message.id;
                
                // Create a quoted message if this is a reply
                let quoteHtml = '';
                if (data.message.content.startsWith('Replying to ')) {
                    const endOfQuote = data.message.content.indexOf('"\n');
                    if (endOfQuote > -1) {
                        const quote = data.message.content.substring(0, endOfQuote + 1);
                        const actualMessage = data.message.content.substring(endOfQuote + 2);
                        quoteHtml = `<div class="quoted-message">${quote}</div>`;
                        data.message.content = actualMessage;
                    }
                }
                
                messageDiv.innerHTML = `
                    ${quoteHtml}
                    <div class="message-bubble">
                        <div class="message-content">${data.message.content}</div>
                        <div class="message-meta">
                            <small class="text-muted">${new Date(data.message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                    </div>
                `;
                
                // Add context menu for reply functionality
                messageDiv.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    
                    // Remove any existing context menus
                    const existingMenu = document.querySelector('.message-context-menu');
                    if (existingMenu) {
                        existingMenu.remove();
                    }
                    
                    // Create context menu
                    const contextMenu = document.createElement('div');
                    contextMenu.className = 'message-context-menu';
                    contextMenu.style.position = 'absolute';
                    contextMenu.style.left = `${e.pageX}px`;
                    contextMenu.style.top = `${e.pageY}px`;
                    
                    const replyButton = document.createElement('button');
                    replyButton.className = 'btn btn-sm btn-light';
                    replyButton.innerText = 'Reply';
                    replyButton.onclick = function() {
                        const contentInput = document.getElementById('message-input');
                        if (contentInput) {
                            const replyContent = `Replying to ${data.message.sender.username}: "${data.message.content}"\n`;
                            contentInput.value = replyContent;
                            contentInput.focus();
                            contextMenu.remove();
                        }
                    };
                    
                    contextMenu.appendChild(replyButton);
                    document.body.appendChild(contextMenu);
                    
                    // Close menu when clicking elsewhere
                    document.addEventListener('click', function closeMenu() {
                        contextMenu.remove();
                        document.removeEventListener('click', closeMenu);
                    });
                });
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                contentInput.value = '';
            } else {
                alert('Error sending message: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error sending direct message:', error);
            const tempMsg = chatMessages.querySelector(`[data-message-id="${tempMessageId}"]`);
            if (tempMsg) {
                const messageContent = tempMsg.querySelector('.message-content');
                const messageMeta = tempMsg.querySelector('.message-meta');
                
                if (messageContent && messageMeta) {
                    messageMeta.innerHTML = '<small class="text-danger">Failed to send. Tap to retry.</small>';
                    tempMsg.style.opacity = '0.7';
                    tempMsg.style.cursor = 'pointer';
                    tempMsg.addEventListener('click', function() {
                        chatMessages.removeChild(tempMsg);
                        contentInput.value = content;
                        contentInput.focus();
                    });
                }
            }
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }
        });
    });
}

// Function to check for URL parameters or preload data
function checkUrlForMessageParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipientId = urlParams.get('recipient_id');
    const recipientName = urlParams.get('recipient_name');
    if (recipientId) {
        loadDirectMessages(recipientId, recipientName);
        return true;
    }
    return false;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check for URL parameters or preload data
    const loaded = checkUrlForMessageParams();
    if (!loaded) {
        const preMessageForm = document.getElementById('message-form');
        if (preMessageForm) {
            const preRecipientId = preMessageForm.querySelector('input[name="recipient_id"]');
            if (preRecipientId && preRecipientId.value) {
                loadDirectMessages(preRecipientId.value, '');
            }
        }
    }
    
    // Update the HTML structure if needed
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
        const appContainer = document.querySelector('.container') || document.body;
        const newChatContainer = document.createElement('div');
        newChatContainer.id = 'chat-container';
        newChatContainer.innerHTML = `
            <div id="conversation-header"></div>
            <div id="chat-messages"></div>
            <div id="message-input-container"></div>
        `;
        appContainer.appendChild(newChatContainer);
    }
});