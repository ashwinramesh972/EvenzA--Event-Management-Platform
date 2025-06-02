// File upload feedback
document.getElementById('proof').addEventListener('change', function(e) {
    const label = document.querySelector('.file-upload-label span');
    if (e.target.files.length > 0) {
        label.textContent = `Selected: ${e.target.files[0].name}`;
        label.parentElement.style.color = '#27ae60';
    } else {
        label.textContent = 'Click to upload supporting documents';
        label.parentElement.style.color = '#667eea';
    }
});

// Form submission with AJAX
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    
    const btn = document.querySelector('.submit-btn');
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    btn.innerHTML = '⏳ Submitting...';
    btn.style.background = 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
    btn.disabled = true;
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Get CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfToken) {
        formData.append('csrfmiddlewaretoken', csrfToken.value);
    }
    
    // Submit form via AJAX
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        }
    })
    .then(response => {
        if (response.headers.get('content-type')?.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                // If response is HTML, it likely contains error messages
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const errorElement = doc.querySelector('[data-error]');
                
                if (errorElement) {
                    const error = errorElement.getAttribute('data-error');
                    const message = errorElement.getAttribute('data-message') || 'An error occurred';
                    throw new Error(JSON.stringify({ error, message }));
                }
                
                throw new Error('Unexpected response format');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showSuccessMessage();
            form.reset();
            resetFileUpload();
        }
    })
    .catch(error => {
        let errorData;
        try {
            errorData = JSON.parse(error.message);
        } catch {
            errorData = { error: 'network_error', message: 'Network error occurred. Please try again.' };
        }
        
        showErrorMessage(errorData.error, errorData.message);
    })
    .finally(() => {
        // Reset button state
        btn.innerHTML = 'Submit Appeal';
        btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        btn.disabled = false;
    });
});

// Input animations
const inputs = document.querySelectorAll('input, textarea');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateX(5px)';
        this.parentElement.style.transition = 'transform 0.3s ease';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateX(0)';
    });
});

// Helper functions
function clearErrorMessages() {
    const existingErrors = document.querySelectorAll('.error-message, .success-message');
    existingErrors.forEach(error => error.remove());
    
    // Remove error styling from inputs
    inputs.forEach(input => {
        input.style.borderColor = '#e0e6ed';
        input.parentElement.classList.remove('error');
    });
}

function showErrorMessage(errorType, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        margin: 20px 0;
        box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    `;
    
    errorDiv.innerHTML = `
        <span style="font-size: 1.2rem;">❌</span>
        <div>
            <strong>Error:</strong> ${message}
        </div>
    `;
    
    // Highlight specific fields based on error type
    if (errorType === 'username__not_exists') {
        highlightErrorField('username');
    } else if (errorType === 'email_not_exists') {
        highlightErrorField('email');
    }
    
    // Insert error message after the form
    const form = document.querySelector('form');
    form.insertAdjacentElement('afterend', errorDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => errorDiv.remove(), 300);
    }, 8000);
}

function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
        padding: 20px;
        border-radius: 12px;
        margin: 20px 0;
        box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3);
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideIn 0.3s ease-out;
    `;
    
    successDiv.innerHTML = `
        <span style="font-size: 1.5rem;">✅</span>
        <div>
            <strong style="font-size: 1.1rem;">Appeal Submitted Successfully!</strong><br>
            <span style="opacity: 0.9;">Your appeal has been received and will be reviewed within 5-7 business days. You will be notified via email about the decision.</span>
        </div>
    `;
    
    // Insert success message after the form
    const form = document.querySelector('form');
    form.insertAdjacentElement('afterend', successDiv);
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function highlightErrorField(fieldName) {
    const field = document.getElementById(fieldName);
    if (field) {
        field.style.borderColor = '#ff6b6b';
        field.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
        field.parentElement.classList.add('error');
        
        // Focus on the error field
        field.focus();
        
        // Add shake animation
        field.style.animation = 'shake 0.5s ease-in-out';
    }
}

function resetFileUpload() {
    const label = document.querySelector('.file-upload-label span');
    label.textContent = 'Click to upload supporting documents';
    label.parentElement.style.color = '#667eea';
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { 
            opacity: 0; 
            transform: translateY(-20px); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0); 
        }
    }
    
    @keyframes slideOut {
        from { 
            opacity: 1; 
            transform: translateY(0); 
        }
        to { 
            opacity: 0; 
            transform: translateY(-20px); 
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .form-group.error input,
    .form-group.error textarea {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);