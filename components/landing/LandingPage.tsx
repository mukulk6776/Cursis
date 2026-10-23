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
    <div className="lp-body lp-home">
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeaturesSection />
        <section className="lp-section lp-ordis-section lp-product-spotlight" id="ordis" aria-labelledby="ordis-demo-heading">
          <div className="lp-section-header"><p className="lp-section-label">Meet Ordis</p><h2 className="lp-section-title" id="ordis-demo-heading">Your next step,<br />in plain sight.</h2><p className="lp-section-subtitle">Pick a question. See the answer. Then try it with your own work.</p><p className="lp-spotlight-note">Demo data · These examples use fixed answers.</p></div>
          <LazyOrdisDemo />
        </section>
        <ComparisonSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
