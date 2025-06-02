// Function to get user's timezone offset and name
function getUserTimezone() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset <= 0 ? '+' : '-';
  
  return {
    name: timezone,
    offset: `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`
  };
}

// Function to create and show the UTC message
function showUTCMessage() {
  // Remove existing message if any
  const existingMessage = document.querySelector('.utc-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const userTz = getUserTimezone();
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = 'utc-message';
  
  // Calculate example times
  const exampleUTC = '12:00';
  const utcDate = new Date(`2024-01-01T${exampleUTC}:00Z`);
  const localTime = utcDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: userTz.name 
  });
  
  messageDiv.innerHTML = `
    <div class="utc-message-content">
      <span class="utc-icon">⏰</span>
      <div class="utc-text">
        <strong>Time Zone Notice:</strong> Please enter time in UTC format.
        <br>
        <span class="utc-example">
          Example: ${exampleUTC} UTC = ${localTime} ${userTz.name.split('/').pop().replace('_', ' ')}
        </span>
        <br>
        <small>Your timezone: ${userTz.name} (${userTz.offset})</small>
      </div>
      <span class="utc-close" onclick="hideUTCMessage()">×</span>
    </div>
  `;
  
  // Add styles
  messageDiv.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 1000;
    margin-top: 5px;
    animation: slideDown 0.3s ease-out;
  `;
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#utc-animation-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'utc-animation-styles';
    styleSheet.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .utc-message-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      
      .utc-icon {
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .utc-text {
        flex: 1;
      }
      
      .utc-example {
        color: #ffeb3b;
        font-weight: 500;
      }
      
      .utc-close {
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        padding: 0 5px;
        border-radius: 3px;
        transition: background-color 0.2s;
        flex-shrink: 0;
      }
      
      .utc-close:hover {
        background-color: rgba(255,255,255,0.2);
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  // Insert message after the date-time input
  const dateTimeField = document.getElementById('date_time');
  const formGroup = dateTimeField.closest('.form-group');
  formGroup.style.position = 'relative';
  formGroup.appendChild(messageDiv);
  
  // Auto-hide after 8 seconds
  setTimeout(() => {
    hideUTCMessage();
  }, 8000);
}

// Function to hide the UTC message
function hideUTCMessage() {
  const message = document.querySelector('.utc-message');
  if (message) {
    message.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => {
      message.remove();
    }, 300);
  }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const dateTimeInput = document.getElementById('date_time');
  
  if (dateTimeInput) {
    // Show message on focus
    dateTimeInput.addEventListener('focus', showUTCMessage);
    
    // Optional: Show message on click as well
    dateTimeInput.addEventListener('click', function(e) {
      if (!document.querySelector('.utc-message')) {
        showUTCMessage();
      }
    });
  }
});

// Export functions for potential external use
window.showUTCMessage = showUTCMessage;
window.hideUTCMessage = hideUTCMessage;