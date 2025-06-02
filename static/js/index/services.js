document.addEventListener('DOMContentLoaded', () => {
  const servicesSection = document.querySelector('.services');
  if (servicesSection) {
    // Intersection Observer for animations
    const servicesObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          const image = entry.target.querySelector('.service-bg-image');
          if (image) {
            image.classList.add('visible');
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    servicesObserver.observe(servicesSection);

    // Enhanced Parallax effect for the image
    const servicesImage = document.querySelector('.service-bg-image');
    const servicesImageContainer = document.querySelector('.services-image');
    
    if (servicesImage && servicesImageContainer) {
      // Initial position check
      updateParallax();
      
      // Improved parallax function
      function updateParallax() {
        const rect = servicesImageContainer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Check if the element is in view
        if (rect.top < viewportHeight && rect.bottom > 0) {
          // Calculate how much of the element is visible
          const visiblePercentage = Math.min(
            (viewportHeight - rect.top) / (viewportHeight + rect.height),
            1.0
          );
          
          // Apply a smoother parallax effect with more movement
          const parallaxOffset = 50 + (visiblePercentage * 100);
          servicesImage.style.transform = `translateY(-${parallaxOffset}px)`;
        }
      }
      
      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (!prefersReducedMotion) {
        // Add scroll event listener for smooth parallax
        window.addEventListener('scroll', () => {
          // Use requestAnimationFrame for smoother animation
          requestAnimationFrame(updateParallax);
        });
        
        // Also update on window resize
        window.addEventListener('resize', updateParallax);
      } else {
        // Reset the transform for users who prefer reduced motion
        servicesImage.style.transform = 'none';
      }
    } else {
      console.error('Could not find .service-bg-image or .services-image');
    }
  } else {
    console.error('Could not find .services section');
  }
});