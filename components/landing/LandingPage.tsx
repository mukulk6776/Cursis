import React from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import OrdisSection from './OrdisSection';
import ModulesSection from './ModulesSection';
import CtaSection from './CtaSection';
import Footer from './Footer';
import ScrollObserver from './ScrollObserver';
import '@/styles/landing.css';

export default function LandingPage() {
  return (
    <div className="lp-body">
      <ScrollObserver />
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeaturesSection />
        <OrdisSection />
        <ModulesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
