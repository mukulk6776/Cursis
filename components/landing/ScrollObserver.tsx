'use client';

import { useEffect } from 'react';

export default function ScrollObserver() {
  useEffect(() => {
    const reveals = document.querySelectorAll(
      '.lp-reveal, .lp-reveal-left, .lp-reveal-right, .lp-reveal-scale, .lp-stagger'
    );

    if (!reveals.length) return;

    // Immediately reveal elements that are already in or above viewport
    const checkInitialVisibility = () => {
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      reveals.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= windowHeight * 0.95) {
          el.classList.add('lp-visible');
        }
      });
    };

    checkInitialVisibility();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 50px 0px' }
    );

    reveals.forEach((el) => {
      if (!el.classList.contains('lp-visible')) {
        observer.observe(el);
      }
    });

    const handleScroll = () => {
      checkInitialVisibility();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}
