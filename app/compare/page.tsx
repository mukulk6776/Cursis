import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = marketingMetadata(
  '/compare',
  'Compare — Cursis vs Fragmented Task Tools',
  'Compare traditional chat-and-task stacks with Cursis and Ordis AI for catching delayed tasks, balancing team workload, and predictable workspace pricing.'
);

const rows = [
  [
    'Daily check-in',
    'Manually scan separate boards and chase teammates in chat.',
    'Ask Ordis AI which deliverables need attention today and get concrete next actions.',
  ],
  [
    'When work stalls',
    'Relies on static reminder emails or manual triage.',
    'Ordis highlights blocked tasks, missing owners, and teammates with free capacity.',
  ],
  [
    'Daily individual focus',
    'Requires third-party time trackers or separate to-do apps.',
    'Built-in My Day focus planner (3–5 priorities + live focus timer) synced with Team Pulse.',
  ],
  [
    'Meeting follow-ups',
    'Action items stay buried in separate call notes docs.',
    'Turn meeting notes and action items directly into assigned tasks inside the workspace.',
  ],
  [
    'Pricing predictability',
    'Per-seat subscriptions across separate chat, doc, and PM tools.',
    'Flat workspace launch pricing: Starter ($9/mo, 6 members) or Pro ($20/mo, 10 members, Ordis AI + My Day).',
  ],
];

const compareFaqs = [
  {
    question: 'Why switch from separate Slack + Asana/ClickUp tools to Cursis?',
    answer:
      'Splitting discussions and tasks creates hidden bottlenecks where decisions live in chat while boards go stale. Cursis keeps grouped task streams, Kanban boards, task conversations, approvals, meeting notes, and Ordis AI analysis in one shared workspace.',
  },
  {
    question: 'Who is Cursis best suited for?',
    answer:
      'Cursis is built for 2-to-10-person startups, agencies, and creator production teams that want clear ownership, fast client review cycles, daily focus discipline, and AI bottleneck alerts without enterprise setup overhead.',
  },
];

const compareSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: compareFaqs.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function Compare() {
  return (
    <MarketingPage
      title="Pick the routine you will actually use."
      intro="A task list is enough until follow-ups start slipping. See how Cursis replaces fragmented status chasing."
      nextStep="Judge it on your next real project"
    >
      <div className="marketing-table-scroll" role="region" aria-label="Workspace approach comparison" tabIndex={0}>
        <table className="marketing-comparison">
          <caption>How Cursis compares to traditional fragmented task stacks</caption>
          <thead>
            <tr>
              <th scope="col">Workflow Area</th>
              <th scope="col">Separate Chat + Task Tools</th>
              <th scope="col">Cursis Workspace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([question, typical, cursis]) => (
              <tr key={question}>
                <th scope="row">{question}</th>
                <td>{typical}</td>
                <td>{cursis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="marketing-card" style={{ marginTop: '20px', padding: '22px 24px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>Key questions when evaluating Cursis</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {compareFaqs.map((item) => (
            <div key={item.question}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>{item.question}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #4B5563)', lineHeight: 1.55 }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="marketing-link-list" style={{ marginTop: '16px' }}>
        <Link className="marketing-link" href="/compare/slack-and-asana">
          Cursis vs. Slack + Asana
        </Link>
        <Link className="marketing-link" href="/compare/clickup">
          Cursis vs. ClickUp
        </Link>
        <Link className="marketing-link" href="/compare/notion">
          Cursis vs. Notion
        </Link>
        <Link className="marketing-link" href="/#ordis">
          Try the Ordis example
        </Link>
        <Link className="marketing-link" href="/pricing">
          View Starter ($9/mo) &amp; Pro ($20/mo) plans
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareSchema).replace(/</g, '\\u003c') }}
      />
    </MarketingPage>
  );
}
