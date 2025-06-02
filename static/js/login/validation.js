// Registration Form Validation Script
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const inputs = {
        firstName: document.querySelector('input[name="first_name"]'),
        lastName: document.querySelector('input[name="last_name"]'),
        username: document.querySelector('input[name="username"]'),
        email: document.querySelector('input[name="email"]'),
        password1: document.querySelector('input[name="password1"]'),
        password2: document.querySelector('input[name="password2"]'),
        profilePicture: document.querySelector('input[name="profile_picture"]')
    };

    // Validation patterns
    const patterns = {
        name: /^[A-Za-z\s]+$/, // Only letters and spaces
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    };

    // Error messages
    const errorMessages = {
        firstName: 'First name must contain only letters',
        lastName: 'Last name must contain only letters',
        username: 'Username is required',
        email: 'Please enter a valid email address',
        password1: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        password2: 'Passwords do not match',
        required: 'This field is required'
    };

    // Create error display function
    function showError(input, message) {
        // Remove existing error
        const existingError = input.parentNode.querySelector('.error-text');
        if (existingError) {
            existingError.remove();
        }

        // Add error styling
        input.classList.add('error');
        
        // Create and add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-text';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        
        input.parentNode.appendChild(errorDiv);
    }

    // Clear error function
    function clearError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentNode.querySelector('.error-text');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Validation functions
    function validateRequired(input, fieldName) {
        if (!input.value.trim()) {
            showError(input, errorMessages.required);
            return false;
        }
        clearError(input);
        return true;
    }

    function validateName(input, fieldName) {
        if (!validateRequired(input, fieldName)) return false;
        
        if (!patterns.name.test(input.value.trim())) {
            showError(input, errorMessages[fieldName]);
            return false;
        }
        clearError(input);
        return true;
    }

    function validateEmail(input) {
        if (!validateRequired(input, 'email')) return false;
        
        if (!patterns.email.test(input.value.trim())) {
            showError(input, errorMessages.email);
            return false;
        }
        clearError(input);
        return true;
    }

    function validatePassword(input) {
        if (!validateRequired(input, 'password1')) return false;
        
        if (!patterns.password.test(input.value)) {
            showError(input, errorMessages.password1);
            return false;
        }
        clearError(input);
        return true;
    }

    function validatePasswordConfirm(input) {
        if (!validateRequired(input, 'password2')) return false;
        
        if (input.value !== inputs.password1.value) {
            showError(input, errorMessages.password2);
            return false;
        }
        clearError(input);
        return true;
    }

    // Real-time validation on blur
    inputs.firstName.addEventListener('blur', () => validateName(inputs.firstName, 'firstName'));
    inputs.lastName.addEventListener('blur', () => validateName(inputs.lastName, 'lastName'));
    inputs.username.addEventListener('blur', () => validateRequired(inputs.username, 'username'));
    inputs.email.addEventListener('blur', () => validateEmail(inputs.email));
    inputs.password1.addEventListener('blur', () => validatePassword(inputs.password1));
    inputs.password2.addEventListener('blur', () => validatePasswordConfirm(inputs.password2));

    // Clear errors on focus
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('focus', () => clearError(input));
        }
    });

    // Form submission validation
    form.addEventListener('submit', function(e) {
        let isValid = true;

        // Validate all fields
        if (!validateName(inputs.firstName, 'firstName')) isValid = false;
        if (!validateName(inputs.lastName, 'lastName')) isValid = false;
        if (!validateRequired(inputs.username, 'username')) isValid = false;
        if (!validateEmail(inputs.email)) isValid = false;
        if (!validatePassword(inputs.password1)) isValid = false;
        if (!validatePasswordConfirm(inputs.password2)) isValid = false;

        // Prevent form submission if validation fails
        if (!isValid) {
            e.preventDefault();
            
            // Focus on first error field
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.focus();
            }
        }
    });

    // Password strength indicator (optional enhancement)
    function updatePasswordStrength() {
        const password = inputs.password1.value;
        const strengthDiv = document.querySelector('.password-strength') || createStrengthIndicator();
        
        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength++;
        else feedback.push('at least 8 characters');

        if (/[a-z]/.test(password)) strength++;
        else feedback.push('1 lowercase letter');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('1 uppercase letter');

        if (/\d/.test(password)) strength++;
        else feedback.push('1 number');

        if (/[@$!%*?&]/.test(password)) strength++;
        else feedback.push('1 special character');

        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#2ecc71'];

        strengthDiv.textContent = `Password Strength: ${strengthLevels[strength - 1] || 'Very Weak'}`;
        strengthDiv.style.color = strengthColors[strength - 1] || strengthColors[0];

        if (feedback.length > 0 && password.length > 0) {
            strengthDiv.textContent += ` (Need: ${feedback.join(', ')})`;
        }
    }

    function createStrengthIndicator() {
        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';
        strengthDiv.style.fontSize = '12px';
        strengthDiv.style.marginTop = '5px';
        inputs.password1.parentNode.appendChild(strengthDiv);
        return strengthDiv;
    }

    // Add password strength indicator
    inputs.password1.addEventListener('input', updatePasswordStrength);
});