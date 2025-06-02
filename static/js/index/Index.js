document.addEventListener('DOMContentLoaded', () => {
    console.log('index.js loaded');

    // Video control functionality
    const video = document.getElementById('introVideo');
    const videoControls = document.getElementById('videoControls');
    const pauseBtn = document.getElementById('pauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const skipBtn = document.getElementById('skipBtn');

    console.log('Video elements:', { video, skipBtn });

    if (video) {
        video.loop = false;

        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            videoEnded();
        });

        video.addEventListener('loadeddata', () => {
            console.log('Video loaded successfully');
        });

        video.addEventListener('ended', () => {
            console.log('Video ended');
            videoEnded();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play().catch((e) => console.error('Play error:', e));
                pauseBtn.innerHTML = '❚❚';
                pauseBtn.setAttribute('aria-label', 'Pause video');
            } else {
                video.pause();
                pauseBtn.innerHTML = '▶';
                pauseBtn.setAttribute('aria-label', 'Play video');
            }
        });

        pauseBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pauseBtn.click();
            }
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '🔇' : '🔊';
            muteBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        });

        pauseBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                muteBtn.click();
            }
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            console.log('Skip button clicked');
            video.pause();
            video.currentTime = video.duration || 0;
            videoEnded();
        });

        skipBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Skip button keydown');
                skipBtn.click();
            }
        });
    }

    function videoEnded() {
        console.log('Executing videoEnded');
        const videoIntro = document.querySelector('.video-intro');
        const hero = document.querySelector('.hero');
        const heroContent = document.querySelector('.hero-content');

        if (!videoIntro || !hero || !heroContent) {
            console.error('Missing elements:', { videoIntro, hero, heroContent });
            return;
        }

        videoIntro.style.transition = 'opacity 0.5s ease';
        videoIntro.style.opacity = '0';
        setTimeout(() => {
            videoIntro.style.display = 'none';
            hero.style.display = 'flex';
            videoControls.style.display = 'none';
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(20px)';
            setTimeout(() => {
                heroContent.style.transition = 'all 0.8s ease';
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 100);
            setupSlideshow();
        }, 500);
    }

    // Slideshow functionality
    function setupSlideshow() {
        const slides = document.querySelectorAll('.slideshow .slide');
        const pauseBtn = document.getElementById('pauseSlideshow');
        let currentSlide = 0;
        let slideshowPaused = false;
        let slideshowInterval;

        function showNextSlide() {
            if (!slideshowPaused) {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].classList.add('active');
            }
        }

        function startSlideshow() {
            slideshowInterval = setInterval(showNextSlide, 2000);
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                slideshowPaused = !slideshowPaused;
                pauseBtn.innerHTML = slideshowPaused ? '▶' : '❚❚';
                pauseBtn.setAttribute('aria-label', slideshowPaused ? 'Resume slideshow' : 'Pause slideshow');
                if (slideshowPaused) {
                    clearInterval(slideshowInterval);
                } else {
                    startSlideshow();
                }
            });

            pauseBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pauseBtn.click();
                }
            });
        }

        startSlideshow();
    }

    // Audience section animation
    const audienceItems = document.querySelectorAll('.audience-item');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 200); // Staggered delay for each item
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    audienceItems.forEach(item => {
        observer.observe(item);
    });
});