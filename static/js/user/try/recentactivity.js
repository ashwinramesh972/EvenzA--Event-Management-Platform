// Function to fetch and update recent activities
async function fetchRecentActivities() {
  // Make sure userId is defined - you'll need to set this somewhere in your HTML
  if (typeof userId === 'undefined') {
    console.error('userId is not defined');
    document.getElementById('activity-list').innerHTML = '<p>Error: User ID not found. Please refresh the page.</p>';
    return;
  }

  try {
    // Fixed URL to match your Django URL pattern
    const response = await fetch(`/event/user/${userId}/activities/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const activities = await response.json();

    // Check if activities is an array
    if (!Array.isArray(activities)) {
      throw new Error('Expected array of activities');
    }

    // Update the activity list
    const container = document.getElementById('activity-list');
    
    if (!container) {
      console.error('Activity list container not found');
      return;
    }

    if (activities.length === 0) {
      container.innerHTML = '<p>No recent activities found.</p>';
      return;
    }

    container.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon icon-${activity.type}">
          <i class="fas ${getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${escapeHtml(activity.description)}</div>
          <div class="activity-time">${formatTimestamp(activity.timestamp)}</div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    const container = document.getElementById('activity-list');
    if (container) {
      container.innerHTML = '<p>Error loading activities. Please try again later.</p>';
    }
  }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to map activity types to Font Awesome icons
function getActivityIcon(activityType) {
  const iconMap = {
    'event_created': 'fa-calendar-plus',
    'login': 'fa-sign-in-alt',
    'logout': 'fa-sign-out-alt',
    'registration': 'fa-user-plus',
    'comment': 'fa-comment',
    'payment': 'fa-credit-card'
  };
  return iconMap[activityType] || 'fa-info-circle';
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const time = date.toLocaleTimeString('en-US', timeOptions);
    
    if (isToday) {
      return `Today, ${time}`;
    } else {
      const dateOptions = { month: 'short', day: 'numeric' };
      const dateStr = date.toLocaleDateString('en-US', dateOptions);
      return `${dateStr}, ${time}`;
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown time';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initial data fetch
  fetchRecentActivities();
  
  // Poll for new activities every 10 seconds
  setInterval(fetchRecentActivities, 10000);
});

// Make sure to define userId somewhere in your HTML template
// Example: const userId = {{ user.id|default:'null' }};