document.addEventListener('DOMContentLoaded', function() {
    // Add .js-enabled class to body to enable JavaScript-dependent styles
    document.body.classList.add('js-enabled');
  
    // Target the images for fade-in animation
    const animatedImages = document.querySelectorAll('.evenza-faq-image');
  
    // Create Intersection Observer for fade-in animation
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add the animate-in class to make images visible with animation
          entry.target.classList.add('evenza-animate-in');
          // Once animation is complete, no need to observe anymore
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.2 // Trigger when 20% of the image is visible
    });
  
    // Observe each image
    animatedImages.forEach(image => {
      observer.observe(image);
    });
  
    // Custom accordion functionality (completely independent)
    const accordionButtons = document.querySelectorAll('.evenza-accordion-button');
    
    accordionButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Toggle active state
        const isActive = this.classList.contains('evenza-active');
        
        // Close all other accordion items
        accordionButtons.forEach(btn => {
          if (btn !== this) {
            btn.classList.remove('evenza-active');
            const otherBody = btn.nextElementSibling;
            if (otherBody && otherBody.classList.contains('evenza-accordion-body')) {
              otherBody.classList.remove('evenza-show');
            }
          }
        });
        
        // Toggle current accordion item
        if (isActive) {
          this.classList.remove('evenza-active');
        } else {
          this.classList.add('evenza-active');
        }
        
        // Find and toggle the accordion body
        const accordionBody = this.nextElementSibling;
        if (accordionBody && accordionBody.classList.contains('evenza-accordion-body')) {
          if (isActive) {
            accordionBody.classList.remove('evenza-show');
          } else {
            accordionBody.classList.add('evenza-show');
          }
        }
      });
    });
    
    // Handle any existing Bootstrap accordions if they exist (fallback)
    const bootstrapAccordions = document.querySelectorAll('[data-bs-toggle="collapse"]');
    bootstrapAccordions.forEach(button => {
      if (!button.classList.contains('evenza-accordion-button')) {
        button.addEventListener('click', function() {
          const targetId = this.getAttribute('data-bs-target');
          const collapseElement = document.querySelector(targetId);
          
          if (collapseElement) {
            const willBeExpanded = !collapseElement.classList.contains('show');
            const arrowIcon = this.querySelector('.evenza-faq-arrow i, .faq-arrow i');
            
            if (arrowIcon) {
              setTimeout(() => {
                arrowIcon.style.transform = willBeExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
              }, 50);
            }
          }
        });
      }
    });
    
    // Listen to Bootstrap's accordion events if they exist
    const bootstrapAccordionElement = document.getElementById('faqAccordion');
    if (bootstrapAccordionElement) {
      bootstrapAccordionElement.addEventListener('shown.bs.collapse', function (e) {
        const button = document.querySelector(`[data-bs-target="#${e.target.id}"]`);
        if (button) {
          const arrowIcon = button.querySelector('.evenza-faq-arrow i, .faq-arrow i');
          if (arrowIcon) {
            arrowIcon.style.transform = 'rotate(180deg)';
          }
        }
      });
      
      bootstrapAccordionElement.addEventListener('hidden.bs.collapse', function (e) {
        const button = document.querySelector(`[data-bs-target="#${e.target.id}"]`);
        if (button) {
          const arrowIcon = button.querySelector('.evenza-faq-arrow i, .faq-arrow i');
          if (arrowIcon) {
            arrowIcon.style.transform = 'rotate(0deg)';
          }
        }
      });
    }
});