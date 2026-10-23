import { BellRing, Users, Video, Check } from 'lucide-react';

const reasons = [
  { Icon: BellRing, label: 'Ordis AI', title: 'See trouble early', text: 'Ordis AI warns you before a deadline slips and shows who has room to help.' },
  { Icon: Users, label: 'Your team', title: 'Your whole small team', text: 'Everyone gets the same tools. No paid tier to unlock.' },
  { Icon: Video, label: 'Meeting notes', title: 'Leave meetings with a plan', text: 'Turn meeting notes into tasks, beside your chat and calendar.' },
  { Icon: Check, label: 'Getting started', title: 'Start with one task', text: 'Name it, give it an owner, and invite your team when you’re ready.' },
];

export default function FeaturesSection() {
  return <section className="lp-section" id="features" aria-labelledby="why-heading">
    <div className="lp-section-header"><p className="lp-section-label">Built for the whole workday</p><h2 className="lp-section-title" id="why-heading">The tools belong together.<br />So does your team.</h2></div>
    <div className="lp-reasons">{reasons.map(({ Icon, label, title, text }) => <article className="marketing-card" key={label}>
      <div className="lp-reason-top"><span>{label}</span><Icon size={26} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p>
    </article>)}</div>
  </section>;
}
