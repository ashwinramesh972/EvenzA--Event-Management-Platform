// SweetAlert Handler for Registration Errors
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's an error message from Django
    const errorMessageElement = document.querySelector('.error-message');
    
    if (errorMessageElement) {
        const errorText = errorMessageElement.textContent.trim();
        
        // Hide the default error message
        errorMessageElement.style.display = 'none';
        
        // Handle different types of errors based on the error content
        handleRegistrationError(errorText);
    }

    // Handle form submission with loading state
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Check if form passes basic validation before showing loader
            if (isFormValid()) {
                showLoadingAlert();
            }
        });
    }

    function handleRegistrationError(errorText) {
        if (errorText.includes('email already exists') || errorText.includes('Your email already exists')) {
            showEmailExistsAlert();
        } 
        else if (errorText.includes('Username exists') || errorText.includes('username')) {
            showUsernameExistsAlert();
        }
        else if (errorText.includes('Passwords do not match') || errorText.includes('password')) {
            showPasswordMismatchAlert();
        }
        else if (errorText.includes('All required fields') || errorText.includes('missing')) {
            showMissingFieldsAlert();
        }
        else if (errorText.includes('error occurred') || errorText.includes('server')) {
            showServerErrorAlert();
        }
        else {
            // Generic error handler
            showGenericErrorAlert(errorText);
        }
    }

    function showEmailExistsAlert() {
        Swal.fire({
            icon: 'warning',
            title: 'Email Already Exists',
            text: 'Your email already exists, please log in.',
            confirmButtonText: 'Go to Login',
            confirmButtonColor: '#4f46e5',
            allowOutsideClick: false,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-button'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/user-login';
            }
        });
    }

    function showUsernameExistsAlert() {
        Swal.fire({
            icon: 'warning',
            title: 'Username Taken',
            text: 'Username exists, please choose another.',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-button'
            }
        }).then(() => {
            clearAndFocusField('username');
        });
    }

    function showPasswordMismatchAlert() {
        Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'Passwords do not match.',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-button'
            }
        }).then(() => {
            clearPasswordFields();
        });
    }

    function showMissingFieldsAlert() {
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'All required fields must be filled.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-button'
            }
        }).then(() => {
            focusFirstEmptyField();
        });
    }

    function showServerErrorAlert() {
        Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'An unexpected error occurred. Please try again.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-button'
            }
        });
    }

    function showGenericErrorAlert(errorText) {
        Swal.fire({
            icon: 'error',
            title: 'Registration Error',
            text: errorText,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-button'
            }
        });
    }

    function showLoadingAlert() {
        Swal.fire({
            title: 'Creating Account...',
            text: 'Please wait while we set up your account.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content'
            },
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    function clearAndFocusField(fieldName) {
        const field = document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            field.value = '';
            field.focus();
            addShakeAnimation(field.parentNode);
        }
    }

    function clearPasswordFields() {
        const password1 = document.querySelector('input[name="password1"]');
        const password2 = document.querySelector('input[name="password2"]');
        
        if (password1 && password2) {
            password1.value = '';
            password2.value = '';
            password1.focus();
            
            addShakeAnimation(password1.parentNode);
            addShakeAnimation(password2.parentNode);
        }
    }

    function focusFirstEmptyField() {
        const requiredFields = document.querySelectorAll('input[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                addShakeAnimation(field.parentNode);
                break;
            }
        }
    }

    function addShakeAnimation(element) {
        if (element) {
            element.style.animation = 'shake 0.6s ease-in-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 600);
        }
    }

    function isFormValid() {
        const requiredFields = document.querySelectorAll('input[required]');
        let isValid = true;

        // Check if all required fields are filled
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                isValid = false;
                break;
            }
        }

        // Check if passwords match
        const password1 = document.querySelector('input[name="password1"]').value;
        const password2 = document.querySelector('input[name="password2"]').value;
        
        if (password1 !== password2) {
            isValid = false;
        }

        return isValid;
    }

    // Add custom styles for SweetAlert
    addCustomStyles();

    function addCustomStyles() {
        if (!document.querySelector('#swal-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'swal-custom-styles';
            style.textContent = `
                .swal-custom-popup {
                    border-radius: 20px !important;
                    font-family: 'Poppins', sans-serif !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                }
                
                .swal-custom-title {
                    font-weight: 600 !important;
                    font-size: 1.5rem !important;
                    color: #1f2937 !important;
                }
                
                .swal-custom-content {
                    font-weight: 400 !important;
                    color: #6b7280 !important;
                    font-size: 1rem !important;
                }
                
                .swal-custom-button {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
                    border: none !important;
                    border-radius: 12px !important;
                    font-weight: 500 !important;
                    padding: 12px 28px !important;
                    font-size: 1rem !important;
                    transition: all 0.3s ease !important;
                    box-shadow: 0 4px 15px 0 rgba(79, 70, 229, 0.4) !important;
                }
                
                .swal-custom-button:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 25px 0 rgba(79, 70, 229, 0.6) !important;
                }
                
                .swal2-loading {
                    border-color: #4f46e5 transparent #4f46e5 transparent !important;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                    20%, 40%, 60%, 80% { transform: translateX(8px); }
                }
                
                .swal2-icon.swal2-warning {
                    border-color: #f59e0b !important;
                    color: #f59e0b !important;
                }
                
                .swal2-icon.swal2-error {
                    border-color: #ef4444 !important;
                    color: #ef4444 !important;
                }
                
                .swal2-popup {
                    padding: 2rem !important;
                }
                
                .swal2-title {
                    margin-bottom: 1rem !important;
                }
                
                .swal2-content {
                    margin-bottom: 1.5rem !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
});