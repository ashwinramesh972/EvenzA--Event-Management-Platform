document.addEventListener('DOMContentLoaded', () => {
    // Load messages initially
    loadMessages();

    // Poll for new messages every 5 seconds
    const pollingInterval = setInterval(loadMessages, 5000);

    // Add event listeners for sending messages
    const sendButton = document.getElementById('send-message');
    const messageInput = document.getElementById('message-input');
    
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Check message limit on page load
        updateMessageLimit();
    } else {
        console.error('Required elements (send-message or message-input) not found.');
    }

    // Stop polling when the page is unloaded
    window.addEventListener('beforeunload', () => {
        clearInterval(pollingInterval);
    });
});

function loadMessages() {
    fetch(`/message/get_group_messages/${eventId}/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
                data.messages.forEach(message => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${message.sender.id === userId ? 'sent' : 'received'}`;
                    messageDiv.innerHTML = `
                        <div class="message-sender">${message.sender.username}</div>
                        <div class="message-content">${message.content}</div>
                        <div class="message-timestamp">${new Date(message.sent_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                    `;
                    chatMessages.appendChild(messageDiv);
                });
                // Scroll to the bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                console.error('Chat messages container not found.');
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'Failed to load messages.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: 'Error',
            text: 'An error occurred while loading messages.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
        console.error('Error:', error);
    });
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    const content = input.value.trim();

    if (!content) {
        Swal.fire({
            title: 'Error',
            text: 'Message content is required.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
        return;
    }

    // Disable input and button while sending
    input.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sending...';

    fetch(`/message/send_group/${eventId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
    })
    .then(response => response.json())
    .then(data => {
        input.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = 'Send';

        if (data.success) {
            input.value = '';
            loadMessages();
            // Update message limit after sending
            updateMessageLimit();
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'Failed to send message.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            if (data.error.includes('limit')) {
                const messageLimitDiv = document.getElementById('message-limit');
                if (messageLimitDiv) {
                    messageLimitDiv.innerHTML = `
                        <p class="text-danger">${data.error} <a href="/user-upgrade/${userId}" class="btn btn-primary btn-sm">Upgrade Now</a></p>
                    `;
                    input.disabled = true;
                    sendButton.disabled = true;
                }
            }
        }
    })
    .catch(error => {
        input.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = 'Send';
        Swal.fire({
            title: 'Error',
            text: 'An error occurred while sending the message.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
        console.error('Error:', error);
    });
}

function updateMessageLimit() {
    fetch(`/message/check_limit/${eventId}/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        const messageLimitDiv = document.getElementById('message-limit');
        const input = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message');

        if (!messageLimitDiv || !input || !sendButton) {
            console.error('Required elements for message limit not found.');
            return;
        }

        if (!data.success) {
            messageLimitDiv.innerHTML = `
                <p class="text-danger">${data.error} <a href="/user-upgrade/${userId}" class="btn btn-primary btn-sm">Upgrade Now</a></p>
            `;
            input.disabled = true;
            sendButton.disabled = true;
        } else {
            messageLimitDiv.innerHTML = '';
            input.disabled = false;
            sendButton.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error checking message limit:', error);
        Swal.fire({
            title: 'Error',
            text: 'An error occurred while checking the message limit.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
    });
}