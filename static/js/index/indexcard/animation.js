document.addEventListener('DOMContentLoaded', function() {
  // Configuration - optimized for converging animation effect
  const config = {
    // Animation type - converging effect (cards slide from both sides toward center)
    variation: 'converging',
    
    // Animation timing - optimized for smooth, elegant reveal
    baseDelay: 150,      // Slightly faster delay for a more cohesive effect
    animationDuration: 1200,  // Slightly longer for smoother animation
    
    // Animation distances - enhanced for dramatic yet elegant effect
    distanceX: 120,      // Increased horizontal distance for more impact
    distanceY: 15,       // Slight vertical lift for a more polished appearance
    
    // Animation style - custom easing for silver/black theme cards
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Custom easing with slight bounce
    opacity: true,       // Fade in for more sophisticated appearance
    
    // Advanced settings - optimized for user experience
    viewportTriggerPoint: 0.8,  // Trigger slightly earlier
    staggerFactor: 0.85   // Slightly reduced stagger for more cohesive group animation
  };
  
  // Select all event sections
  const sections = document.querySelectorAll('.events-section');
  
  // Initialize cards based on selected variation
  sections.forEach(section => {
    const cards = section.querySelectorAll('.card');
    initializeCards(cards, config);
  });
  
  // Function to initialize cards based on the selected variation
  function initializeCards(cards, config) {
    cards.forEach((card, index) => {
      // Set initial transitions
      card.style.transition = `opacity ${config.animationDuration}ms ${config.easing}, transform ${config.animationDuration}ms ${config.easing}`;
      
      // Set initial opacity
      if (config.opacity) {
        card.style.opacity = '0';
      }
      
      // Calculate initial transform based on the selected variation
      let transformX = 0;
      let transformY = config.distanceY;
      
      switch(config.variation) {
        case 'allLeft':
          // All cards come from left side
          transformX = -config.distanceX;
          break;
          
        case 'allRight':
          // All cards come from right side
          transformX = config.distanceX;
          break;
          
        case 'alternating':
          // Alternating left and right
          transformX = index % 2 === 0 ? -config.distanceX : config.distanceX;
          break;
          
        case 'converging':
          // Cards converge to center (outer cards come in from sides)
          const centerIndex = Math.floor(cards.length / 2);
          const distanceFromCenter = Math.abs(index - centerIndex);
          const direction = index < centerIndex ? -1 : 1;
          transformX = direction * config.distanceX * (distanceFromCenter / centerIndex);
          break;
          
        case 'diverging':
          // First few cards come from left, last few from right, meeting in middle
          if (index < cards.length / 2) {
            transformX = -config.distanceX;
          } else {
            transformX = config.distanceX;
          }
          break;
          
        case 'wave':
          // Wave pattern - alternating distances creating a wave effect
          transformX = Math.sin(index * 0.5) * config.distanceX;
          transformY = Math.cos(index * 0.5) * config.distanceY;
          break;
      }
      
      // Set initial transform
      card.style.transform = `translate(${transformX}px, ${transformY}px)`;
    });
  }
  
  // Function to check if element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * config.viewportTriggerPoint &&
      rect.bottom >= 0
    );
  }
  
  // Modified function to handle scroll and reveal cards with animation
  function revealCards() {
    const sections = document.querySelectorAll('.events-section');
    
    sections.forEach(section => {
      const heading = section.querySelector('h2');
      const cards = section.querySelectorAll('.card');
      
      // Check if the section has a heading with typing effect
      const hasTypingEffect = heading && heading.classList.contains('typing-complete');
      
      cards.forEach(card => {
        // Only animate if:
        // 1. Card is in viewport
        // 2. Not already animated
        // 3. Either no typing effect in the section, or typing is complete
        if (isInViewport(card) && 
            ((config.opacity && card.style.opacity === '0') || 
            (!config.opacity && card.style.transform !== 'translate(0px, 0px)')) &&
            (!heading || !heading.classList.contains('typing-started') || hasTypingEffect)) {
          
          // Calculate delay based on position in its parent container
          const parent = card.closest('.carousel');
          const siblingCards = parent ? Array.from(parent.querySelectorAll('.card')) : [];
          const index = siblingCards.indexOf(card);
          
          // Apply the animation with delay
          setTimeout(() => {
            if (config.opacity) {
              card.style.opacity = '1';
            }
            card.style.transform = 'translate(0px, 0px)';
          }, index * config.baseDelay * config.staggerFactor);
        }
      });
    });
  }
  
  // Initial check
  revealCards();
  
  // Check on scroll
  window.addEventListener('scroll', revealCards);
  
  // Also check on window resize
  window.addEventListener('resize', revealCards);
  
  // Add a new event listener for typing complete events
  document.addEventListener('typingComplete', function(e) {
    // Force a check when typing is complete to reveal cards
    setTimeout(revealCards, 200); // Small delay to ensure DOM is updated
  });
});