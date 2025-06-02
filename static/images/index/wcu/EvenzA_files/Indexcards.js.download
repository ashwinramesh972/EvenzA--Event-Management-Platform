document.addEventListener('DOMContentLoaded', () => {
  // Advanced Card Animation on Load
  const cards = document.querySelectorAll('.event-card');
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  // Initialize tilt effect
  initTiltEffect();

  const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          
          const details = entry.target.querySelectorAll('.card-details p');
          details.forEach((detail, detailIndex) => {
            setTimeout(() => {
              detail.style.opacity = '1';
              detail.style.transform = 'translateY(0)';
            }, detailIndex * 100);
          });
          
          entry.target.style.animation = `cardReveal 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards`;
        }, index * 150);
        
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add keyframes for card reveal animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes cardReveal {
      0% { opacity: 0; transform: translateY(30px) rotateX(5deg); }
      100% { opacity: 1; transform: translateY(0) rotateX(0); }
    }
    
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes shimmer {
      0% { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }

    .leave-button {
      background: linear-gradient(90deg, #E74C3C, #C0392B);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-left: 10px;
    }

    .leave-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);
    }

    .leave-button:disabled {
      background: #666;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  `;
  document.head.appendChild(style);

  cards.forEach(card => {
    cardObserver.observe(card);
    
    card.addEventListener('mouseenter', enhanceCard);
    card.addEventListener('mouseleave', resetCard);
  });

  function enhanceCard(e) {
    const card = e.currentTarget;
    const image = card.querySelector('.card-image');
    const title = card.querySelector('.event-info h3');
    const badge = card.querySelector('.badge');
    const button = card.querySelector('.cta-button');
    
    if (image) image.style.transform = 'scale(1.1)';
    if (title) {
      title.style.color = '#8F00FF';
      title.style.transform = 'translateY(-2px)';
    }
    if (badge) badge.style.transform = 'rotate(45deg) scale(1.1)';
    if (button && !button.disabled) {
      button.style.transform = 'translateY(-3px) scale(1.05)';
      button.style.boxShadow = '0 8px 20px rgba(143, 0, 255, 0.4)';
    }
  }

  function resetCard(e) {
    const card = e.currentTarget;
    const image = card.querySelector('.card-image');
    const title = card.querySelector('.event-info h3');
    const badge = card.querySelector('.badge');
    const button = card.querySelector('.cta-button');
    
    if (image) image.style.transform = '';
    if (title) {
      title.style.color = '';
      title.style.transform = '';
    }
    if (badge) badge.style.transform = 'rotate(45deg)';
    if (button) {
      button.style.transform = '';
      button.style.boxShadow = '';
    }
  }

  function initTiltEffect() {
    cards.forEach(card => {
      card.addEventListener('mousemove', handleTilt);
      card.addEventListener('mouseleave', resetTilt);
    });
  }

  function handleTilt(e) {
    const card = e.currentTarget;
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    const mouseX = e.clientX - cardRect.left;
    const mouseY = e.clientY - cardRect.top;
    
    const rotateY = ((mouseX / cardWidth) - 0.5) * 10;
    const rotateX = ((0.5 - (mouseY / cardHeight)) * 10);
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    
    const contentElements = card.querySelectorAll('.card-image-wrapper, .card-header, .card-details, .card-footer');
    contentElements.forEach((element, index) => {
      const translateZ = 20 - (index * 5);
      element.style.transform = `translateZ(${translateZ}px)`;
    });
  }

  function resetTilt(e) {
    const card = e.currentTarget;
    card.style.transform = '';
    
    const contentElements = card.querySelectorAll('.card-image-wrapper, .card-header, .card-details, .card-footer');
    contentElements.forEach(element => {
      element.style.transform = '';
    });
  }

  const viewMoreBtns = document.querySelectorAll('.view-more-btn');
  const expandedView = document.querySelector('.expanded-view');
  const collapseBtn = document.querySelector('.collapse-btn');
  const mainSections = document.querySelectorAll('.cards-container[data-category], .events-header');

  viewMoreBtns.forEach(btn => {
    btn.addEventListener('click', handleViewMore);
  });

  if (collapseBtn) {
    collapseBtn.addEventListener('click', handleCollapse);
  }

  function handleViewMore(e) {
    const targetCategory = e.target.getAttribute('data-target');
    
    e.target.innerText = 'Loading...';
    e.target.disabled = true;
    
    const container = document.querySelector(`.cards-container[data-category="${targetCategory}"]`);
    if (container) {
      container.classList.add('loading');
    }
    
    setTimeout(() => {
      mainSections.forEach(section => {
        section.style.display = 'none';
      });
      
      if (expandedView) {
        expandedView.style.display = 'block';
        
        setTimeout(() => {
          expandedView.classList.add('visible');
          populateCategorizedCards(targetCategory);
        }, 100);
      }
      
      e.target.innerText = 'View More';
      e.target.disabled = false;
      
      if (container) {
        container.classList.remove('loading');
      }
      
      expandedView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 800);
  }

  function handleCollapse() {
    expandedView.classList.remove('visible');
    
    setTimeout(() => {
      expandedView.style.display = 'none';
      
      mainSections.forEach(section => {
        section.style.display = '';
      });
      
      document.getElementById('events').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }

  function populateCategorizedCards(sourceCategory) {
    const sourceCards = document.querySelectorAll(`.cards-container[data-category="${sourceCategory}"] .event-card`);
    
    const categorySections = expandedView.querySelectorAll('.category-section');
    categorySections.forEach(section => {
      const container = section.querySelector('.cards-container');
      if (container) {
        container.innerHTML = '';
      }
    });
    
    const cardGroups = {
      'premium-paid': [],
      'premium-unpaid': [],
      'creator': [],
      'joiner': []
    };
    
    sourceCards.forEach(card => {
      const eventType = card.getAttribute('data-event-type');
      if (eventType && cardGroups[eventType] !== undefined) {
        cardGroups[eventType].push(card.cloneNode(true));
      }
    });
    
    Object.keys(cardGroups).forEach(groupKey => {
      const groupCards = cardGroups[groupKey];
      const sectionContainer = expandedView.querySelector(`.category-section[data-category="${groupKey}"] .cards-container`);
      
      if (sectionContainer) {
        if (groupCards.length > 0) {
          groupCards.forEach(card => {
            sectionContainer.appendChild(card);
          });
          
          sectionContainer.parentElement.style.display = 'block';
          
          const clonedCards = sectionContainer.querySelectorAll('.event-card');
          clonedCards.forEach(card => {
            card.classList.remove('visible');
            cardObserver.observe(card);
            
            card.addEventListener('mouseenter', enhanceCard);
            card.addEventListener('mouseleave', resetCard);
            
            card.addEventListener('mousemove', handleTilt);
            card.addEventListener('mouseleave', resetTilt);
            
            const ctaButton = card.querySelector('.cta-button');
            if (ctaButton) {
              ctaButton.addEventListener('click', handleJoinEvent);
            }
            
            const leaveButton = card.querySelector('.leave-button');
            if (leaveButton) {
              leaveButton.addEventListener('click', handleLeaveEvent);
            }
          });
        } else {
          sectionContainer.parentElement.style.display = 'none';
        }
      }
    });
  }

  // Function to check if the user is logged in
  function isUserLoggedIn() {
    const loginLink = document.querySelector('.nav-link[href="/user-login"]');
    return !loginLink; // Returns true if the login link is NOT present (i.e., user is logged in)
  }

  function handleJoinEvent(e) {
    const button = e.currentTarget;
    const eventId = button.getAttribute('data-event-id');

    // Check if the user is logged in; if not, redirect to login page immediately
    if (!isUserLoggedIn()) {
      window.location.href = '/user-login';
      return;
    }
    
    button.disabled = true;
    button.innerText = 'Processing...';
    
    const card = button.closest('.event-card');
    const visibility = card.dataset.visibility;
    let eventCode = '';
    
    if (visibility === 'private') {
      eventCode = prompt('Please enter the event code:');
      if (!eventCode) {
        button.disabled = false;
        button.innerText = 'Join Event';
        showNotification('Event code is required for private events.', 'error');
        return;
      }
    }
    
    fetch(`/event/join/${eventId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ event_code: eventCode })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        button.innerText = 'Joined';
        button.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
        button.style.animation = 'pulse 1s';
        
        const participantsElement = card.querySelector('.card-details p:first-child span');
        if (participantsElement && data.participants_count) {
          const maxCount = parseInt(participantsElement.innerText.split('/')[1]);
          participantsElement.innerText = `${data.participants_count}/${maxCount} people attending`;
        }
        
        // Add leave button
        const cardFooter = card.querySelector('.card-footer');
        const leaveButton = document.createElement('button');
        leaveButton.className = 'leave-button';
        leaveButton.setAttribute('data-event-id', eventId);
        leaveButton.innerText = 'Leave Event';
        leaveButton.addEventListener('click', handleLeaveEvent);
        cardFooter.appendChild(leaveButton);
        
        // Update all instances of this event card
        const allCards = document.querySelectorAll(`.event-card[data-event-id="${eventId}"]`);
        allCards.forEach(card => {
          const ctaBtn = card.querySelector('.cta-button');
          if (ctaBtn && ctaBtn !== button) {
            ctaBtn.disabled = true;
            ctaBtn.innerText = 'Joined';
            ctaBtn.style.background = 'linear-gradient(90deg, #2ECC71, #27AE60)';
          }
          
          // Add leave button to other cards if not present
          const existingLeaveButton = card.querySelector('.leave-button');
          if (!existingLeaveButton) {
            const newCardFooter = card.querySelector('.card-footer');
            const newLeaveButton = leaveButton.cloneNode(true);
            newLeaveButton.addEventListener('click', handleLeaveEvent);
            newCardFooter.appendChild(newLeaveButton);
          }
        });
        
        showNotification(data.message || 'Success! You have joined the event.');
      } else {
        button.disabled = false;
        button.innerText = 'Join Event';
        showNotification(data.error || 'Failed to join the event.', 'error');
      }
    })
    .catch(error => {
      button.disabled = false;
      button.innerText = 'Join Event';
      showNotification('An error occurred while joining the event.', 'error');
      console.error('Error:', error);
    });
  }

  function handleLeaveEvent(e) {
    const button = e.currentTarget;
    const eventId = button.getAttribute('data-event-id');
    
    button.disabled = true;
    button.innerText = 'Processing...';
    
    const cancellationReason = prompt('Please provide a reason for leaving the event (optional):');
    
    fetch(`/event/leave/${eventId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ cancellation_reason: cancellationReason || 'User left the event' })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const card = button.closest('.event-card');
        const joinButton = card.querySelector('.cta-button');
        
        // Update join button
        joinButton.disabled = false;
        joinButton.innerText = 'Join Event';
        joinButton.style.background = '';
        joinButton.style.animation = '';
        
        // Remove leave button
        button.remove();
        
        // Update participant count
        const participantsElement = card.querySelector('.card-details p:first-child span');
        if (participantsElement) {
          const currentCount = parseInt(participantsElement.innerText.split('/')[0]);
          const maxCount = parseInt(participantsElement.innerText.split('/')[1]);
          if (!isNaN(currentCount) && currentCount > 0) {
            participantsElement.innerText = `${currentCount - 1}/${maxCount} people attending`;
          }
        }
        
        // Update all instances of this event card
        const allCards = document.querySelectorAll(`.event-card[data-event-id="${eventId}"]`);
        allCards.forEach(card => {
          const ctaBtn = card.querySelector('.cta-button');
          if (ctaBtn) {
            ctaBtn.disabled = false;
            ctaBtn.innerText = 'Join Event';
            ctaBtn.style.background = '';
            ctaBtn.style.animation = '';
          }
          
          const leaveBtn = card.querySelector('.leave-button');
          if (leaveBtn) {
            leaveBtn.remove();
          }
        });
        
        showNotification('You have successfully left the event.');
      } else {
        button.disabled = false;
        button.innerText = 'Leave Event';
        showNotification(data.error || 'Failed to leave the event.', 'error');
      }
    })
    .catch(error => {
      button.disabled = false;
      button.innerText = 'Leave Event';
      showNotification('An error occurred while leaving the event.', 'error');
      console.error('Error:', error);
    });
  }

  function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
  }

  function showNotification(message, type = 'success') {
    let notification = document.querySelector('.notification-toast');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification-toast';
      document.body.appendChild(notification);
      
      const notificationStyle = document.createElement('style');
      notificationStyle.innerHTML = `
        .notification-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #333;
          color: white;
          padding: 15px 25px;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          transform: translateY(100px);
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .notification-toast.show {
          transform: translateY(0);
          opacity: 1;
        }
        
        .notification-toast.success {
          background: linear-gradient(90deg, #2ECC71, #27AE60);
        }
        
        .notification-toast.error {
          background: linear-gradient(90deg, #E74C3C, #C0392B);
        }
      `;
      document.head.appendChild(notificationStyle);
    }
    
    notification.innerText = message;
    notification.classList.add('show', type);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.classList.remove('success', 'error');
      }, 500);
    }, 3000);
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', handleFilter);
    });
  }

  function handleFilter(e) {
    const filterButton = e.currentTarget;
    const filterValue = filterButton.getAttribute('data-filter');
    const container = filterButton.closest('section').querySelector('.cards-container');
    
    filterButton.closest('.filter-buttons').querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    filterButton.classList.add('active');
    
    if (container) {
      container.classList.add('loading');
      
      setTimeout(() => {
        const cards = container.querySelectorAll('.event-card');
        
        cards.forEach(card => {
          if (filterValue === 'all') {
            card.style.display = '';
          } else {
            const eventType = card.getAttribute('data-event-type');
            card.style.display = (eventType === filterValue) ? '' : 'none';
          }
        });
        
        container.classList.remove('loading');
      }, 400);
    }
  }

  const searchInput = document.querySelector('.events-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const eventsSection = document.getElementById('events');
    const eventCards = eventsSection.querySelectorAll('.event-card');
    
    const containers = eventsSection.querySelectorAll('.cards-container');
    containers.forEach(container => {
      container.classList.add('loading');
    });
    
    setTimeout(() => {
      eventCards.forEach(card => {
        const title = card.querySelector('.event-info h3').innerText.toLowerCase();
        const host = card.querySelector('.card-details p:nth-child(2) span').innerText.toLowerCase();
        const location = card.querySelector('.card-details p:nth-child(3) span').innerText.toLowerCase();
        const eventType = card.querySelector('.card-details p:nth-child(4) span').innerText.toLowerCase();
        
        const matches = title.includes(searchTerm) || 
                        host.includes(searchTerm) || 
                        location.includes(searchTerm) || 
                        eventType.includes(searchTerm);
        
        card.style.display = matches ? '' : 'none';
      });
      
      containers.forEach(container => {
        container.classList.remove('loading');
      });
      
      const noResultsMessage = eventsSection.querySelector('.no-results-message');
      const hasVisibleCards = Array.from(eventCards).some(card => card.style.display !== 'none');
      
      if (!hasVisibleCards && searchTerm.length > 0) {
        if (!noResultsMessage) {
          const message = document.createElement('p');
          message.className = 'no-results-message';
          message.innerText = 'No events found matching your search.';
          message.style.textAlign = 'center';
          message.style.marginTop = '30px';
          message.style.fontSize = '18px';
          message.style.color = '#666';
          
          const lastContainer = containers[containers.length - 1];
          lastContainer.parentNode.insertBefore(message, lastContainer.nextSibling);
        }
      } else if (noResultsMessage) {
        noResultsMessage.remove();
      }
    }, 400);
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Initialize event listeners for buttons
  const ctaButtons = document.querySelectorAll('.cta-button');
  ctaButtons.forEach(button => {
    button.addEventListener('click', handleJoinEvent);
  });

  const leaveButtons = document.querySelectorAll('.leave-button');
  leaveButtons.forEach(button => {
    button.addEventListener('click', handleLeaveEvent);
  });

  improveAccessibility();

  function improveAccessibility() {
    cards.forEach(card => {
      card.setAttribute('tabindex', '0');
      
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const ctaButton = card.querySelector('.cta-button');
          const leaveButton = card.querySelector('.leave-button');
          if (ctaButton && !ctaButton.disabled) {
            ctaButton.click();
          } else if (leaveButton && !leaveButton.disabled) {
            leaveButton.click();
          }
        }
      });
    });
    
    document.querySelectorAll('.user-popup').forEach(popup => {
      popup.setAttribute('aria-hidden', 'true');
    });
    
    document.querySelectorAll('.creator-avatar').forEach(avatar => {
      avatar.setAttribute('aria-expanded', 'false');
      
      avatar.addEventListener('focus', () => {
        const popup = avatar.nextElementSibling;
        if (popup && popup.classList.contains('user-popup')) {
          popup.setAttribute('aria-hidden', 'false');
          avatar.setAttribute('aria-expanded', 'true');
        }
      });
      
      avatar.addEventListener('blur', () => {
        const popup = avatar.nextElementSibling;
        if (popup && popup.classList.contains('user-popup')) {
          popup.setAttribute('aria-hidden', 'true');
          avatar.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }
  
  initCountdowns();
  
  function initCountdowns() {
    const eventDates = document.querySelectorAll('.event-date');
    
    eventDates.forEach(dateElement => {
      const dateText = dateElement.getAttribute('data-date');
      const parsedDate = new Date(dateText);
      
      if (!isNaN(parsedDate.getTime())) {
        const now = new Date();
        const timeDiff = parsedDate - now;
        
        if (timeDiff > 0) {
          const countdownElement = document.createElement('span');
          countdownElement.className = 'event-countdown';
          
          dateElement.appendChild(countdownElement);
          
          updateCountdown(countdownElement, parsedDate);
          
          setInterval(() => {
            updateCountdown(countdownElement, parsedDate);
          }, 60000);
        }
      }
    });
  }
  
  function updateCountdown(element, targetDate) {
    const now = new Date();
    const timeDiff = targetDate - now;
    
    if (timeDiff <= 0) {
      element.innerText = 'Event started!';
      return;
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let countdownText = '';
    if (days > 0) {
      countdownText += `${days}d `;
    }
    if (hours > 0 || days > 0) {
      countdownText += `${hours}h `;
    }
    countdownText += `${minutes}m remaining`;
    
    element.innerText = countdownText;
  }
});