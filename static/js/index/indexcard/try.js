function initFasterTypingEffect() {
  // Target all h2 elements in event sections
  const eventHeadings = document.querySelectorAll('.events-section h2');
  
  // Configure the IntersectionObserver as before
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('typing-started')) {
        entry.target.classList.add('typing-started');
        typeHeadingFast(entry.target);
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
  
  // Modified typing function with faster delay (15ms instead of 50ms)
  function typeHeadingFast(element) {
    const spans = element.querySelectorAll('span');
    if (!spans.length) return;
    
    const originalTexts = Array.from(spans).map(span => {
      const text = span.textContent;
      span.textContent = '';
      return text;
    });
    
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    element.appendChild(cursor);
    
    let currentSpanIndex = 0;
    let currentCharIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentSpanIndex >= spans.length) {
        clearInterval(typingInterval);
        element.classList.add('typing-complete');
        setTimeout(() => {
          cursor.remove();
          const typingCompleteEvent = new CustomEvent('typingComplete', {
            detail: { heading: element }
          });
          document.dispatchEvent(typingCompleteEvent);
        }, 200); // Reduced from 300ms
        return;
      }
      
      const currentSpan = spans[currentSpanIndex];
      const targetText = originalTexts[currentSpanIndex];
      
      if (currentCharIndex >= targetText.length) {
        currentSpanIndex++;
        currentCharIndex = 0;
        
        if (currentSpanIndex < spans.length) {
          cursor.textContent = ' |';
        }
        return;
      }
      
      currentSpan.textContent += targetText[currentCharIndex];
      currentCharIndex++;
      
      if (currentSpanIndex < spans.length - 1 || currentCharIndex < targetText.length) {
        element.appendChild(cursor);
      }
    }, 15); // Reduced from 50ms to 15ms for faster typing
  }
}

// Option 2: Reveal Words Animation
// Words appear one by one with a quick fade-in effect
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

// Option 3: Fade-in Slide Animation
// The entire text fades in with a slight upward motion
function initFadeSlideAnimation() {
  const eventHeadings = document.querySelectorAll('.events-section h2');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('animation-started')) {
        entry.target.classList.add('animation-started');
        fadeSlideAnimation(entry.target);
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
  
  function fadeSlideAnimation(element) {
    const spans = element.querySelectorAll('span');
    if (!spans.length) return;
    
    // Store original texts but don't clear them
    spans.forEach(span => {
      // Set initial styles
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.style.transition = 'opacity 800ms ease-out, transform 800ms ease-out';
      span.style.display = 'inline-block';
    });
    
    // Animate spans with a small delay between them
    spans.forEach((span, index) => {
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
        
        // If this is the last span, dispatch the completion event
        if (index === spans.length - 1) {
          setTimeout(() => {
            element.classList.add('typing-complete');
            const typingCompleteEvent = new CustomEvent('typingComplete', {
              detail: { heading: element }
            });
            document.dispatchEvent(typingCompleteEvent);
          }, 300);
        }
      }, index * 200); // 200ms delay between spans
    });
  }
}

// Option 4: Clip Path Reveal Animation
// Text is revealed using a clip-path animation (modern and sleek)
function initClipPathReveal() {
  const eventHeadings = document.querySelectorAll('.events-section h2');
  
  // Add necessary CSS for the clip path effect
  const style = document.createElement('style');
  style.textContent = `
    .clip-reveal {
      display: inline-block;
      clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
      transition: clip-path 1s cubic-bezier(0.33, 1, 0.68, 1);
    }
    
    .clip-reveal.revealed {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  `;
  document.head.appendChild(style);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('animation-started')) {
        entry.target.classList.add('animation-started');
        clipPathReveal(entry.target);
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
  
  function clipPathReveal(element) {
    const spans = element.querySelectorAll('span');
    if (!spans.length) return;
    
    // Prepare spans for animation
    spans.forEach(span => {
      span.classList.add('clip-reveal');
    });
    
    // Animate spans with a small delay between them
    spans.forEach((span, index) => {
      setTimeout(() => {
        span.classList.add('revealed');
        
        // If this is the last span, dispatch the completion event
        if (index === spans.length - 1) {
          setTimeout(() => {
            element.classList.add('typing-complete');
            const typingCompleteEvent = new CustomEvent('typingComplete', {
              detail: { heading: element }
            });
            document.dispatchEvent(typingCompleteEvent);
          }, 700);
        }
      }, index * 150); // 150ms delay between spans
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Config for animations
  const config = {
    animationDuration: 800,
    staggerDelay: 100,
    fadeInDuration: 600,
    slideDistance: 30
  };

  // Get all headings that need animation
  const headings = document.querySelectorAll('.events-section h2');

  // Create an Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
        // Mark as animated to prevent repeats
        entry.target.classList.add('animated');
        
        // Get the animation type from data attribute or default to 'fade-up'
        const animationType = entry.target.getAttribute('data-animation') || 'fade-up';
        
        // Apply the selected animation
        switch(animationType) {
          case 'fade-up':
            fadeUpAnimation(entry.target);
            break;
          case 'slide-reveal':
            slideRevealAnimation(entry.target);
            break;
          case 'word-by-word':
            wordByWordAnimation(entry.target);
            break;
          case 'scale-in':
            scaleInAnimation(entry.target);
            break;
          case 'gradient-reveal':
            gradientRevealAnimation(entry.target);
            break;
          default:
            fadeUpAnimation(entry.target);
        }
        
        // Dispatch event when animation completes
        setTimeout(() => {
          const animationCompleteEvent = new CustomEvent('headingAnimationComplete', {
            detail: { heading: entry.target }
          });
          document.dispatchEvent(animationCompleteEvent);
        }, config.animationDuration + 200);
        
        // Stop observing this heading
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  });

  // Start observing each heading
  headings.forEach(heading => {
    // Make sure spans exist for animations
    prepareHeadingForAnimation(heading);
    observer.observe(heading);
  });

  // Prepare heading by wrapping words in spans if needed
  function prepareHeadingForAnimation(heading) {
    const spans = heading.querySelectorAll('span');
    
    // If heading already has spans, we're good
    if (spans.length > 0) return;
    
    // Otherwise, wrap each word in a span
    const text = heading.textContent;
    heading.textContent = '';
    
    const words = text.split(' ');
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word;
      heading.appendChild(span);
      
      // Add space after each word except the last
      if (index < words.length - 1) {
        heading.appendChild(document.createTextNode(' '));
      }
    });
  }

  // ANIMATION 1: Fade Up Animation (smooth and elegant)
  function fadeUpAnimation(heading) {
    const spans = heading.querySelectorAll('span');
    
    // Set initial styles
    spans.forEach(span => {
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = `translateY(${config.slideDistance}px)`;
      span.style.transition = `opacity ${config.fadeInDuration}ms ease-out, transform ${config.fadeInDuration}ms ease-out`;
    });
    
    // Animate each span with staggered delay
    setTimeout(() => {
      spans.forEach((span, index) => {
        setTimeout(() => {
          span.style.opacity = '1';
          span.style.transform = 'translateY(0)';
        }, index * config.staggerDelay);
      });
    }, 50);
  }
  
  // ANIMATION 2: Slide Reveal Animation (with mask effect)
  function slideRevealAnimation(heading) {
    // Add a container for the mask effect
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    // Move the heading's content into the container
    const originalContent = heading.innerHTML;
    heading.innerHTML = '';
    container.innerHTML = originalContent;
    heading.appendChild(container);
    
    // Create the sliding mask
    const mask = document.createElement('div');
    mask.style.position = 'absolute';
    mask.style.top = '0';
    mask.style.left = '0';
    mask.style.width = '100%';
    mask.style.height = '100%';
    mask.style.backgroundColor = 'var(--primary-color, #111)';
    mask.style.transform = 'translateX(0)';
    mask.style.transition = `transform ${config.animationDuration}ms cubic-bezier(0.86, 0, 0.07, 1)`;
    container.appendChild(mask);
    
    // Set initial opacity of text
    const spans = container.querySelectorAll('span');
    spans.forEach(span => {
      span.style.opacity = '0';
      span.style.transition = `opacity 300ms ease-out`;
      span.style.transitionDelay = '200ms';
    });
    
    // Animate the mask and text
    setTimeout(() => {
      mask.style.transform = 'translateX(100%)';
      
      spans.forEach(span => {
        span.style.opacity = '1';
      });
    }, 50);
  }
  
  // ANIMATION 3: Word By Word Animation (faster than typing)
  function wordByWordAnimation(heading) {
    const spans = heading.querySelectorAll('span');
    
    // Set initial styles
    spans.forEach(span => {
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(10px) scale(0.95)';
      span.style.transition = `opacity 300ms ease-out, transform 300ms ease-out`;
    });
    
    // Animate each word with shorter stagger delay
    spans.forEach((span, index) => {
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0) scale(1)';
      }, index * 80); // Faster than typing
    });
  }
  
  // ANIMATION 4: Scale In Animation (dramatic)
  function scaleInAnimation(heading) {
    // First, get or create a wrapper for the heading text
    let wrapper = heading.querySelector('.heading-wrapper');
    if (!wrapper) {
      const originalContent = heading.innerHTML;
      heading.innerHTML = '';
      wrapper = document.createElement('div');
      wrapper.className = 'heading-wrapper';
      wrapper.innerHTML = originalContent;
      heading.appendChild(wrapper);
    }
    
    // Set initial styles
    wrapper.style.display = 'block';
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'scale(0.85)';
    wrapper.style.transition = `opacity ${config.animationDuration}ms ease-out, transform ${config.animationDuration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
    
    // Animate the entire heading at once
    setTimeout(() => {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'scale(1)';
    }, 50);
  }
  
  // ANIMATION 5: Gradient Reveal Animation (elegant and eye-catching)
  function gradientRevealAnimation(heading) {
    // Store original content
    const originalContent = heading.innerHTML;
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    // Create the text element
    const textElement = document.createElement('div');
    textElement.innerHTML = originalContent;
    textElement.style.position = 'relative';
    textElement.style.zIndex = '2';
    
    // Create the gradient overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '0%';
    overlay.style.height = '100%';
    overlay.style.background = 'linear-gradient(90deg, transparent, var(--primary-color, #111), transparent)';
    overlay.style.zIndex = '1';
    overlay.style.transition = `width ${config.animationDuration}ms ease-out`;
    
    // Assemble the elements
    wrapper.appendChild(overlay);
    wrapper.appendChild(textElement);
    
    // Replace heading content
    heading.innerHTML = '';
    heading.appendChild(wrapper);
    
    // Animate the gradient reveal
    setTimeout(() => {
      overlay.style.width = '100%';
      
      // After animation completes, remove the overlay
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 300ms ease-out';
      }, config.animationDuration);
    }, 50);
  }

  // Listen for animation complete event and trigger card animations
  document.addEventListener('headingAnimationComplete', (e) => {
    // Force a check to reveal cards
    if (typeof revealCards === 'function') {
      setTimeout(revealCards, 200);
    } else {
      // Create a custom event that animation.js can listen for
      const revealCardsEvent = new CustomEvent('revealCards');
      document.dispatchEvent(revealCardsEvent);
    }
  });
});