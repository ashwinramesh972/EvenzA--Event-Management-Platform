document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.querySelector('.search-button');
    const resultsContainer = document.querySelector('.events-grid');

    searchButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const code = searchInput.value.trim();
        if (!code) return;

        try {
            const response = await fetch('/event/search-private-event/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();
            resultsContainer.innerHTML = '';

            if (data.success) {
                resultsContainer.innerHTML = data.html;
            } else {
                resultsContainer.innerHTML = `<p>${data.message}</p>`;
            }

        } catch (err) {
            console.error('Search error:', err);
            resultsContainer.innerHTML = `<p>Something went wrong. Please try again later.</p>`;
        }
    });

    function getCSRFToken() {
        let cookieValue = null;
        const name = 'csrftoken';
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
