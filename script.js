(function () {
  'use strict';

  const fadeEls = document.querySelectorAll('.fade-up');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
  );

  fadeEls.forEach((el) => observer.observe(el));

  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header-nav a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + entry.target.id) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { threshold: 0.4, rootMargin: `-${header.offsetHeight}px 0px 0px 0px` }
  );

  sections.forEach((s) => sectionObserver.observe(s));

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  if (document.querySelector('a[href*="YOUR_PRODUCT_ID"]')) {
    console.info(
      '%cNERVO™ Dev',
      'color:#5b8fff;font-weight:bold;font-size:13px',
      '\nReplace YOUR_PRODUCT_ID with your Digistore24 product ID.\nExample: https://www.digistore24.com/product/123456'
    );
  }

})();