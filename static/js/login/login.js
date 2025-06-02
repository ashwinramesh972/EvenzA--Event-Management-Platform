document.addEventListener('DOMContentLoaded', () => {
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach((group, index) => {
    setTimeout(() => {
      group.classList.add('visible');
    }, index * 200); // Staggered fade-in
  });
});