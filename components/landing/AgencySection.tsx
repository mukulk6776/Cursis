import React from 'react';

export default function AgencySection() {
  const services = [
    {
      icon: 'A',
      title: 'AI Agents',
      desc: 'Custom AI agents built for your specific business workflows and processes.',
    },
    {
      icon: 'B',
      title: 'Automation',
      desc: 'End-to-end workflow automation that eliminates repetitive manual work.',
    },
    {
      icon: 'D',
      title: 'Dashboards',
      desc: 'Custom analytics dashboards that give you real-time business intelligence.',
    },
    {
      icon: 'I',
      title: 'Integrations',
      desc: 'Connect your existing tools to Cursis or build custom API integrations.',
    },
    {
      icon: 'S',
      title: 'Custom Software',
      desc: 'Full custom software development for unique business requirements.',
    },
    {
      icon: 'C',
      title: 'Consulting',
      desc: 'Strategic AI consulting to identify where AI can transform your operations.',
    },
  ];

  return (
    <section
      className="lp-section"
      id="agency"
      style={{
        background: 'var(--c-brand-bg)',
        maxWidth: '100%',
        paddingLeft: 'var(--sp-6)',
        paddingRight: 'var(--sp-6)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="lp-section-label lp-reveal">Cursis Agency</div>
        <h2 className="lp-section-title lp-reveal">Need more? We build it for you.</h2>
        <p className="lp-section-subtitle lp-reveal">
          Cursis is also a full-service AI agency. If you need custom solutions, we build AI agents, automations,
          dashboards, and integrations — powered by the same team that builds this workspace.
        </p>

        <div className="lp-agency-grid lp-stagger">
          {services.map((item) => (
            <div key={item.title} className="lp-agency-card">
              <div className="lp-agency-card-icon">{item.icon}</div>
              <div className="lp-agency-card-title">{item.title}</div>
              <div className="lp-agency-card-desc">{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--sp-8)' }} className="lp-reveal">
          <a
            href="mailto:contact@cursis.io?subject=Inquiry%20from%20Cursis%20Agency"
            className="btn btn-primary btn-lg"
          >
            Talk to Our Agency
          </a>
        </div>
      </div>
    </section>
  );
}
