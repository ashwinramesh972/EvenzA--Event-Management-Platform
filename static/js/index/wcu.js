
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced hover effects for service cards
    document.querySelectorAll('.service-card').forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            // Smooth transition for background image
            this.querySelector('.service-bg').style.opacity = '1';
            
            // Optional: Add more dynamic hover effects
            this.querySelector('.arrow-icon').style.transform = 'translate(5px, -5px)';
            this.querySelector('.service-title').style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            // Reset transitions on mouse leave
            this.querySelector('.service-bg').style.opacity = '0';
            
            // Reset additional effects
            this.querySelector('.arrow-icon').style.transform = 'translate(0, 0)';
            this.querySelector('.service-title').style.transform = 'translateY(0)';
        });
        
        // Optional: Add click functionality
        card.addEventListener('click', function() {
            // You can add navigation to service details page
            // Uncomment and customize as needed
            // const serviceTypes = ['corporate-events', 'wedding-events', 'private-parties'];
            // window.location.href = '/services/' + serviceTypes[index];
        });
    });
    
    // Optional: Add animation for stats on scroll
    const statsSection = document.querySelector('.stats-container');
    const statValues = document.querySelectorAll('.stat-value');
    
    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Function to animate count up
    function animateCountUp(el, target) {
        const count = +el.innerText.replace(/\D/g, '');
        const suffix = el.innerText.replace(/[0-9]/g, '');
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            el.textContent = Math.floor(current) + suffix;
            
            if (current >= target) {
                el.textContent = target + suffix;
                clearInterval(timer);
            }
        }, 16);
    }
    
    // Initialize animation when elements come into view
    function handleScroll() {
        if (isInViewport(statsSection)) {
            // Animate each stat value
            statValues.forEach(stat => {
                const targetValue = parseInt(stat.innerText);
                animateCountUp(stat, targetValue);
            });
            
            // Remove scroll listener after animation is triggered
            window.removeEventListener('scroll', handleScroll);
        }
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    // Check on load as well
    handleScroll();
});