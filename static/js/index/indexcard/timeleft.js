document.addEventListener('DOMContentLoaded', () => {
  // Get all countdown timers
  const countdownTimers = document.querySelectorAll('.countdown-timer');
  
  // Update all timers initially and then every second
  updateAllTimers();
  setInterval(updateAllTimers, 1000);
  
  function updateAllTimers() {
    countdownTimers.forEach(timer => {
      const eventDateTime = new Date(timer.dataset.datetime).getTime();
      
      // Add 5 hours and 30 minutes (5.5 hours * 60 minutes * 60 seconds * 1000 milliseconds)
      const extraTime = 5.5 * 60 * 60 * 1000; // 19,800,000 milliseconds
      const adjustedEventDateTime = eventDateTime + extraTime;
      
      const now = new Date().getTime();
      const timeLeft = adjustedEventDateTime - now;
      
      // Check if the event is in the future
      if (timeLeft > 0) {
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        // Format the timer display
        let timeDisplay = '';
        
        if (days > 0) {
          timeDisplay += `${days}d `;
        }
        
        if (days > 0 || hours > 0) {
          timeDisplay += `${hours}h `;
        }
        
        if (days > 0 || hours > 0 || minutes > 0) {
          timeDisplay += `${minutes}m `;
        }
        
        // Always show seconds
        timeDisplay += `${seconds}s`;
        
        // Update timer text
        timer.textContent = timeDisplay.trim();
        
        // Add visual indicators based on urgency
        timer.classList.remove('soon', 'very-soon', 'imminent');
        
        if (timeLeft < 3600000) { // Less than 1 hour
          timer.classList.add('imminent');
        } else if (timeLeft < 86400000) { // Less than 1 day
          timer.classList.add('very-soon');
        } else if (timeLeft < 259200000) { // Less than 3 days
          timer.classList.add('soon');
        }
      } else {
        // Event has passed
        timer.textContent = 'Event started';
        timer.classList.add('started');
        
        // Find the parent card and add a class to it
        const card = timer.closest('.card');
        if (card) {
          card.classList.add('event-started');
        }
      }
    });
  }
});