import { BellRing, Users, Video, Check } from 'lucide-react';

const reasons = [
  { Icon: BellRing, label: 'Ordis AI', title: 'Catch delays before they happen', text: 'Ordis AI flags tasks at risk of missing their deadline and shows which teammates have free time to step in.' },
  { Icon: Users, label: 'Your team', title: 'Built for teams of every size', text: 'Starter ($9/mo) supports up to 6 members and 10 projects. Upgrade to Pro ($20/mo) for 10 members, unlimited projects, Ordis AI, and My Day.' },
  { Icon: Video, label: 'Meeting notes', title: 'Turn talk into action', text: 'Write your notes, then turn them into assigned tasks, right beside your projects and calendar.' },
  { Icon: Check, label: 'Getting started', title: 'Begin with a single task', text: "Name it, assign an owner, and invite your teammates whenever you're ready." },
];

export default function FeaturesSection() {
  return <section className="lp-section" id="features" aria-labelledby="why-heading">
    <div className="lp-section-header"><p className="lp-section-label">One workspace, zero chaos</p><h2 className="lp-section-title" id="why-heading">Tasks, projects and meetings.<br />One place, one team.</h2></div>
    <div className="lp-reasons">{reasons.map(({ Icon, label, title, text }) => <article className="marketing-card" key={label}>
      <div className="lp-reason-top"><span>{label}</span><Icon size={26} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p>
    </article>)}</div>
  </section>;
}
