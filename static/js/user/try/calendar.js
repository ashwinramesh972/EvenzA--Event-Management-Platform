document.addEventListener('DOMContentLoaded', function() {
  // Ensure userId is defined
  if (typeof userId === 'undefined') {
    console.error("User ID is not defined. Please ensure userId is set in the HTML.");
    return;
  }
  
  // Calendar Variables
  let currentDate = new Date();
  let eventDetails = [];
  let tooltipList = [];
  
  // Function to parse event date with extensive format support
  function parseEventDate(dateInput) {
    if (!dateInput) return null;
    
    // If already a Date object
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    
    // If it's a string
    if (typeof dateInput === 'string') {
      // If it's already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      
      // Try various parsing approaches
      try {
        // Try direct Date parsing
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
        
        // Try Django format (DD/MM/YYYY or MM/DD/YYYY)
        if (dateInput.includes('/')) {
          const parts = dateInput.split('/');
          if (parts.length === 3) {
            // Try MM/DD/YYYY
            let parsedDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
            
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
            
            // Try DD/MM/YYYY
            parsedDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
          }
        }
        
        // Try date-time format (extract date part)
        if (dateInput.includes(' ')) {
          const datePart = dateInput.split(' ')[0];
          if (datePart.includes('-') || datePart.includes('/')) {
            const result = parseEventDate(datePart);
            if (result) {
              return result;
            }
          }
        }
        
        // Try Month Day, Year format (e.g., "May 15, 2025")
        const monthDayYearMatch = dateInput.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
        if (monthDayYearMatch) {
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                            'july', 'august', 'september', 'october', 'november', 'december'];
          const month = monthNames.indexOf(monthDayYearMatch[1].toLowerCase());
          
          if (month !== -1) {
            const day = parseInt(monthDayYearMatch[2]);
            const year = parseInt(monthDayYearMatch[3]);
            
            const parsedDate = new Date(year, month, day);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
          }
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    return null;
  }
  
  // Function to fetch and process event data
  async function fetchEventDetails() {
    try {
      // Modified API endpoint path
      const apiUrl = `/event/user/${userId}/events/`;
      
      try {
        console.log(`Attempting to fetch events from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.warn(`API returned status ${response.status}. Trying fallbacks...`);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response data:", data);
        
        // Process API response
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Received ${data.length} events from API`);
          eventDetails = processEventData(data);
          console.log(`Processed ${eventDetails.length} events from API`);
          return;
        } else {
          console.warn('API returned empty or invalid data');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
      }
      
      // If API fails, try to extract from HTML (fallback method 1)
      console.log('Attempting to extract events from DOM');
      const extractedEvents = extractEventsFromDOM();
      if (extractedEvents.length > 0) {
        console.log(`Found ${extractedEvents.length} events in DOM`, extractedEvents);
        eventDetails = extractedEvents;
        return;
      }
      
      // Final fallback: Use fallbackEvents from global scope
      console.log('Using fallback events if available');
      eventDetails = (typeof fallbackEvents !== 'undefined' && Array.isArray(fallbackEvents))
        ? fallbackEvents.map(event => ({
            ...event,
            date: parseEventDate(event.date)
          }))
        : [];
      console.log("Fallback events:", eventDetails);
      
    } catch (error) {
      console.error('Calendar error:', error);
      eventDetails = [];
    } finally {
      console.log(`Final event count: ${eventDetails.length}`, eventDetails);
      renderCalendar();
    }
  }
  
  // Process API response data
  function processEventData(data) {
    return data.map(event => {
      // Try to get the date from various properties
      let eventDate = null;
      
      // Check all possible date fields
      const dateFields = ['date', 'event_date', 'start_date', 'date_time'];
      for (const field of dateFields) {
        if (event[field]) {
          eventDate = parseEventDate(event[field]);
          if (eventDate) {
            break;
          }
        }
      }
      
      // If no date found, use a default date (e.g., today) to avoid filtering out
      if (!eventDate) {
        console.warn(`Event "${event.title || 'Untitled'}" missing valid date, using default date`, event);
        eventDate = new Date().toISOString().split('T')[0]; // Default to today
      }
      
      // Determine event type with more robust checks
      let eventType = event.type;
      if (!eventType) {
        // Check for explicit indicators of joined events
        if (event.is_joined || event.participant_id === userId || (event.participants && event.participants.includes(userId))) {
          eventType = 'joined';
        } else if (event.creator_id === userId || event.created_by === userId) {
          eventType = 'created';
        } else {
          // Default to 'joined' if creator doesn't match userId
          eventType = 'joined';
        }
      }
      
      return {
        id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
        title: event.title || event.name || event.event_title || 'Untitled Event',
        date: eventDate,
        time: event.time || (event.date_time ? event.date_time.split(' ')[1] : ''),
        status: event.status || 'Active',
        type: eventType
      };
    }).filter(Boolean); // Remove null items
  }
  
  // Extract events from the DOM as fallback
  function extractEventsFromDOM() {
    const events = [];
    
    // Function to extract date from text content
    function extractDateFromText(text) {
      if (!text) return null;
      return parseEventDate(text);
    }
    
    // Try to get created events with broader selectors
    try {
      document.querySelectorAll('[class*="your-events"] .event-card, [class*="created"] .event-card').forEach(card => {
        const title = card.querySelector('.card-title, [class*="title"]')?.textContent.trim();
        const dateText = card.querySelector('.event-date span, .card-text, [class*="date"]')?.textContent.trim();
        const status = card.querySelector('.event-status, .badge, [class*="status"]')?.textContent.trim();
        
        if (title && dateText) {
          const date = extractDateFromText(dateText);
          if (date) {
            events.push({
              id: `created-${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              date: date,
              time: '',
              status: status || 'Active',
              type: 'created'
            });
          }
        }
      });
      
      // Try to get joined events with broader selectors
      document.querySelectorAll('[class*="joined"] .event-card, [class*="participating"] .event-card, [class*="attending"] .event-card').forEach(card => {
        const title = card.querySelector('.card-title, [class*="title"]')?.textContent.trim();
        const dateText = card.querySelector('.event-date span, .card-text, [class*="date"]')?.textContent.trim();
        const status = card.querySelector('.event-status, .badge, [class*="status"]')?.textContent.trim();
        
        if (title && dateText) {
          const date = extractDateFromText(dateText);
          if (date) {
            events.push({
              id: `joined-${Math.random().toString(36).substr(2, 9)}`,
              title: title,
              date: date,
              time: '',
              status: status || 'Active',
              type: 'joined'
            });
          }
        }
      });
    } catch (e) {
      console.error('Error extracting events from DOM:', e);
    }
    
    return events;
  }
  
  // Render the calendar
  function renderCalendar() {
    // First, dispose any existing tooltips
    if (tooltipList && tooltipList.length) {
      tooltipList.forEach(tooltip => {
        if (tooltip && typeof tooltip.dispose === 'function') {
          tooltip.dispose();
        }
      });
      tooltipList = [];
    }
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // Day of week (0-6) for first day of month
    
    // Today's date info
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Update calendar title
    document.getElementById('calendar-title').textContent = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Generate the calendar HTML
    let calendarHTML = '';
    let day = 1;
    let previousMonthDays = new Date(year, month, 0).getDate();
    let previousMonthStart = previousMonthDays - startDay + 1;
    
    // Build calendar rows
    for (let i = 0; i < 6; i++) {
      calendarHTML += '<tr>';
      
      // Build the 7 days in this week
      for (let j = 0; j < 7; j++) {
        let cellClass = 'calendar-day';
        let cellContent = '';
        let tooltipContent = '';
        let hasEvents = false;
        
        // Days from previous month
        if (i === 0 && j < startDay) {
          cellClass += ' other-month';
          cellContent = previousMonthStart++;
        }
        // Days from next month
        else if (day > daysInMonth) {
          cellClass += ' other-month';
          cellContent = day - daysInMonth;
          day++;
        }
        // Days from this month
        else {
          cellContent = day;
          
          // Check if this is today
          if (day === todayDate && month === todayMonth && year === todayYear) {
            cellClass += ' today';
          }
          
          // Check for events on this day
          const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          // Find events for this day
          const dayEvents = eventDetails.filter(event => event.date === currentDateStr);
          
          if (dayEvents.length > 0) {
            hasEvents = true;
            
            // Build tooltip HTML
            tooltipContent = dayEvents.map(event => 
              `<strong>${event.title}</strong><br>
              ${event.time ? event.time + ' - ' : ''}${event.status}<br>
              <em>${event.type === 'created' ? 'You created this event' : 'You joined this event'}</em>`
            ).join('<hr>');
            
            // Add appropriate class based on event types
            const createdEvents = dayEvents.filter(e => e.type === 'created');
            const joinedEvents = dayEvents.filter(e => e.type === 'joined');
            
            if (createdEvents.length > 0 && joinedEvents.length > 0) {
              cellClass += ' has-event-both';
            } else if (createdEvents.length > 0) {
              cellClass += ' has-event-created';
            } else if (joinedEvents.length > 0) {
              cellClass += ' has-event-joined';
            }
          }
          
          day++;
        }
        
        // Create cell content with tooltip if needed
        if (hasEvents) {
          cellContent = `<span class="event-date-tooltip" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" title="${tooltipContent}">${cellContent}</span>`;
        }
        
        calendarHTML += `<td class="${cellClass}">${cellContent}</td>`;
      }
      
      calendarHTML += '</tr>';
      
      // Break after we've shown all days
      if (day > daysInMonth && i >= 4) break;
    }
    
    // Update the calendar in the DOM
    document.getElementById('calendar-body').innerHTML = calendarHTML;
    
    // Initialize tooltips if Bootstrap is available
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (window.bootstrap && bootstrap.Tooltip) {
      tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    } else {
      console.warn('Bootstrap tooltip functionality not available');
    }
  }
  
  // Month navigation functions
  window.prevMonth = function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    return false;
  };
  
  window.nextMonth = function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    return false;
  };
  
  // Initialize
  fetchEventDetails();
});