// Newsletter Subscription Handler
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterMessage = document.getElementById('newsletterMessage');

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show message function
    function showMessage(message, type = 'success') {
        newsletterMessage.innerHTML = message;
        newsletterMessage.className = `newsletter-message ${type}`;
        newsletterMessage.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            newsletterMessage.style.display = 'none';
        }, 5000);
    }

    // Form submission handler
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = newsletterEmail.value.trim();
        
        // Validate email
        if (!email) {
            showMessage('Please enter your email address.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        const submitButton = newsletterForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';
        submitButton.disabled = true;
        
        // Simulate subscription process (replace with actual API call)
        setTimeout(() => {
            // Success message
            showMessage(`Thanks for subscribing! You'll receive updates at ${email}`, 'success');
            
            // Reset form
            newsletterEmail.value = '';
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Optional: Store email in localStorage for analytics
            // localStorage.setItem('newsletter_subscribed', 'true');
            
        }, 1500); // Simulate network delay
    });

    // Real-time email validation
    newsletterEmail.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
        }
    });

    // Clear message when user starts typing
    newsletterEmail.addEventListener('input', function() {
        if (newsletterMessage.style.display === 'block') {
            newsletterMessage.style.display = 'none';
        }
    });
});

// CSS styles for the message (add this to your CSS file)
const messageStyles = `
.newsletter-message {
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
    display: none;
    transition: all 0.3s ease;
}

.newsletter-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.newsletter-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.newsletter-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
`;

// Inject styles if they don't exist
if (!document.getElementById('newsletter-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'newsletter-styles';
    styleElement.textContent = messageStyles;
    document.head.appendChild(styleElement);
}