'use client';

import { useEffect } from 'react';

export default function ScrollObserver() {
  useEffect(() => {
    // Enhanced scroll reveal with intersection observer
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
            // Keep observing for dynamic effects
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 100px 0px' }
    );

    reveals.forEach((el) => {
      observer.observe(el);
    });

    // Dynamic scroll-based parallax and fade effects
    let ticking = false;
    const parallaxElements = document.querySelectorAll('.lp-parallax');
    const fadeElements = document.querySelectorAll('.lp-fade-scroll');

    const updateScrollEffects = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;

      // Parallax effect
      parallaxElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrolled;
        const elementHeight = rect.height;
        const viewportCenter = scrolled + windowHeight / 2;

        if (
          elementTop < scrolled + windowHeight &&
          elementTop + elementHeight > scrolled
        ) {
          const distance = viewportCenter - elementTop;
          const movement = distance * 0.15; // Parallax speed
          (el as HTMLElement).style.transform = `translateY(${movement}px)`;
        }
      });

      // Dynamic fade based on scroll position
      fadeElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top;
        const elementHeight = rect.height;

        // Calculate opacity based on position in viewport
        if (elementTop < windowHeight && elementTop + elementHeight > 0) {
          const visiblePercent = Math.min(
            1,
            Math.max(0, (windowHeight - elementTop) / (windowHeight * 0.3))
          );
          (el as HTMLElement).style.opacity = String(visiblePercent);
          (el as HTMLElement).style.transform = `translateY(${(1 - visiblePercent) * 30}px)`;
        }
      });

      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    };

    const handleScroll = () => {
      checkInitialVisibility();
      requestTick();
    };

    // Initial update
    updateScrollEffects();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}
