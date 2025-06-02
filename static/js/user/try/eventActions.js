// Function to view event details with purple-to-pink color scheme
function viewEvent(eventId) {
    fetch(`/event/view/${eventId}/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Format date and time nicely
            const eventDate = new Date(data.event.date_time);
            const formattedDate = eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const formattedTime = eventDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Get event status color
            const statusColor = getStatusColor(data.event.status);
            
            // Display event details using SweetAlert2 with purple-to-pink inspired styling
            Swal.fire({
                title: '',
                html: `
                    <div class="swal-event-view-card">
                        <div class="swal-event-view-top-section">
                            <div class="swal-event-view-border"></div>
                            <div class="swal-event-view-icons">
                                <div class="swal-event-view-logo">
                                    ${data.event.image 
                                        ? `<img src="${data.event.image}" alt="${data.event.title}" class="swal-event-view-image">` 
                                        : '<div class="swal-event-view-placeholder"><i class="fas fa-calendar-alt fa-3x"></i></div>'}
                                </div>
                                <div class="swal-event-view-status-badge" style="background-color: ${statusColor}">
                                    <i class="fas fa-signal"></i> 
                                    <span>${data.event.status}</span>
                                </div>
                            </div>
                        </div>
                        <div class="swal-event-view-bottom-section">
                            <span class="swal-event-view-title">${data.event.title}</span>
                            
                            <div class="swal-event-view-description-box">
                                <p>${data.event.description}</p>
                            </div>
                            
                            <div class="swal-event-view-row">
                                <div class="swal-event-view-item">
                                    <span class="swal-event-view-big-text"><i class="far fa-calendar-alt"></i></span>
                                    <span class="swal-event-view-regular-text">${formattedDate}</span>
                                </div>
                                <div class="swal-event-view-item">
                                    <span class="swal-event-view-big-text"><i class="far fa-clock"></i></span>
                                    <span class="swal-event-view-regular-text">${formattedTime} (IST)</span>
                                </div>
                            </div>
                            
                            <div class="swal-event-view-row">
                                <div class="swal-event-view-item">
                                    <span class="swal-event-view-big-text"><i class="fas fa-map-marker-alt"></i></span>
                                    <span class="swal-event-view-regular-text">${data.event.location}</span>
                                </div>
                                <div class="swal-event-view-item">
                                    <span class="swal-event-view-big-text"><i class="fas fa-users"></i></span>
                                    <span class="swal-event-view-regular-text">Capacity: ${data.event.capacity}</span>
                                </div>
                            </div>
                            
                            <div class="swal-event-view-row">
                                <div class="swal-event-view-tag">${data.event.event_type}</div>
                                <div class="swal-event-view-tag">${data.event.visibility}</div>
                                ${data.event.is_paid ? 
                                    `<div class="swal-event-view-tag swal-event-view-price-tag">
                                        <i class="fas fa-dollar-sign"></i> ${data.event.price}
                                    </div>` : 
                                    '<div class="swal-event-view-tag swal-event-view-free-tag">Free</div>'}
                            </div>
                        </div>
                    </div>
                `,
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Close',
                customClass: {
                    popup: 'swal-event-view-modal-popup',
                    closeButton: 'swal-event-view-modal-close-button',
                    confirmButton: 'swal-event-view-modal-button',
                    htmlContainer: 'swal-event-view-modal-html-container'
                },
                width: '400px',
                padding: '0',
                background: '#f8f9fa',
                backdrop: `rgba(0,0,0,0.4)`,
                didOpen: () => {
                    // Add CSS to the document
                    if (!document.getElementById('swal-event-view-card-styles')) {
                        const styleSheet = document.createElement('style');
                        styleSheet.id = 'swal-event-view-card-styles';
                        styleSheet.innerHTML = `
                            .swal-event-view-modal-popup {
                                border-radius: 15px;
                                overflow: hidden;
                                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                            }
                            .swal-event-view-modal-html-container {
                                padding: 0 !important;
                                margin: 0 !important;
                            }
                            .swal-event-view-card {
                                width: 100%;
                                background-color: #fff;
                                border-radius: 15px;
                                overflow: hidden;
                                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                            }
                            .swal-event-view-top-section {
                                position: relative;
                                padding: 20px;
                                background: linear-gradient(to right, #9146FF, #FF4591);
                                height: 150px;
                            }
                            .swal-event-view-border {
                                position: absolute;
                                bottom: 0;
                                left: 0;
                                width: 100%;
                                height: 30px;
                                background-color: #fff;
                                border-radius: 50% 50% 0 0 / 100% 100% 0 0;
                            }
                            .swal-event-view-icons {
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                                position: relative;
                                z-index: 1;
                            }
                            .swal-event-view-logo {
                                width: 100px;
                                height: 100px;
                                border-radius: 50%;
                                overflow: hidden;
                                background-color: rgba(255, 255, 255, 0.2);
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                border: 3px solid white;
                            }
                            .swal-event-view-image {
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                            }
                            .swal-event-view-placeholder {
                                color: white;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                width: 100%;
                                height: 100%;
                            }
                            .swal-event-view-status-badge {
                                padding: 8px 15px;
                                border-radius: 50px;
                                color: white;
                                font-weight: 600;
                                font-size: 0.85rem;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            }
                            .swal-event-view-status-badge i {
                                font-size: 0.8rem;
                            }
                            .swal-event-view-bottom-section {
                                padding: 20px;
                            }
                            .swal-event-view-title {
                                display: block;
                                font-size: 1.5rem;
                                font-weight: 700;
                                color: #9146FF;
                                margin-bottom: 15px;
                                text-align: center;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            }
                            .swal-event-view-description-box {
                                background-color: #f8f9fa;
                                border-left: 3px solid #9146FF;
                                padding: 10px;
                                margin-bottom: 15px;
                                border-radius: 3px;
                                font-size: 0.9rem;
                                color: #555;
                                line-height: 1.5;
                                max-height: 100px;
                                overflow-y: auto;
                            }
                            .swal-event-view-description-box p {
                                margin: 0;
                            }
                            .swal-event-view-row {
                                display: flex;
                                justify-content: space-between;
                                margin-bottom: 15px;
                                flex-wrap: wrap;
                                gap: 10px;
                            }
                            .swal-event-view-item {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                flex: 1;
                                min-width: 120px;
                            }
                            .swal-event-view-big-text {
                                font-size: 1.5rem;
                                font-weight: 700;
                                color: #9146FF;
                                margin-bottom: 5px;
                            }
                            .swal-event-view-regular-text {
                                font-size: 0.85rem;
                                color: #7f8c8d;
                                text-align: center;
                            }
                            .swal-event-view-tag {
                                padding: 6px 12px;
                                background-color: #e9ecef;
                                border-radius: 50px;
                                font-size: 0.8rem;
                                font-weight: 600;
                                color: #495057;
                                display: inline-flex;
                                align-items: center;
                            }
                            .swal-event-view-price-tag {
                                background-color: #9146FF;
                                color: white;
                            }
                            .swal-event-view-free-tag {
                                background-color: #FF4591;
                                color: white;
                            }
                            .swal-event-view-modal-button {
                                background: linear-gradient(to right, #9146FF, #FF4591) !important;
                                border-radius: 50px !important;
                                font-weight: 600 !important;
                                padding: 0.75rem 2rem !important;
                                box-shadow: 0 4px 6px rgba(145, 70, 255, 0.3) !important;
                                border: none !important;
                            }
                            .swal-event-view-modal-close-button {
                                color: white !important;
                                font-size: 1.5rem !important;
                                top: 1rem !important;
                                right: 1rem !important;
                                z-index: 10 !important;
                            }
                        `;
                        document.head.appendChild(styleSheet);
                    }
                }
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error,
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: 'Error',
            text: 'An error occurred while fetching event details.',
            icon: 'error',
            confirmButtonText: 'OK',
        });
        console.error('Error:', error);
    });
}

// Helper function to determine status color - updated to match purple theme
function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'upcoming':
            return '#9146FF'; // Purple
        case 'ongoing':
            return '#FF4591'; // Pink
        case 'completed':
            return '#95a5a6'; // Gray
        case 'cancelled':
            return '#e74c3c'; // Red
        case 'postponed':
            return '#f39c12'; // Orange
        default:
            return '#7f8c8d'; // Default gray
    }
}