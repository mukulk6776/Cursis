import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { SOCIAL_LINKS } from '@/lib/site';
import styles from './about.module.css';

const team = [
  {
    name: 'Saransh Vashistha', initials: 'SV', role: 'CEO · Product direction',
    focus: 'Saransh focuses on what Cursis should solve and why it matters. His work connects the bigger product vision with the everyday details that help a team understand what to do next.',
  },
  {
    name: 'Mukul Kumar', initials: 'MK', role: 'CTO · Engineering',
    focus: 'Mukul turns the product direction into the tools people use. His focus is on how the parts of Cursis fit together, from the workspace experience to the systems behind it.',
  },
  {
    name: 'Lakhan', initials: 'L', role: 'CGO · Growth & community',
    focus: 'Lakhan focuses on the conversation around Cursis: listening to teams, understanding where work gets stuck, and sharing what we build with the people it could help.',
  },
];

export default function AboutPage() {
  return (
    <MarketingPage
      title="Meet the people behind Cursis."
      intro="A small team with a shared belief: keeping work moving should leave you more time to do the work."
      nextStep="Give your next project a home."
    >
      <div className={styles.content}>
        <section className={styles.story} aria-labelledby="story-heading">
          <div className={styles.sectionHeading}>
            <p className="lp-section-label">01 / Our story</p>
            <h2 id="story-heading">A task on a list.<br />Then what?</h2>
          </div>
          <div className="marketing-prose">
            <p>We built Cursis around a simple frustration: a task can be written down and still go nowhere. The owner is unclear. The important context is buried in a conversation. A deadline gets closer while everyone waits for an update.</p>
            <p>Adding another list doesn’t always fix that. Teams need to understand how the work connects: what matters now, who is taking it forward, and where a little help could make a difference.</p>
            <p>That’s the idea behind Cursis. We’re bringing tasks, projects, conversations, and planning into a shared workspace, with Ordis AI to help teams see what needs attention. Less time piecing the day together. More time making progress.</p>
          </div>
        </section>

        <section className={`marketing-card ${styles.mission}`} aria-labelledby="mission-heading">
          <p className={styles.eyebrow}>What we’re working toward</p>
          <h2 id="mission-heading">Less chasing.<br />More doing.</h2>
          <p>Our mission is to make the next step clear, so small teams can spend their energy on the work they care about. A calmer workday starts with a shared understanding of what needs to happen next.</p>
        </section>

        <section aria-labelledby="principles-heading">
          <div className={styles.sectionHeading}>
            <p className="lp-section-label">02 / Our approach</p>
            <h2 id="principles-heading">What matters to us.</h2>
            <p>These are the ideas we want to show up in the product, from the first task to the end of a busy week.</p>
          </div>
          <div className={`marketing-grid ${styles.cards}`}>
            <article className="marketing-card">
              <span className={styles.number} aria-hidden="true">01</span>
              <h3>Clarity before complexity.</h3>
              <p>A workspace should help you answer a few useful questions: what needs doing, who owns it, and what is getting in the way. More information only helps when it makes those answers easier to find.</p>
            </article>
            <article className="marketing-card">
              <span className={styles.number} aria-hidden="true">02</span>
              <h3>Keep the context close.</h3>
              <p>A task makes more sense beside the conversation, project, and plan it belongs to. We want fewer gaps between deciding what to do and having what you need to do it.</p>
            </article>
            <article className="marketing-card">
              <span className={styles.number} aria-hidden="true">03</span>
              <h3>Make AI useful.</h3>
              <p>Our aim for Ordis is practical help: understanding the state of work, spotting what needs attention, and helping with the next action. The team’s judgment stays at the centre of the work.</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="team-heading">
          <div className={styles.sectionHeading}>
            <p className="lp-section-label">03 / The people</p>
            <h2 id="team-heading">Three perspectives.<br />One shared direction.</h2>
            <p>Product, engineering, and community come together around the same question: how can Cursis make the workday easier to navigate?</p>
          </div>
          <div className={`marketing-grid ${styles.cards}`}>
            {team.map(person => (
              <article key={person.name} className={`marketing-card ${styles.person}`}>
                <div className={styles.initials} aria-hidden="true">{person.initials}</div>
                <h3>{person.name}</h3>
                <p className={styles.role}>{person.role}</p>
                <p>{person.focus}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.story} aria-labelledby="conversation-heading">
          <div className={styles.sectionHeading}>
            <p className="lp-section-label">04 / Build with us</p>
            <h2 id="conversation-heading">Your workday is part<br />of the conversation.</h2>
          </div>
          <div className="marketing-prose">
            <p>We have a direction for Cursis, and we want to understand how it fits into real teams’ days. The handoff that always gets missed. The update you have to ask for twice. The small change that would save you a little effort every week.</p>
            <p>If you’ve tried Cursis, tell us what felt useful and what felt difficult. If you’re still exploring, tell us what your team needs. Those are the conversations we want to have as we keep building.</p>
            <div className={styles.links}>
              <Link href="/contact" className="btn marketing-link">Talk to the team</Link>
              <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="btn marketing-link">Join our Discord <span className="sr-only">(opens in a new tab)</span></a>
            </div>
          </div>
        </section>
      </div>
    </MarketingPage>
  );
}
