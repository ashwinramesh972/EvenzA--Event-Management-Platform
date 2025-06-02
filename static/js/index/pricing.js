document.addEventListener('DOMContentLoaded', function () {
  // Toggle between monthly and yearly billing
  const monthlyButton = document.querySelector('[data-billing="monthly"]');
  const yearlyButton = document.querySelector('[data-billing="yearly"]');
  const monthlyPrices = document.querySelectorAll('.monthly-price');
  const yearlyPrices = document.querySelectorAll('.yearly-price');

  if (monthlyButton && yearlyButton) {
    monthlyButton.addEventListener('click', function () {
      monthlyButton.classList.add('active', 'bg-blue-600', 'text-white');
      yearlyButton.classList.remove('active', 'bg-blue-600', 'text-white');

      monthlyPrices.forEach(price => {
        price.classList.remove('hidden');
        price.style.display = 'block';
      });

      yearlyPrices.forEach(price => {
        price.classList.add('hidden');
        price.style.display = 'none';
      });
    });

    yearlyButton.addEventListener('click', function () {
      yearlyButton.classList.add('active', 'bg-blue-600', 'text-white');
      monthlyButton.classList.remove('active', 'bg-blue-600', 'text-white');

      yearlyPrices.forEach(price => {
        price.classList.remove('hidden');
        price.style.display = 'block';
      });

      monthlyPrices.forEach(price => {
        price.classList.add('hidden');
        price.style.display = 'none';
      });
    });
  }

  // Add hover effects for pricing cards
  const pricingCards = document.querySelectorAll('.pricing-card');

  pricingCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      if (!card.classList.contains('featured')) {
        card.style.transform = 'translateY(-5px)';
      } else {
        card.style.transform = 'translateY(-5px) scale(1.05)';
      }
    });

    card.addEventListener('mouseleave', function () {
      if (!card.classList.contains('featured')) {
        card.style.transform = 'translateY(0)';
      } else {
        card.style.transform = 'scale(1.05)';
      }
    });
  });

  // Checkout redirect logic
  window.startCheckout = function (planBase, userId) {
    const validPlans = ['joiner', 'creator', 'premium'];
    if (!validPlans.includes(planBase)) {
      console.error('Invalid plan base:', planBase);
      alert('Invalid plan selected. Please try again.');
      return;
    }

    if (!userId || userId === 0) {
      alert('Please log in to select a plan.');
      window.location.href = '/login/'; // Adjust to your login URL
      return;
    }

    const billingType = document.querySelector('.toggle-btn.active')?.dataset.billing || 'monthly';
    const plan = `${planBase}_${billingType}`;
    
    try {
      const finalUrl = `/payment/select-plan/${plan}/${userId}/`;
      const clickedButton = document.activeElement;
      if (clickedButton && clickedButton.classList.contains('cta-btn')) {
        const originalText = clickedButton.textContent;
        clickedButton.textContent = 'Processing...';
        clickedButton.disabled = true;
        
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 300);
      } else {
        window.location.href = finalUrl;
      }
    } catch (error) {
      console.error('Error during checkout redirect:', error);
      if (clickedButton && clickedButton.classList.contains('cta-btn')) {
        clickedButton.textContent = originalText;
        clickedButton.disabled = false;
      }
      alert('There was a problem processing your request. Please try again.');
    }
  };
});