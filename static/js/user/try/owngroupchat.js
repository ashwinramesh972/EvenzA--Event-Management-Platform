document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('message-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const eventId = form.getAttribute('data-event-id');
            const content = form.querySelector('input[name="content"]').value;

            fetch('/message/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({
                    event_id: eventId,
                    content: content,
                    message_type: 'group',
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const messagesList = document.querySelector('.messages-list');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message-item sent';
                    messageDiv.innerHTML = `
                        <div class="message-sender">${data.message.sender}</div>
                        <div class="message-content">${data.message.content}</div>
                        <div class="message-time">${new Date(data.message.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                    `;
                    messagesList.appendChild(messageDiv);
                    form.reset();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to send message.');
            });
        });
    }
});