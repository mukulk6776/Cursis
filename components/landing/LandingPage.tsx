import React from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import WorkflowSection from './WorkflowSection';
import OrdisSection from './OrdisSection';
import ModulesSection from './ModulesSection';
import CreatorsSection from './CreatorsSection';
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
        <WorkflowSection />
        <OrdisSection />
        <ModulesSection />
        <CreatorsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
