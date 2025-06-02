// Fixed message.js
$(document).ready(function() {
    $('#event-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = new FormData(this);
        
        $.ajax({
            url: window.location.href, // Use current URL since form has no action attribute
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Show success popup
                    showPopup('success', response.message);
                    
                    // Optional: Redirect after a delay
                    setTimeout(function() {
                        if (response.redirect_url) {
                            window.location.href = response.redirect_url;
                        }
                    }, 5000); // 3 second delay
                    
                } else {
                    // Show error popup
                    showPopup('error', response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                showPopup('error', 'An error occurred. Please try again.');
            }
        });
    });
});

function showPopup(type, message) {
    // Remove any existing popup first
    $('#popup-modal').remove();
    
    // Create popup HTML
    var popupHtml = `
        <div id="popup-modal" class="popup-overlay">
            <div class="popup-content ${type}">
                <h3>${type === 'success' ? 'Success!' : 'Error'}</h3>
                <p>${message}</p>
                <button onclick="closePopup()">OK</button>
            </div>
        </div>
    `;
    
    $('body').append(popupHtml);
    $('#popup-modal').fadeIn();
}

function closePopup() {
    $('#popup-modal').fadeOut(function() {
        $(this).remove();
    });
}