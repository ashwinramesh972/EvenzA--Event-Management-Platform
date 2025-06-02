document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const navbar = document.querySelector('.navbar');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.menu-overlay');
  const body = document.body;
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');
  
  // Explicitly target the dropdown toggles
  const desktopDropdownToggle = document.querySelector('#navbarDropdown');
  const mobileDropdownToggle = document.querySelector('[data-bs-target="#mobileDropdown"]');
  
  // Hide all dropdowns on page load
  document.querySelectorAll('.dropdown-menu, .collapse').forEach(dropdown => {
    dropdown.style.display = 'none';
  });

  // Scroll effect
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    navbar.classList.toggle('scrolled', scrollTop > 20);
  });

  // Mobile menu toggle
  menuBtn.addEventListener('click', function() {
    this.classList.toggle('active');
    mobileNav.classList.toggle('active');
    overlay.classList.toggle('active');
    body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
  });

  // Close mobile menu
  overlay.addEventListener('click', function() {
    menuBtn.classList.remove('active');
    mobileNav.classList.remove('active');
    overlay.classList.remove('active');
    body.style.overflow = '';
  });

  document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
    link.addEventListener('click', function() {
      if (!this.hasAttribute('data-bs-toggle')) {  // Don't close menu if it's a dropdown toggle
        menuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
        body.style.overflow = '';
      }
    });
  });

  // Desktop dropdown toggle - direct approach
  if (desktopDropdownToggle) {
    desktopDropdownToggle.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdownMenu = this.nextElementSibling;
      const isVisible = dropdownMenu.style.display === 'block';
      
      // Hide all dropdowns first
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
      });
      
      // Show this dropdown if it wasn't visible before
      if (!isVisible) {
        dropdownMenu.style.display = 'block';
      }
      
      // Close when clicking outside
      const closeDropdowns = function(event) {
        if (!event.target.closest('.nav-item.dropdown')) {
          dropdownMenu.style.display = 'none';
          document.removeEventListener('click', closeDropdowns);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeDropdowns);
      }, 10);
    });
  }

  // Mobile dropdown toggle - direct approach
  if (mobileDropdownToggle) {
    mobileDropdownToggle.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('data-bs-target');
      const targetDropdown = document.querySelector(targetId);
      
      if (targetDropdown) {
        const isVisible = targetDropdown.style.display === 'block';
        targetDropdown.style.display = isVisible ? 'none' : 'block';
      }
    });
  }

  // Active link highlighting
  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px 0px 0px',
    threshold: 0.2
  };

  function handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const currentId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          const href = link.getAttribute('href');
          if (href === '/' && !currentId || href === '#' + currentId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  if (sections.length > 0) {
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    sections.forEach(section => observer.observe(section));
  }

  // Set initial active link
  function setInitialActiveLink() {
    const path = window.location.pathname;
    const hash = window.location.hash.substr(1);
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if ((path === '/' && href === '/') || (hash && href === '#' + hash)) {
        link.classList.add('active');
      }
    });
  }
  setInitialActiveLink();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      // Skip dropdown toggles
      if (this.hasAttribute('data-bs-toggle') || this.id === 'navbarDropdown') {
        return;
      }
      
      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        if (mobileNav.classList.contains('active')) {
          menuBtn.classList.remove('active');
          mobileNav.classList.remove('active');
          overlay.classList.remove('active');
          body.style.overflow = '';
        }
        const navbarHeight = navbar.offsetHeight;
        window.scrollTo({
          top: targetElement.offsetTop - navbarHeight - 20,
          behavior: 'smooth'
        });
        history.pushState(null, null, targetId);
      }
    });
  });

  // Accessibility for keyboard users
  document.querySelectorAll('.nav-link, .dropdown-item, .btn-register').forEach(item => {
    if (!item.hasAttribute('aria-label')) {
      item.setAttribute('aria-label', item.textContent.trim());
    }
  });

  // Handle keyboard navigation for dropdowns
  if (desktopDropdownToggle) {
    desktopDropdownToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const dropdownMenu = this.nextElementSibling;
        const isVisible = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
      }
    });
  }

  // Close dropdowns when clicking elsewhere
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-item.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
        dropdown.style.display = 'none';
      });
    }
  });

  // Responsive adjustments
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 992) {
      menuBtn.classList.remove('active');
      mobileNav.classList.remove('active');
      overlay.classList.remove('active');
      body.style.overflow = '';
      // Ensure dropdowns are hidden on resize to desktop
      document.querySelectorAll('.dropdown-menu, .collapse').forEach(dropdown => {
        dropdown.style.display = 'none';
      });
    }
  });
});