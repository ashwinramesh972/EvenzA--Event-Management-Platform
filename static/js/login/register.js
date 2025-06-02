document.addEventListener('DOMContentLoaded', function() {
  const formGroups = document.querySelectorAll('.form-group');
  
  formGroups.forEach((group, index) => {
    setTimeout(() => {
      group.classList.add('visible');
    }, index * 200); // Staggered delay for each field
  });
});