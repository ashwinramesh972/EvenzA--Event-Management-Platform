// Event Search Functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.querySelector('.search-button');
    const eventCards = document.querySelectorAll('.card');
    
    // Function to perform search
    function searchEvents(searchTerm) {
        // Convert search term to lowercase for case-insensitive matching
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        
        eventCards.forEach(card => {
            // Get the event title from the card
            const eventTitle = card.querySelector('.name').textContent.toLowerCase();
            
            // Check if the event title contains the search term
            if (eventTitle.includes(normalizedSearchTerm)) {
                card.style.display = 'block';
                card.style.opacity = '1';
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        });
        
        // Show/hide "no results" message
        showNoResultsMessage(searchTerm);
    }
    
    // Function to show/hide no results message
    function showNoResultsMessage(searchTerm) {
        const visibleCards = Array.from(eventCards).filter(card => 
            card.style.display !== 'none'
        );
        
        // Remove existing no results message
        const existingMessage = document.querySelector('.no-results-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // If no cards are visible and there's a search term, show no results message
        if (visibleCards.length === 0 && searchTerm.trim() !== '') {
            const eventsGrid = document.querySelector('.events-grid');
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results-message';
            noResultsDiv.innerHTML = `
                <p style="text-align: center; color: #666; font-size: 16px; margin: 40px 0;">
                    No events found matching "${searchTerm}"
                </p>
            `;
            eventsGrid.appendChild(noResultsDiv);
        }
    }
    
    // Function to reset search (show all events)
    function resetSearch() {
        eventCards.forEach(card => {
            card.style.display = 'block';
            card.style.opacity = '1';
        });
        
        // Remove no results message if it exists
        const existingMessage = document.querySelector('.no-results-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    
    // Event listener for search input (real-time search)
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value;
        
        if (searchTerm.trim() === '') {
            resetSearch();
        } else {
            searchEvents(searchTerm);
        }
    });
    
    // Event listener for search button click
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        const searchTerm = searchInput.value;
        
        if (searchTerm.trim() === '') {
            resetSearch();
        } else {
            searchEvents(searchTerm);
        }
    });
    
    // Event listener for Enter key press in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchTerm = this.value;
            
            if (searchTerm.trim() === '') {
                resetSearch();
            } else {
                searchEvents(searchTerm);
            }
        }
    });
    
    // Optional: Add clear search functionality
    function addClearButton() {
        const searchContainer = document.querySelector('.search-container');
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-search-button';
        clearButton.innerHTML = '×';
        clearButton.style.cssText = `
            position: absolute;
            right: 50px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #666;
            display: none;
        `;
        
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(clearButton);
        
        // Show/hide clear button based on input content
        searchInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                clearButton.style.display = 'block';
            } else {
                clearButton.style.display = 'none';
            }
        });
        
        // Clear search when clear button is clicked
        clearButton.addEventListener('click', function(e) {
            e.preventDefault();
            searchInput.value = '';
            resetSearch();
            this.style.display = 'none';
            searchInput.focus();
        });
    }
    
    // Initialize clear button
    addClearButton();
});