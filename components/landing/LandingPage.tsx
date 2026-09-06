import React from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import WorkflowSection from './WorkflowSection';
import FeaturesSection from './FeaturesSection';
import TeamDemoSection from './TeamDemoSection';
import OrdisSection from './OrdisSection';
import CreatorsSection from './CreatorsSection';
import ModulesSection from './ModulesSection';
import PricingSection from './PricingSection';
import AgencySection from './AgencySection';
import HowItWorksSection from './HowItWorksSection';
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
        <WorkflowSection />
        <FeaturesSection />
        <TeamDemoSection />
        <OrdisSection />
        <CreatorsSection />
        <ModulesSection />
        <PricingSection />
        <AgencySection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
