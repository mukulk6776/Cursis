import MarketingPage from '@/components/landing/MarketingPage';
const team = [
  { name: 'Saransh Vashistha', role: 'CEO', focus: 'Product direction.' },
  { name: 'Mukul Kumar', role: 'CTO', focus: 'Building the product.' },
  { name: 'Lakhan', role: 'CGO', focus: 'Listening to teams and sharing what we build.' },
];
export default function AboutPage() {
  return <MarketingPage title="Meet the people behind Cursis." intro="A small team building a calmer way to work." nextStep="See what we’re building">
    <article className="marketing-prose"><h2>A note from the founders</h2><p>We built Cursis around a simple frustration: a task can be written down and still go nowhere. We want the next action to be easier to see, so teams can spend their attention on the work itself.</p></article>
    <div className="marketing-grid">{team.map(person => <article key={person.name} className="marketing-card"><h2>{person.name}</h2><p>{person.role}</p><p>{person.focus}</p></article>)}</div>
  </MarketingPage>;
}
