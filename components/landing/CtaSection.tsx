import Link from 'next/link';
export default function CtaSection() {
  return <section className="lp-cta-section" id="cta" aria-labelledby="cta-heading">
    <div className="lp-cta-inner"><h2 className="lp-cta-title" id="cta-heading">Give your next project a home.</h2><div className="lp-cta-buttons"><Link prefetch={false} href="/signup" className="btn btn-primary btn-lg">Make my workspace <span aria-hidden="true">→</span></Link></div></div>
    <aside className="lp-keep-reading" aria-labelledby="reading-heading"><h3 id="reading-heading">Keep reading</h3><ul><li><Link className="marketing-link" href="/blog/catch-delayed-tasks">Catch delayed tasks before the deadline</Link></li><li><Link className="marketing-link" href="/blog/workload-balancing-small-teams">Balance the workload in a small team</Link></li><li><Link className="marketing-link" href="/compare">Decide if Cursis fits your team</Link></li></ul></aside>
  </section>;
}
