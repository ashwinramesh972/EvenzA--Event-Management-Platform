document.addEventListener('DOMContentLoaded', () => {
  const featureSection = document.querySelector('#our-features');
  const videos = featureSection.querySelectorAll('video.feature-image');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Play all videos when section is visible
          videos.forEach((video) => {
            video.play().catch((error) => {
              console.error('Error playing video:', error);
            });
          });
          // Optionally, stop observing after playing to improve performance
          observer.unobserve(featureSection);
        }
      });
    },
    {
      threshold: 0.1, // Trigger when 10% of the section is visible
    }
  );

  observer.observe(featureSection);
});