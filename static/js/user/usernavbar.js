// Minimal Navigation JavaScript for EvenzA - No Scroll Lock
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.querySelector('.ez-mobile-menu-btn');
  const navToggleBtn = document.querySelector('.ez-nav-toggle-btn');
  const navbar = document.querySelector('.ez-navbar');
  const mobileNav = document.querySelector('.ez-mobile-nav');
  const menuOverlay = document.querySelector('.ez-menu-overlay');
  
  // Add visual feedback on hover for the toggle buttons
  [navToggleBtn, mobileMenuBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.05)';
      });
      
      btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
      });
    }
  });

  // Desktop toggle button with improved animation
  if (navToggleBtn) {
    navToggleBtn.addEventListener('click', () => {
      navToggleBtn.classList.toggle('ez-active');
      navbar.classList.toggle('ez-collapsed');
      menuOverlay.classList.toggle('ez-active');
      // Removed scroll lock
    });
  }

  // Mobile menu button with improved animation
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('ez-active');
      navbar.classList.toggle('ez-collapsed');
      navbar.classList.toggle('ez-active');
      mobileNav.classList.toggle('ez-active');
      menuOverlay.classList.toggle('ez-active');
      // Removed scroll lock
    });
  }

  // Close navbar when clicking on overlay with smoother transition
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => {
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('ez-active');
      if (navToggleBtn) navToggleBtn.classList.remove('ez-active');
      navbar.classList.add('ez-collapsed');
      navbar.classList.remove('ez-active');
      if (mobileNav) mobileNav.classList.remove('ez-active');
      menuOverlay.classList.remove('ez-active');
      // Removed scroll lock restoration
    });
  }

  // Enhanced mobile link interactions
  const navLinks = document.querySelectorAll('.ez-nav-link');
  navLinks.forEach(link => {
    // Add hover effect
    link.addEventListener('mouseenter', () => {
      link.style.transition = 'all 0.3s ease';
    });
    
    // Close navbar when clicking on a link (for better UX)
    link.addEventListener('click', (e) => {
      // For dropdown toggles, don't auto-close
      if (link.classList.contains('ez-dropdown-toggle')) {
        return;
      }
      
      // For mobile view, close the menu
      if (window.innerWidth <= 768) {
        if (mobileMenuBtn) mobileMenuBtn.classList.remove('ez-active');
        navbar.classList.add('ez-collapsed');
        navbar.classList.remove('ez-active');
        if (mobileNav) mobileNav.classList.remove('ez-active');
        menuOverlay.classList.remove('ez-active');
        // Removed scroll lock restoration
      }
    });
  });
  
  // Simple dropdown functionality
  const dropdownToggles = document.querySelectorAll('.ez-dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Find the associated dropdown menu by id
      const targetId = toggle.getAttribute('id');
      const dropdownMenu = document.querySelector(`[aria-labelledby="${targetId}"]`);
      
      if (dropdownMenu) {
        // Toggle the 'show' class
        dropdownMenu.classList.toggle('show');
        
        // Close when clicking outside
        document.addEventListener('click', function closeDropdown(event) {
          if (!toggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
          }
        });
      }
    });
  });
  
  // Simplified responsive handling for window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // Reset mobile UI elements if screen size changes to desktop
      if (mobileNav && mobileNav.classList.contains('ez-active')) {
        mobileNav.classList.remove('ez-active');
        if (mobileMenuBtn) mobileMenuBtn.classList.remove('ez-active');
        menuOverlay.classList.remove('ez-active');
        // Removed scroll restoration
      }
    }
  });
});