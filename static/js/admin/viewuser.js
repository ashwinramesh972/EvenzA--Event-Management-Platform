document.addEventListener('DOMContentLoaded', () => {
    console.log('showUserDetails.js loaded');
    
    let currentUserId = null;
    let isFetching = false;

    window.showUserDetails = async function(userId, username = '', profilePic = '', userType = '', email = '') {
        console.log('showUserDetails called with:', { userId, username, profilePic, userType, email });
        currentUserId = userId;
        
        // Set initial header data immediately for better UX
        document.getElementById('modal-username').textContent = username || 'Unknown User';
        document.getElementById('modal-user-type').textContent = userType;
        document.getElementById('modal-header-email').textContent = email;
        document.getElementById('modal-profile-picture').src = profilePic;
        
        await fetchUserDetails(userId, 1);
    };

    async function fetchUserDetails(userId, page) {
        if (isFetching) {
            console.log('Fetch already in progress, skipping...');
            return;
        }
        isFetching = true;

        console.log('Fetching user details for userId:', userId, 'page:', page);

        const commentsList = document.getElementById('modal-comments');
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        if (!commentsList || !prevButton || !nextButton) {
            console.error('Required DOM elements not found:', { commentsList, prevButton, nextButton });
            isFetching = false;
            return;
        }

        const originalCommentsContent = commentsList.innerHTML;
        const originalPrevText = prevButton.textContent;
        const originalNextText = nextButton.textContent;
        commentsList.innerHTML = '<li>Loading...</li>';
        prevButton.disabled = true;
        nextButton.disabled = true;
        prevButton.textContent = 'Loading...';
        nextButton.textContent = 'Loading...';

        try {
            const response = await fetch(`/dashboard/users-details/${userId}/?page=${page}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetch response data:', data);

            if (data.user) {
                // Update modal header with user info
                document.getElementById('modal-profile-picture').src = data.user.profile_picture || '/media/profile_pics/default.jpg';
                document.getElementById('modal-username').textContent = data.user.username || 'Unknown User';
                document.getElementById('modal-user-type').textContent = data.user.user_type || 'N/A';
                document.getElementById('modal-header-email').textContent = data.user.email || 'N/A';
                
                // Update existing modal content
                document.getElementById('modal-full-name').textContent = data.user.full_name || 'N/A';
                document.getElementById('modal-email').textContent = data.user.email || 'N/A';
                document.getElementById('modal-events-created').textContent = data.user.events_created ?? 0;
                document.getElementById('modal-events-attended').textContent = data.user.events_attended ?? 0;

                document.getElementById('modal-total-direct-messages').textContent = data.messages.total_direct_messages ?? 0;
                document.getElementById('modal-total-group-messages').textContent = data.messages.total_group_messages ?? 0;
                const groupMessageList = document.getElementById('modal-group-message-details');
                groupMessageList.innerHTML = '';
                if (data.messages.group_message_details && data.messages.group_message_details.length > 0) {
                    data.messages.group_message_details.forEach(group => {
                        const li = document.createElement('li');
                        li.textContent = `${group.group_name}: ${group.message_count} messages`;
                        groupMessageList.appendChild(li);
                    });
                } else {
                    groupMessageList.innerHTML = '<li>No group messages.</li>';
                }

                document.getElementById('modal-total-posts').textContent = data.posts.total_posts ?? 0;
                document.getElementById('modal-total-likes').textContent = data.posts.total_likes ?? 0;
                document.getElementById('modal-total-comments').textContent = data.posts.total_comments ?? 0;
                commentsList.innerHTML = '';
                if (data.posts.comments.comments && data.posts.comments.comments.length > 0) {
                    data.posts.comments.comments.forEach(comment => {
                        const li = document.createElement('li');
                        const createdAt = new Date(comment.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                        li.textContent = `${comment.content} (Posted: ${createdAt})`;
                        commentsList.appendChild(li);
                    });
                } else {
                    commentsList.innerHTML = '<li>No comments on this page.</li>';
                }

                const currentPage = data.posts.comments.current_page;
                const totalPages = data.posts.comments.total_pages;
                document.getElementById('current-page').textContent = currentPage;
                document.getElementById('total-pages').textContent = totalPages;
                prevButton.disabled = currentPage === 1;
                nextButton.disabled = currentPage === totalPages;
                prevButton.textContent = originalPrevText;
                nextButton.textContent = originalNextText;
                prevButton.onclick = () => fetchUserDetails(userId, currentPage - 1);
                nextButton.onclick = () => fetchUserDetails(userId, currentPage + 1);

                const paginationContainer = document.getElementById('comments-pagination');
                const pageNumbers = document.createElement('div');
                pageNumbers.className = 'flex space-x-2 mt-2';
                for (let i = 1; i <= totalPages; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.textContent = i;
                    pageButton.className = `px-2 py-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'}`;
                    pageButton.disabled = i === currentPage || isFetching;
                    pageButton.onclick = () => fetchUserDetails(userId, i);
                    pageNumbers.appendChild(pageButton);
                }
                const existingPageNumbers = paginationContainer.querySelector('.flex.space-x-2');
                if (existingPageNumbers) existingPageNumbers.remove();
                paginationContainer.appendChild(pageNumbers);

                document.getElementById('modal-total-events-left').textContent = data.events_left.total ?? 0;
                const eventsLeftList = document.getElementById('modal-events-left-details');
                eventsLeftList.innerHTML = '';
                if (data.events_left.details && data.events_left.details.length > 0) {
                    data.events_left.details.forEach(event => {
                        const li = document.createElement('li');
                        li.textContent = `${event.event_title}: ${event.cancellation_reason}`;
                        eventsLeftList.appendChild(li);
                    });
                } else {
                    eventsLeftList.innerHTML = '<li>No events left.</li>';
                }

                document.getElementById('user-modal').classList.remove('hidden');
                document.getElementById('modal-comments').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                alert('No user data found.');
                commentsList.innerHTML = originalCommentsContent;
            }
        } catch (error) {
            console.error('Error in fetchUserDetails:', error);
            alert('Failed to fetch user details: ' + error.message);
            commentsList.innerHTML = originalCommentsContent;
            prevButton.textContent = originalPrevText;
            nextButton.textContent = originalNextText;
            prevButton.disabled = false;
            nextButton.disabled = false;
        } finally {
            isFetching = false;
        }
    }

    window.closeModal = function() {
        document.getElementById('user-modal').classList.add('hidden');
        currentUserId = null;
    };
});