import React from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import LazyOrdisDemo from './LazyOrdisDemo';
import ComparisonSection from './ComparisonSection';
import CtaSection from './CtaSection';
import Footer from './Footer';
import '@/styles/landing.css';

export default function LandingPage() {
  return (
    <div className="lp-body">
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeaturesSection />
        <section className="lp-section lp-ordis-section" id="ordis" aria-labelledby="ordis-demo-heading">
          <div className="lp-section-header"><p className="lp-section-label">Try Ordis</p><h2 className="lp-section-title" id="ordis-demo-heading">One question. A way forward.</h2><p className="lp-section-subtitle">Demo data · Choose a question for an instant example.</p></div>
          <LazyOrdisDemo />
        </section>
        <ComparisonSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
