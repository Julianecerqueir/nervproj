(function () {
  'use strict';

  const els = document.querySelectorAll('.fade-up');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
  );

  els.forEach((el) => io.observe(el));

  if (document.querySelector('a[href*="YOUR_PRODUCT_ID"]')) {
    console.info(
      '%cNERVO™ Dev',
      'color:#5b8fff;font-weight:bold;font-size:13px',
      '\nReplace YOUR_PRODUCT_ID in the member area link with your actual Digistore24 product ID.'
    );
  }

})();