document.addEventListener('DOMContentLoaded', () => {
    console.log('Index.js loaded successfully');

    // Carousel functionality
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-list .item');
    const thumbnails = document.querySelectorAll('.carousel-thumbnails .thumbnail-item');
    const prevButton = document.querySelector('.nav-arrow.prev');
    const nextButton = document.querySelector('.nav-arrow.next');
    const progressBar = document.querySelector('.progress-bar');
    const video = document.querySelector('#introVideo');
    const playButton = document.querySelector('.play-button');

    // Debugging: Check if elements are found
    console.log('Carousel:', carousel);
    console.log('Items:', items);
    console.log('Thumbnails:', thumbnails);
    console.log('Prev Button:', prevButton);
    console.log('Next Button:', nextButton);
    console.log('Progress Bar:', progressBar);
    console.log('Video:', video);
    console.log('Play Button:', playButton);

    if (!items.length || !thumbnails.length || !prevButton || !nextButton || !progressBar) {
        console.error('Required carousel elements are missing. Please check the HTML structure.');
        return;
    }

    let currentIndex = 0;
    const totalItems = items.length;
    const autoSlideInterval = 7000;
    let autoSlide;

    // Function to show a specific slide
    function showSlide(index) {
        console.log('Showing slide at index:', index);

        // Normalize index to stay within bounds
        currentIndex = (index + totalItems) % totalItems;

        // Update active item
        items.forEach(item => item.classList.remove('active'));
        items[currentIndex].classList.add('active');

        // Update active thumbnail
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[currentIndex].classList.add('active');

        // Reset and start progress bar animation
        progressBar.classList.remove('active');
        setTimeout(() => {
            progressBar.classList.add('active');
        }, 50);

        // Pause video if switching slides
        if (video) {
            video.pause();
            if (playButton) {
                playButton.style.display = 'flex';
            }
        }
    }

    // Start auto-sliding
    function startAutoSlide() {
        autoSlide = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalItems;
            showSlide(currentIndex);
        }, autoSlideInterval);
    }

    // Stop auto-sliding
    function stopAutoSlide() {
        clearInterval(autoSlide);
    }

    // Video play functionality
    if (playButton && video) {
        playButton.addEventListener('click', () => {
            console.log('Play button clicked');
            video.play().then(() => {
                playButton.style.display = 'none';
            }).catch(e => {
                console.error('Video play error:', e);
            });
        });

        playButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Play button triggered via keyboard');
                playButton.click();
            }
        });

        video.addEventListener('ended', () => {
            console.log('Video ended');
            playButton.style.display = 'flex';
        });
    } else {
        console.warn('Video or play button not found. Skipping video functionality.');
    }

    // Navigation buttons
    nextButton.addEventListener('click', () => {
        console.log('Next button clicked');
        stopAutoSlide();
        currentIndex = (currentIndex + 1) % totalItems;
        showSlide(currentIndex);
        startAutoSlide();
    });

    prevButton.addEventListener('click', () => {
        console.log('Prev button clicked');
        stopAutoSlide();
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        showSlide(currentIndex);
        startAutoSlide();
    });

    // Thumbnail clicks
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            console.log('Thumbnail clicked at index:', index);
            stopAutoSlide();
            currentIndex = index;
            showSlide(currentIndex);
            startAutoSlide();
        });
    });

    // Pause auto-slide on hover
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            console.log('Mouse entered carousel - pausing auto-slide');
            stopAutoSlide();
        });

        carousel.addEventListener('mouseleave', () => {
            console.log('Mouse left carousel - resuming auto-slide');
            startAutoSlide();
        });
    }

    // Initial slide
    showSlide(currentIndex);
    startAutoSlide();

    // Audience section animation
    const audienceItems = document.querySelectorAll('.audience-item');
    console.log('Audience Items:', audienceItems);

    if (audienceItems.length) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    console.log('Audience item visible:', index);
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 200);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        audienceItems.forEach(item => observer.observe(item));
    } else {
        console.warn('No audience items found. Skipping audience animations.');
    }
});