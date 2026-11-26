import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = marketingMetadata(
  '/creators',
  'For Creators & Studios — Structured Production Handoffs',
  'Organize YouTube, podcast, and agency production across Script Editors (SE), Video Editors (VE), Thumbnail Designers (TD), Social Managers (SM), and Voiceover Artists (VO) inside Cursis.'
);

const studioRoles = [
  {
    code: 'SE',
    role: 'Script Editor',
    focus: 'Drafts retention hooks, outlines talking points, trims pacing dead air, and locks spoken narrative briefs.',
  },
  {
    code: 'VE',
    role: 'Video Editor',
    focus: 'Assembles rough cuts, sound effects, motion graphics, and color passes directly against approved brief links.',
  },
  {
    code: 'TD',
    role: 'Thumbnail Designer',
    focus: 'Produces packaging variations, bold typography framing, and visual contrast tests ready for sign-off.',
  },
  {
    code: 'SM',
    role: 'Social Manager',
    focus: 'Clips longform releases into Shorts/Reels/TikToks and manages publish checklists beside the parent project.',
  },
  {
    code: 'VO',
    role: 'Voiceover Artist',
    focus: 'Records narration passes, sponsor reads, and localized audio stems tracked on dedicated review subtasks.',
  },
];

const creatorFaqs = [
  {
    question: 'How does Cursis stop video drafts from shipping before review?',
    answer:
      'Every deliverable can enforce a named reviewer approval step inside the task thread. When an approval request is pending, the task cannot be marked Completed until the designated reviewer approves or requests changes.',
  },
  {
    question: 'Which Cursis plan is best for a 5-to-10-person creator studio?',
    answer:
      'The Pro Plan ($20 USD/month launch pricing, regular $39) fits most creator studios with support for up to 10 team members, unlimited projects and deliverables, My Day daily focus timers, and Ordis AI bottleneck tracking.',
  },
  {
    question: 'Can creative teams keep files, briefs, and feedback together?',
    answer:
      'Yes. Each task holds the brief description, review URL, attached files (up to 10 MB per upload), approval history, and due dates across List, Board, Calendar, and Timeline views.',
  },
];

const creatorSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: creatorFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cursis.in/' },
        { '@type': 'ListItem', position: 2, name: 'For Creators', item: 'https://cursis.in/creators' },
      ],
    },
  ],
};

export default function Creators() {
  return (
    <MarketingPage
      title="Make every production review clear."
      intro="Give creator teams and production studios a structured path from brief to final sign-off—without losing edits in chat."
      nextStep="Bring your next production pipeline"
    >
      <section className="marketing-card" style={{ marginBottom: '20px', padding: '22px 24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Keep the decision beside the work</h2>
        <p style={{ margin: '0 0 12px', lineHeight: 1.65 }}>
          Production pipelines stall when scripts live in one app, frame feedback lives in DMs, and editors guess which
          cut is final. In Cursis, every deliverable tracks its brief, named reviewer, attached files, and approval
          status in one shared thread across <strong>To Do</strong>, <strong>In Progress</strong>,{' '}
          <strong>In Review</strong>, and <strong>Completed</strong> stages.
        </p>
        <Link className="marketing-link" href="/blog/agency-project-management">
          Read the full guide to creative briefs and handoffs
        </Link>
      </section>

      <section aria-labelledby="creator-roles-heading" style={{ marginBottom: '22px' }}>
        <h2 id="creator-roles-heading" style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>
          Built for five core creative studio roles
        </h2>
        <div
          className="marketing-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}
        >
          {studioRoles.map((item) => (
            <article key={item.code} className="marketing-card" style={{ marginBottom: 0, padding: '18px' }}>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#FFF3EB',
                  color: '#C2410C',
                  marginBottom: '8px',
                }}
              >
                {item.code}
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>{item.role}</h3>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#4B5563', lineHeight: 1.55 }}>{item.focus}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-card" style={{ padding: '22px 24px' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '18px' }}>Questions from creator teams</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {creatorFaqs.map((item) => (
            <div key={item.question}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>{item.question}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', lineHeight: 1.55 }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorSchema).replace(/</g, '\\u003c') }}
      />
    </MarketingPage>
  );
}
