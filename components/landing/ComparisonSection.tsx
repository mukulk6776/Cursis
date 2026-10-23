import Link from 'next/link';
export default function ComparisonSection() {
  return <section className="lp-section" id="compare" aria-labelledby="comparison-heading">
    <div className="lp-section-header"><p className="lp-section-label">Find your fit</p><h2 className="lp-section-title" id="comparison-heading">Choose how you follow through.</h2></div>
    <div className="lp-comparison-strip marketing-card"><div><h3>Typical task tools</h3><p>A place to record work. How you follow up depends on the tool and your setup.</p></div><div><h3>Cursis</h3><p>Ask what needs attention and get a concrete next step.</p></div></div>
    <p className="lp-centered"><Link className="marketing-link" href="/compare">Compare the approach</Link></p>
    <p className="lp-tools-line">Included: Tasks · Projects · Chat · Meetings · Calendar · Ordis AI · Reports</p>
  </section>;
}
