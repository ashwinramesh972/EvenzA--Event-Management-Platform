document.addEventListener('DOMContentLoaded', () => {
  // Fade in form groups
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach((group, index) => {
    setTimeout(() => {
      group.classList.add('visible');
    }, index * 100);
  });

  // Trigger updatePreview on page load
  updatePreview();

  // Initialize price field visibility
  togglePriceField();
});

function updatePreview() {
  const select = document.getElementById('default_image');
  const rightImage = document.getElementById('right_image');
  const rightSection = document.querySelector('.right-section');
  const defaultImage = rightSection ? rightSection.dataset.defaultImage : '/static/images/user/createpage.jpg';
  const selectedImage = select ? select.value : '';

  try {
    if (selectedImage && selectedImage !== 'main.jpg') {
      rightImage.src = `/media/defaults/${selectedImage}`;
      console.log(`Setting image to: /media/defaults/${selectedImage}`);
    } else {
      rightImage.src = defaultImage;
      console.log(`Setting default image to: ${defaultImage}`);
    }
  } catch (error) {
    console.error('Error updating image preview:', error);
    rightImage.src = defaultImage;
  }
}

function togglePriceField() {
  const isPaidSelect = document.getElementById('isPaid');
  const priceField = document.getElementById('priceField');
  const priceInput = document.getElementById('price');

  if (isPaidSelect && priceField && priceInput) {
    isPaidSelect.addEventListener('change', () => {
      if (isPaidSelect.value === 'yes') {
        priceField.style.display = 'block';
        priceInput.setAttribute('required', 'true');
      } else {
        priceField.style.display = 'none';
        priceInput.removeAttribute('required');
      }
    });

    // Trigger initial state
    if (isPaidSelect.value === 'yes') {
      priceField.style.display = 'block';
      priceInput.setAttribute('required', 'true');
    } else {
      priceField.style.display = 'none';
      priceInput.removeAttribute('required');
    }
  }
}