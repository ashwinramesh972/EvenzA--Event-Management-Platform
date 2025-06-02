document.addEventListener('DOMContentLoaded', () => {
    console.log('populateUsers.js loaded');

    let allUsers = []; // Store the full list of users
    let currentFilter = 'all'; // Track the current filter

    async function fetchUsers() {
        try {
            const response = await fetch('/dashboard/users/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Fetch users response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched users:', data);
            allUsers = data.users || [];
            populateUserTable(allUsers); // Initially show all users
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to load users: ' + error.message);
        }
    }

    function populateUserTable(users) {
        const tbody = document.getElementById('user-table-body');
        if (!tbody) {
            console.error('User table body not found');
            return;
        }
        tbody.innerHTML = '';
        if (users && users.length > 0) {
            users.forEach(user => {
                console.log('Rendering user:', user); // Debug log
                const tr = document.createElement('tr');
                tr.className = 'table-row';
                tr.innerHTML = `
                    <td class="px-8 py-6 flex justify-center items-center">
                        <img
                            src="${user.profile_picture || '/media/profile_pics/default.jpg'}"
                            alt="${user.username || 'Unknown User'}'s profile picture"
                            class="w-16 h-16 object-cover rounded-full border-2 border-purple-200 shadow-lg"
                        />
                    </td>
                    <td class="px-8 py-6 font-semibold text-gray-800">${user.username || 'Unknown User'}</td>
                    <td class="px-8 py-6 text-gray-600">${user.email || 'N/A'}</td>
                    <td class="px-8 py-6">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                            ${user.is_banned ? 'bg-red-100 text-red-800' : 
                              user.user_type === 'creator' ? 'bg-yellow-100 text-yellow-800' :
                              user.user_type === 'premium' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'}">
                            ${user.is_banned ? 'Suspended' : (user.user_type || 'N/A')}
                        </span>
                    </td>
                    <td class="px-8 py-6">
                        <button class="action-btn text-sm" 
                                onclick="showUserDetails(${user.id}, '${user.username || 'Unknown User'}', '${user.profile_picture || '/media/profile_pics/default.jpg'}', '${user.user_type || 'N/A'}', '${user.email || 'N/A'}')">
                            <i class="fas fa-eye mr-2"></i>View Details
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="px-8 py-6 text-center text-gray-500">No users found.</td></tr>';
        }
    }

    function filterUsers(filter) {
        console.log('Filtering users with filter:', filter);
        currentFilter = filter;
        let filteredUsers = allUsers;
        if (filter !== 'all') {
            filteredUsers = allUsers.filter(user => {
                console.log('Checking user:', user); // Debug log
                if (filter === 'suspended') {
                    return user.is_banned === true;
                }
                return user.user_type && user.user_type.toLowerCase() === filter.toLowerCase();
            });
        }
        console.log('Filtered users:', filteredUsers);
        populateUserTable(filteredUsers);

        // Update button styles
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200');
        });
        const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200');
            activeBtn.classList.add('bg-blue-500', 'text-white');
        }
    }

    // Add event listeners to filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterUsers(filter);
        });
    });

    // Fetch users on page load
    fetchUsers();
});