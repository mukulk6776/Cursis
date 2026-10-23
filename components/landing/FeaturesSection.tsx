import { BellRing, Users, Video, Check } from 'lucide-react';

const reasons = [
  { Icon: BellRing, title: 'See trouble early', text: 'Ordis AI warns you before a deadline slips and shows who has room to help.' },
  { Icon: Users, title: 'Your whole small team', text: 'Everyone gets the same tools. No paid tier to unlock.' },
  { Icon: Video, title: 'Leave meetings with a plan', text: 'Turn meeting notes into tasks, beside your chat and calendar.' },
  { Icon: Check, title: 'Start with one task', text: 'Name it, give it an owner, and invite your team when you’re ready.' },
];

export default function FeaturesSection() {
  return <section className="lp-section" id="features" aria-labelledby="why-heading">
    <div className="lp-section-header"><p className="lp-section-label">Why Cursis</p><h2 className="lp-section-title" id="why-heading">A little help following through.</h2></div>
    <div className="lp-reasons">{reasons.map(({ Icon, title, text }) => <article className="marketing-card" key={title}>
      <Icon size={26} aria-hidden="true" /><h3>{title}</h3><p>{text}</p>
    </article>)}</div>
  </section>;
}
