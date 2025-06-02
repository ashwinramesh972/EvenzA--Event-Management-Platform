document.addEventListener('DOMContentLoaded', async () => {
    // Define EvenzA-inspired color palette
    const evenzaColors = {
        purple: '#6B48FF',      // Vibrant purple
        blue: '#3B82F6',        // Bright blue
        pink: '#EC4899',        // Accent pink
        teal: '#14B8A6',        // Teal for contrast
        gray: '#4B5563',        // Dark gray for community posts
        lightPurple: 'rgba(107, 72, 255, 0.1)',  // Light purple for fills
        lightBlue: 'rgba(59, 130, 246, 0.1)',    // Light blue for fills
        lightPink: 'rgba(236, 72, 153, 0.1)',    // Light pink for fills
        lightTeal: 'rgba(20, 184, 166, 0.1)',    // Light teal for fills
        lightGray: 'rgba(75, 85, 99, 0.1)'       // Light gray for fills
    };

    // Initialize all charts with empty data
    const charts = {
        eventsOverTime: new Chart(document.getElementById('eventsOverTimeChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Events Created', data: [], borderColor: evenzaColors.purple, backgroundColor: evenzaColors.lightPurple, fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        newUser: new Chart(document.getElementById('newUserChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'New Users', data: [], borderColor: evenzaColors.blue, backgroundColor: evenzaColors.lightBlue, fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        revenueEvents: new Chart(document.getElementById('revenueEventsChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Revenue ($)', data: [], borderColor: evenzaColors.pink, backgroundColor: evenzaColors.lightPink, fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        revenueSubscriptions: new Chart(document.getElementById('revenueSubscriptionsChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Revenue ($)', data: [], borderColor: evenzaColors.teal, backgroundColor: evenzaColors.lightTeal, fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        topEvents: new Chart(document.getElementById('topEventsChart'), {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Participants', data: [], backgroundColor: [evenzaColors.purple, evenzaColors.blue, evenzaColors.pink] }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        eventRatings: new Chart(document.getElementById('eventRatingsChart'), {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Average Rating', data: [], backgroundColor: [evenzaColors.purple, evenzaColors.blue, evenzaColors.pink, evenzaColors.teal, evenzaColors.gray] }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 5 } } }
        }),
        paymentStatus: new Chart(document.getElementById('paymentStatusChart'), {
            type: 'pie',
            data: { labels: [], datasets: [{ label: 'Payment Status', data: [], backgroundColor: [evenzaColors.teal, evenzaColors.purple, evenzaColors.pink, evenzaColors.blue, evenzaColors.gray, '#17a2b8'] }] },
            options: { responsive: true }
        }),
        paidVsNonPaid: new Chart(document.getElementById('paidVsNonPaidChart'), {
            type: 'pie',
            data: { labels: [], datasets: [{ label: 'Event Type', data: [], backgroundColor: [evenzaColors.purple, evenzaColors.gray] }] },
            options: { responsive: true }
        }),
        canceledVsCompleted: new Chart(document.getElementById('canceledVsCompletedChart'), {
            type: 'pie',
            data: { labels: [], datasets: [{ label: 'Event Status', data: [], backgroundColor: [evenzaColors.pink, evenzaColors.teal] }] },
            options: { responsive: true }
        }),
        eventPrice: new Chart(document.getElementById('eventPriceChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    { label: '$0-$50', data: [], backgroundColor: evenzaColors.purple },
                    { label: '$51-$100', data: [], backgroundColor: evenzaColors.blue },
                    { label: '$101-$150', data: [], backgroundColor: evenzaColors.pink },
                    { label: '$151+', data: [], backgroundColor: evenzaColors.teal }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        userActivity: new Chart(document.getElementById('userActivityChart'), {
            type: 'pie',
            data: { labels: [], datasets: [{ label: 'Activity Types', data: [], backgroundColor: [evenzaColors.purple, evenzaColors.blue, evenzaColors.pink, evenzaColors.teal] }] },
            options: { responsive: true }
        }),
        topActiveUsers: new Chart(document.getElementById('topActiveUsersChart'), {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Activity Count', data: [], backgroundColor: [evenzaColors.purple, evenzaColors.blue, evenzaColors.pink, evenzaColors.teal, evenzaColors.gray] }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        }),
        subscriptionPlan: new Chart(document.getElementById('subscriptionPlanChart'), {
            type: 'pie',
            data: { labels: [], datasets: [{ label: 'Subscriptions', data: [], backgroundColor: [evenzaColors.purple, evenzaColors.blue, evenzaColors.teal] }] },
            options: { responsive: true }
        }),
        communityPosts: new Chart(document.getElementById('communityPostsChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Community Posts', data: [], borderColor: evenzaColors.gray, backgroundColor: evenzaColors.lightGray, fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        })
    };

    // Function to fetch data and update a chart
    async function fetchAndUpdateChart(url, chart, dataKey = 'data', labelKey = 'labels') {
        try {
            const response = await fetch(url);
            const data = await response.json();
            chart.data.labels = data[labelKey];
            chart.data.datasets[0].data = data[dataKey];
            chart.update();
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
        }
    }

    // Special handling for Event Price Distribution (binning data)
    async function fetchAndUpdateEventPriceChart() {
        try {
            const response = await fetch('/dashboard/event-price-distribution/');
            const { data } = await response.json();
            const bins = {
                '0-50': 0,
                '51-100': 0,
                '101-150': 0,
                '151+': 0
            };
            data.forEach(item => {
                const price = item.y;
                if (price <= 50) bins['0-50']++;
                else if (price <= 100) bins['51-100']++;
                else if (price <= 150) bins['101-150']++;
                else bins['151+']++;
            });
            charts.eventPrice.data.labels = ['2025-05'];
            charts.eventPrice.data.datasets[0].data = [bins['0-50']];
            charts.eventPrice.data.datasets[1].data = [bins['51-100']];
            charts.eventPrice.data.datasets[2].data = [bins['101-150']];
            charts.eventPrice.data.datasets[3].data = [bins['151+']];
            charts.eventPrice.update();
        } catch (error) {
            console.error('Error fetching event price distribution:', error);
        }
    }

    // Fetch data for charts without period selection
    await Promise.all([
        fetchAndUpdateChart('/dashboard/paid-vs-non-paid/', charts.paidVsNonPaid),
        fetchAndUpdateChart('/dashboard/canceled-vs-completed/', charts.canceledVsCompleted),
        fetchAndUpdateChart('/dashboard/top-events-by-participation/', charts.topEvents),
        fetchAndUpdateChart('/dashboard/revenue-from-subscriptions/', charts.revenueSubscriptions),
        fetchAndUpdateChart('/dashboard/revenue-from-events/', charts.revenueEvents),
        fetchAndUpdateChart('/dashboard/community-posts-over-time/', charts.communityPosts),
        fetchAndUpdateChart('/dashboard/average-event-ratings/', charts.eventRatings),
        fetchAndUpdateChart('/dashboard/payment-status-distribution/', charts.paymentStatus),
        fetchAndUpdateChart('/dashboard/user-activity-types/', charts.userActivity),
        fetchAndUpdateChart('/dashboard/subscription-plan-distribution/', charts.subscriptionPlan),
        fetchAndUpdateChart('/dashboard/top-active-users/', charts.topActiveUsers),
        fetchAndUpdateEventPriceChart()
    ]);

    // Handle tab switching for Events Created Over Time
    const eventsTabs = document.getElementById('eventsOverTimeChart').closest('.card').querySelectorAll('.tabs a');
    eventsTabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            eventsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const period = tab.textContent.toLowerCase();
            await fetchAndUpdateChart(`/dashboard/events-created-over-time/?period=${period}`, charts.eventsOverTime);
        });
    });

    // Handle tab switching for New User Registration
    const userTabs = document.getElementById('newUserChart').closest('.card').querySelectorAll('.tabs a');
    userTabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            userTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const period = tab.textContent.toLowerCase();
            await fetchAndUpdateChart(`/dashboard/new-user-registration/?period=${period}`, charts.newUser);
        });
    });

    // Initial fetch for charts with period selection (default to monthly)
    await Promise.all([
        fetchAndUpdateChart('/dashboard/events-created-over-time/?period=monthly', charts.eventsOverTime),
        fetchAndUpdateChart('/dashboard/new-user-registration/?period=monthly', charts.newUser)
    ]);

    // Add active class to Monthly tabs by default
    eventsTabs[1].classList.add('active');
    userTabs[1].classList.add('active');
});