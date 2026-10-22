import MarketingPage from '@/components/landing/MarketingPage';
import { BRAND_NAME, FREE_WORKSPACE_TEXT } from '@/lib/site';
const team = [
  { name: 'Saransh Vashistha', role: 'CEO', focus: 'Product direction and making teamwork easier.' },
  { name: 'Mukul Kumar', role: 'CTO', focus: 'Building the workspace and Ordis AI.' },
  { name: 'Lakhan', role: 'CGO', focus: 'Helping teams discover Cursis and listening to their feedback.' },
];
export default function AboutPage() {
  return <MarketingPage title="Built for better teamwork." intro={FREE_WORKSPACE_TEXT + '. Work and conversations in one place.'}>
    <section className="marketing-prose"><h2>Why we’re building {BRAND_NAME}</h2><p>We want teams to spend less time chasing updates and switching apps. {BRAND_NAME} keeps work and conversations together, while Ordis AI helps catch delays and share the workload.</p><dl className="marketing-facts"><div><dt>Founded</dt><dd>2026</dd></div><div><dt>Based in</dt><dd>Delhi, India</dd></div></dl></section>
    <section><h2>The people building it</h2><div className="marketing-grid">{team.map(person => <article key={person.name} className="marketing-card"><h3>{person.name}</h3><p>{person.role}</p><p>{person.focus}</p></article>)}</div></section>
  </MarketingPage>;
}
