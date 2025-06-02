// Modified pagination.js with custom event to coordinate with animation.js
document.addEventListener('DOMContentLoaded', () => {
  // ===== SCROLL-TRIGGERED TYPING EFFECT =====
  function initWordRevealAnimation() {
    const eventHeadings = document.querySelectorAll('.events-section h2');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animation-started')) {
          entry.target.classList.add('animation-started');
          wordRevealAnimation(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    });
    
    eventHeadings.forEach(heading => {
      observer.observe(heading);
    });
    
    function wordRevealAnimation(element) {
      const spans = element.querySelectorAll('span');
      if (!spans.length) return;
      
      // First, split each span's text into words
      spans.forEach(span => {
        const originalText = span.textContent;
        span.textContent = '';
        
        const words = originalText.split(' ');
        words.forEach((word, index) => {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'reveal-word';
          wordSpan.textContent = word;
          wordSpan.style.opacity = '0';
          wordSpan.style.transform = 'translateY(10px)';
          wordSpan.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
          wordSpan.style.display = 'inline-block';
          
          span.appendChild(wordSpan);
          
          // Add space except after last word
          if (index < words.length - 1) {
            span.appendChild(document.createTextNode(' '));
          }
        });
      });
      
      // Then animate each word with a small delay between them
      const allWordSpans = element.querySelectorAll('.reveal-word');
      allWordSpans.forEach((wordSpan, index) => {
        setTimeout(() => {
          wordSpan.style.opacity = '1';
          wordSpan.style.transform = 'translateY(0)';
          
          // If this is the last word, dispatch the completion event
          if (index === allWordSpans.length - 1) {
            setTimeout(() => {
              element.classList.add('typing-complete');
              const typingCompleteEvent = new CustomEvent('typingComplete', {
                detail: { heading: element }
              });
              document.dispatchEvent(typingCompleteEvent);
            }, 300);
          }
        }, index * 120); // 120ms delay between words
      });
    }
  }


  // ===== CAROUSEL PAGINATION LOGIC =====
  function initCarousel(carouselId, prevButtonId, nextButtonId) {
    const carousel = document.getElementById(carouselId);
    const prevButton = document.getElementById(prevButtonId);
    const nextButton = document.getElementById(nextButtonId);
    
    // Check if carousel and buttons exist
    if (!carousel || !prevButton || !nextButton) {
      console.warn(`Carousel elements not found: ${carouselId}, ${prevButtonId}, ${nextButtonId}`);
      return;
    }
    
    const cards = carousel.querySelectorAll('.card');
    const cardCount = cards.length;
    
    // Skip initialization if no cards exist
    if (cardCount === 0) {
      prevButton.disabled = true;
      nextButton.disabled = true;
      return;
    }
    
    const cardWidth = 360; // Card width + margin (320px + 40px)
    const container = carousel.parentElement;
    const containerWidth = container.clientWidth;
    const cardsPerView = Math.floor((containerWidth - 40) / cardWidth) || 1; // Calculate how many cards fit, min 1
    let currentIndex = 0;

    // Disable Next button if cards are less than or equal to cardsPerView
    if (cardCount <= cardsPerView) {
      nextButton.disabled = true;
    }

    function updateCarousel() {
      // Calculate offset in pixels based on card width
      const offset = -(currentIndex * cardWidth);
      carousel.style.transform = `translateX(${offset}px)`;
      
      // Enable/disable buttons based on position
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex >= cardCount - cardsPerView;
    }

    prevButton.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });

    nextButton.addEventListener('click', () => {
      if (currentIndex < cardCount - cardsPerView) {
        currentIndex++;
        updateCarousel();
      }
    });

    // Initial update to set button states
    updateCarousel();
  }

  // ===== INITIALIZATION =====
  // First, initialize the scroll-triggered typing effect
  try {
    initWordRevealAnimation();
  } catch (error) {
    console.error('Error initializing scroll-triggered typing effect:', error);
    
    // If the modern observer API fails, attempt to restore text
    document.querySelectorAll('.events-section h2 span').forEach(span => {
      if (span.textContent === '') {
        // Get data attribute or fallback to a class check for title parts
        if (span.classList.contains('title-part1')) {
          span.textContent = span.getAttribute('data-original-text') || 'Experience Our Prestigious';
        } else if (span.classList.contains('title-part2')) {
          span.textContent = span.getAttribute('data-original-text') || 'Elite Gatherings';
        }
      }
    });
  }

  // Then initialize carousels
  try {
    // Initialize paid events carousel if elements exist
    if (document.getElementById('paid-events-track')) {
      initCarousel('paid-events-track', 'paid-prev', 'paid-next');
    }
  } catch (error) {
    console.error('Error initializing paid events carousel:', error);
  }
  
  try {
    // Initialize non-paid events carousel if elements exist
    if (document.getElementById('non-paid-events-track')) {
      initCarousel('non-paid-events-track', 'non-paid-prev', 'non-paid-next');
    }
  } catch (error) {
    console.error('Error initializing non-paid events carousel:', error);
  }
  
  // Modify join buttons to show price for paid events
  try {
    document.querySelectorAll('.card').forEach(card => {
      const priceElement = card.querySelector('.event-price');
      const joinButton = card.querySelector('.join-button');
      
      if (priceElement && joinButton) {
        const priceText = priceElement.textContent.trim();
        
        // Check if this is a paid event (contains a price in USD)
        if (priceText.includes('USD')) {
          const price = priceText.replace('USD', '').trim();
          
          // Only change button text if it's not already "Joined"
          if (joinButton.textContent.trim() !== 'Joined') {
            joinButton.textContent = `Join $${price}`;
          }
        }
      }
    });
  } catch (error) {
    console.error('Error modifying join buttons:', error);
  }
});