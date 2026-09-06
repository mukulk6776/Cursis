import React from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import OrdisSection from './OrdisSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
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
        <ProblemSection />
        <OrdisSection />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}


