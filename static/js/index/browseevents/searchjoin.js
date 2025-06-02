document.addEventListener('DOMContentLoaded', () => {
    // Add styles for join button and notification (copied from eventjoin.js for consistency)
    const style = document.createElement('style');
    style.innerHTML = `
        .join-button[disabled], 
        .join-button.joined {
            background: linear-gradient(135deg, #10B981, #059669) !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
            position: relative;
            overflow: hidden;
            border: none !important;
            font-weight: 600 !important;
        }
        
        .join-button[disabled]:after,
        .join-button.joined:after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(30deg);
            animation: shimmer 3s infinite linear;
        }
        
        @keyframes shimmer {
            from {
                transform: translateX(-100%) rotate(30deg);
            }
            to {
                transform: translateX(100%) rotate(30deg);
            }
        }
        
        .joining-spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            margin-right: 8px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

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
            background: linear-gradient(90deg, #10B981, #059669);
        }
        
        .notification-toast.error {
            background: linear-gradient(90deg, #E74C3C, #C0392B);
        }
    `;
    document.head.appendChild(style);

    // Event delegation for join buttons
    const eventsGrid = document.querySelector('.events-grid') || document;
    eventsGrid.addEventListener('click', async (e) => {
        const button = e.target.closest('.join-button');
        if (!button || button.disabled) return;

        const userId = button.getAttribute('data-user-id');
        const eventId = button.closest('.card')?.getAttribute('data-event-id') || 
                       button.getAttribute('data-event-id');
        
        if (!eventId) {
            showNotification('Event information is missing. Please refresh the page.', 'error');
            return;
        }

        // Check if the user is logged in
        if (!isUserLoggedIn()) {
            showNotification('Please log in to join events', 'error');
            window.location.href = '/user-login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        // Check if already joined
        if (button.innerText === 'Joined' || button.disabled) {
            showNotification('You have already joined this event!');
            return;
        }

        // Disable button and show loading state
        button.disabled = true;
        const originalText = button.innerText;
        const spinner = document.createElement('span');
        spinner.className = 'joining-spinner';
        button.innerHTML = '';
        button.appendChild(spinner);
        button.appendChild(document.createTextNode('Joining...'));

        const card = button.closest('.card');

        // Determine if it's a paid event
        const isPaid = originalText.includes('$');
        if (isPaid) {
            window.location.href = `/payment/purchase-ticket/${eventId}/${userId}/`;
            return;
        }

        try {
            const response = await fetch(`/event/join/${eventId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ event_code: '' })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                button.classList.add('joined');
                button.innerHTML = '';
                button.innerText = 'Joined';
                
                updateParticipantCount(card, data.participants_count);
                showNotification(data.message || 'Success! You have joined the event.');
            } else {
                button.disabled = false;
                button.innerHTML = '';
                button.innerText = originalText;
                showNotification(data.error || 'Failed to join the event.', 'error');
            }
        } catch (error) {
            button.disabled = false;
            button.innerHTML = '';
            button.innerText = originalText;
            showNotification('An error occurred while joining the event. Please try again.', 'error');
            console.error('Error:', error);
        }
    });

    function updateParticipantCount(card, newCount) {
        if (!card) return;
        const attendeesElements = card.querySelectorAll('.event-details .value');
        attendeesElements.forEach(element => {
            if (element.textContent.includes('attending')) {
                if (newCount !== undefined) {
                    element.textContent = `${newCount} people attending`;
                }
            }
        });
    }

    function isUserLoggedIn() {
        const loginLink = document.querySelector('.nav-link[href="/user-login"]');
        return !loginLink;
    }

    function getCsrfToken() {
        const token = document.querySelector('meta[name="csrf-token"]');
        if (token) return token.getAttribute('content');
        
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
            
        return cookieValue || '';
    }

    function showNotification(message, type = 'success') {
        let notification = document.querySelector('.notification-toast');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification-toast';
            document.body.appendChild(notification);
        }
        
        notification.classList.remove('show', 'success', 'error');
        clearTimeout(notification.dataset.timeout);
        
        notification.innerText = message;
        notification.classList.add('show', type);
        
        const timeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.remove('success', 'error');
            }, 500);
        }, 3000);
        
        notification.dataset.timeout = timeout;
    }
});