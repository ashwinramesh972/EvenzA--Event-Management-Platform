document.addEventListener('DOMContentLoaded', function() {
  // Animate the CTA buttons on hover
  const primaryBtns = document.querySelectorAll('.evenza-unique-primary-btn');
  primaryBtns.forEach(btn => {
      btn.addEventListener('mouseenter', function() {
          const icon = this.querySelector('.evenza-unique-btn-icon');
          if (icon) {
              icon.style.transform = 'translateX(8px)';
          }
      });
      
      btn.addEventListener('mouseleave', function() {
          const icon = this.querySelector('.evenza-unique-btn-icon');
          if (icon) {
              icon.style.transform = 'translateX(0)';
          }
      });
  });

  // Add parallax effect to floating shapes
  const shapes = document.querySelectorAll('.evenza-unique-shape');
  window.addEventListener('mousemove', function(e) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      shapes.forEach((shape, index) => {
          const speed = (index + 1) * 20;
          const xOffset = (x - 0.5) * speed;
          const yOffset = (y - 0.5) * speed;
          
          shape.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
  });

  // Create a typing effect for the hero card title
  const heroCardTitle = document.querySelector('.evenza-unique-card-heading');
  if (heroCardTitle) {
      const originalText = heroCardTitle.textContent;
      heroCardTitle.textContent = '';
      
      let i = 0;
      const typeWriter = () => {
          if (i < originalText.length) {
              heroCardTitle.textContent += originalText.charAt(i);
              i++;
              setTimeout(typeWriter, 50);
          }
      };
      
      // Start typing effect after initial animations
      setTimeout(typeWriter, 1500);
  }

  // Add scroll animation
  const animateOnScroll = () => {
      const heroSection = document.querySelector('.evenza-unique-hero-section');
      if (heroSection) {
          const sectionPosition = heroSection.getBoundingClientRect().top;
          const screenPosition = window.innerHeight / 1.3;
          
          if (sectionPosition < screenPosition) {
              heroSection.classList.add('evenza-unique-in-view');
          }
      }
  };

  // Initial check on page load
  animateOnScroll();
  
  // Check on scroll
  window.addEventListener('scroll', animateOnScroll);

  // Add some dynamic pulse effect to shapes
  const pulseShapes = () => {
      shapes.forEach((shape, index) => {
          // Add a slight pulse effect every few seconds
          setInterval(() => {
              shape.style.transform = 'scale(1.1)';
              setTimeout(() => {
                  shape.style.transform = 'scale(1)';
              }, 300);
          }, 3000 + (index * 1000)); // Stagger the pulse effect
      });
  };

  pulseShapes();

  // Add counter animation for stats if they exist
  const animateCounters = () => {
      const counters = document.querySelectorAll('.evenza-unique-counter');
      counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-target'));
          const duration = 2000; // ms
          const increment = target / (duration / 16); // 60fps
          let current = 0;
          
          const updateCounter = () => {
              current += increment;
              if (current < target) {
                  counter.textContent = Math.ceil(current);
                  requestAnimationFrame(updateCounter);
              } else {
                  counter.textContent = target;
              }
          };
          
          updateCounter();
      });
  };})