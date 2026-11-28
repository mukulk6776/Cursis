import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';

interface ComparisonRow {
  dimension: string;
  competitorText: string;
  cursisText: string;
}

interface ComparisonGuide {
  slug: string;
  competitorName: string;
  title: string;
  description: string;
  verdict: string;
  chooseCompetitorWhen: string;
  chooseCursisWhen: string;
  rows: ComparisonRow[];
  faqs: { question: string; answer: string }[];
}

const COMPARISONS: ComparisonGuide[] = [
  {
    slug: 'slack-and-asana',
    competitorName: 'Slack + Asana',
    title: 'Cursis vs. Slack + Asana',
    description:
      'Compare paying separately for Slack + Asana against running tasks, team reviews, meeting notes, and Ordis AI inside a single Cursis workspace.',
    verdict:
      'Slack + Asana works for large enterprises that want separate best-of-breed chat and project management tools with per-seat budgets. Cursis fits 2-to-10-person teams, agencies, and startups better because conversations, approvals, grouped tasks, My Day timers, and Ordis AI live in one workspace at flat pricing ($9 or $20 USD/month).',
    chooseCompetitorWhen:
      'You already manage hundreds of cross-department Slack channels or need deep custom enterprise governance across 50+ seats.',
    chooseCursisWhen:
      'You want one workspace starting at $9/mo (Starter) or $20/mo (Pro with Ordis AI and My Day) so tasks stop getting lost in chat.',
    rows: [
      {
        dimension: 'Pricing structure',
        competitorText: 'Separate per-user fees across both Slack and Asana paid tiers.',
        cursisText: 'Flat workspace pricing: Starter $9/mo (up to 6 members) or Pro $20/mo (up to 10 members).',
      },
      {
        dimension: 'Delayed-task triage',
        competitorText: 'Manual board reviews plus separate chat check-ins.',
        cursisText: 'Ordis AI flags slipped deadlines and shows teammate bandwidth across active projects.',
      },
      {
        dimension: 'Daily personal planning',
        competitorText: 'Personal focus timers require add-on tools.',
        cursisText: 'Built-in My Day (3–5 task cap + live timer) feeds directly into Team Pulse.',
      },
      {
        dimension: 'Task approvals & threads',
        competitorText: 'Discussions happen in Slack while approvals live on Asana cards.',
        cursisText: 'Task threads, attachments, review links, and approval gates stay together on one card.',
      },
    ],
    faqs: [
      {
        question: 'Can Cursis replace both Slack task follow-ups and Asana boards?',
        answer:
          'Yes, for teams up to 10 members (or Custom Business deployments), Cursis combines grouped task streams, Kanban boards, task threads, meeting notes, approvals, and Ordis AI alerts without juggling two separate subscriptions.',
      },
      {
        question: 'How much can a 10-person team save switching to Cursis Pro?',
        answer:
          'Cursis Pro covers up to 10 members for $20 USD/month flat launch pricing (regular $39/mo), avoiding per-seat multiplications across chat and project management apps.',
      },
    ],
  },
  {
    slug: 'clickup',
    competitorName: 'ClickUp',
    title: 'Cursis vs. ClickUp',
    description:
      'Compare ClickUp’s heavy custom hierarchy setup against Cursis’s fast, opinionated AI workspace for small teams and creator agencies.',
    verdict:
      'ClickUp excels when an operations team wants deeply customizable databases, formulas, and dozens of nested views across large organizations. Cursis is designed for small teams that want immediate execution without spending weeks configuring templates—giving you Grouped Stream + Kanban tasks, My Day focus limits, and Ordis AI out of the box.',
    chooseCompetitorWhen:
      'You need complex custom fields, formula columns, whiteboards, and enterprise wiki hierarchies maintained by a dedicated ops admin.',
    chooseCursisWhen:
      'You want an intuitive 2-minute setup with flat workspace billing ($9 Starter / $20 Pro), clear daily focus caps, and built-in Ordis delay triage.',
    rows: [
      {
        dimension: 'Setup time',
        competitorText: 'Requires configuring spaces, folders, lists, custom fields, and automations.',
        cursisText: 'Ready immediately with Grouped Stream, Kanban Board, Calendar, Timeline, and quick templates.',
      },
      {
        dimension: 'Daily focus management',
        competitorText: 'Large backlog lists can easily overwhelm daily priorities.',
        cursisText: 'My Day intentionally limits daily commitments to 3–5 tasks against an 8-hour Team Pulse budget.',
      },
      {
        dimension: 'AI workload assistance',
        competitorText: 'Per-seat AI add-on layered over complex spaces.',
        cursisText: 'Ordis AI included in Pro ($20/mo flat for 10 members) focused on delayed tasks and bandwidth.',
      },
      {
        dimension: 'Creative studio reviews',
        competitorText: 'Requires configuring custom approval statuses.',
        cursisText: 'Built-in reviewer sign-off guard blocks premature completion until approved.',
      },
    ],
    faqs: [
      {
        question: 'Why choose Cursis over ClickUp for a small agency?',
        answer:
          'Agencies with 3–10 members often spend more time maintaining ClickUp workspaces than shipping work. Cursis focuses on fast task triage, built-in client review gates, and predictable flat pricing.',
      },
      {
        question: 'Does Cursis support CSV imports from ClickUp or spreadsheets?',
        answer:
          'Yes. Use Import CSV inside the Cursis Tasks toolbar to preview rows, validate teammate emails and due dates, and import up to 100 tasks per batch.',
      },
    ],
  },
  {
    slug: 'notion',
    competitorName: 'Notion',
    title: 'Cursis vs. Notion',
    description:
      'Compare Notion’s flexible blank-page wikis against Cursis’s structured execution workspace with Ordis AI and My Day timers.',
    verdict:
      'Notion is an outstanding blank-canvas wiki and knowledge base if your primary need is company documentation. However, teams using DIY Notion task databases frequently run into missing reminders, stale boards, and manual standups. Cursis is purpose-built for daily execution: tracking deadlines, balancing 8-hour team capacity, and getting Ordis AI nudges.',
    chooseCompetitorWhen:
      'Your top priority is building longform company handbooks, nested docs, and custom relation databases.',
    chooseCursisWhen:
      'Your team needs tasks chased automatically, clear daily focus timers (My Day), approval locks, and workload balancing without DIY database maintenance.',
    rows: [
      {
        dimension: 'Primary strength',
        competitorText: 'Flexible blank-canvas wikis and modular relational databases.',
        cursisText: 'Dedicated project execution, bottleneck triage, daily focus planning, and team workload visibility.',
      },
      {
        dimension: 'Template maintenance',
        competitorText: 'Requires building and fixing custom views, formulas, and filters.',
        cursisText: 'Zero template upkeep—tasks sync seamlessly across Stream, Board, Calendar, and Timeline.',
      },
      {
        dimension: 'Live focus & capacity',
        competitorText: 'No native live focus timer tied to an 8-hour daily capacity bar.',
        cursisText: 'My Day timer updates live Team Pulse capacity (Available / Full / Overloaded) automatically.',
      },
      {
        dimension: 'Review & approval gates',
        competitorText: 'Must be manually modeled via custom status properties.',
        cursisText: 'Formal reviewer assignment prevents tasks from closing until reviewed.',
      },
    ],
    faqs: [
      {
        question: 'Do teams need to build Notion templates to use Cursis?',
        answer:
          'No. Cursis removes template maintenance—projects, task pipelines, My Day timers, meeting notes conversion, and Ordis AI work immediately upon creating a workspace.',
      },
      {
        question: 'Can Cursis also store team documents alongside tasks?',
        answer:
          'Yes. Cursis includes workspace Documents plus contextual file attachments and review links directly on tasks.',
      },
    ],
  },
];

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const guide = COMPARISONS.find((c) => c.slug === competitor);
  return guide
    ? marketingMetadata(`/compare/${guide.slug}`, guide.title, guide.description)
    : {};
}

export default async function CompetitorComparisonPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const guide = COMPARISONS.find((c) => c.slug === competitor);
  if (!guide) return notFound();

  const url = `https://cursis.in/compare/${guide.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cursis.in/' },
          { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://cursis.in/compare' },
          { '@type': 'ListItem', position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };

  return (
    <MarketingPage
      title={guide.title}
      intro={guide.description}
      nextStep="Try Cursis on your next sprint"
    >
      <section className="marketing-card" style={{ marginBottom: '20px', padding: '22px 24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '19px' }}>Quick verdict</h2>
        <p style={{ margin: '0 0 14px', lineHeight: 1.65 }}>{guide.verdict}</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--c-bg-subtle, #FAF6EE)', border: '1px solid var(--border-color, #E5E7EB)' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '4px' }}>
              Choose {guide.competitorName} if:
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary, #4B5563)', lineHeight: 1.5 }}>{guide.chooseCompetitorWhen}</div>
          </div>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--c-brand-bg, #FFF3EB)', border: '1px solid var(--c-brand-border, #FFD5B8)' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--c-brand, #B53B00)', marginBottom: '4px' }}>
              Choose Cursis if:
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary, #1A1A1A)', lineHeight: 1.5 }}>{guide.chooseCursisWhen}</div>
          </div>
        </div>
      </section>

      <div className="marketing-table-scroll" role="region" aria-label={guide.title} tabIndex={0}>
        <table className="marketing-comparison">
          <caption>Side-by-side workflow comparison: {guide.title}</caption>
          <thead>
            <tr>
              <th scope="col">Criteria</th>
              <th scope="col">{guide.competitorName}</th>
              <th scope="col">Cursis</th>
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row) => (
              <tr key={row.dimension}>
                <th scope="row">{row.dimension}</th>
                <td>{row.competitorText}</td>
                <td>{row.cursisText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="marketing-card" style={{ marginTop: '20px', padding: '22px 24px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>Common evaluation questions</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {guide.faqs.map((item) => (
            <div key={item.question}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>{item.question}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #4B5563)', lineHeight: 1.55 }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="marketing-link-list" style={{ marginTop: '16px' }}>
        <Link className="marketing-link" href="/compare">
          All comparison guides
        </Link>
        <Link className="marketing-link" href="/pricing">
          See Starter ($9/mo) &amp; Pro ($20/mo) plans
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
    </MarketingPage>
  );
}
