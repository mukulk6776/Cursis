import type { Metadata } from 'next';
import { BRAND_NAME, SITE_URL, TWITTER_HANDLE } from '@/lib/site';
export { SITE_URL, SOCIAL_PROFILES as socialProfiles } from '@/lib/site';

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/cursis-og.png`,
  secureUrl: `${SITE_URL}/cursis-og.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'CURSIS — Less chasing. More getting done. Daily priorities, team workload and meeting follow-ups.',
};

export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path || '/', SITE_URL).href;
  const pageTitle = title.toUpperCase().includes(BRAND_NAME.toUpperCase()) ? title : `${title} | ${BRAND_NAME}`;

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: BRAND_NAME,
      locale: 'en_US',
      type: 'website',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      creator: TWITTER_HANDLE,
      images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
    },
  };
}

export const marketingFaqs = [
  {
    question: 'What is Cursis and who is it for?',
    answer:
      'Cursis is an all-in-one team workspace and AI project management platform built for small teams, startups, agencies, and creator studios. It brings grouped and Kanban tasks, projects, meeting notes, calendars, My Day focus planning, and Ordis AI into one place so teams spend less time chasing status updates.',
  },
  {
    question: 'What is included in Starter, Pro, and Business plans?',
    answer:
      'Starter ($9/mo launch price, regular $19) includes up to 6 members, 10 projects, and 5 tasks per project without Ordis AI or My Day. Pro ($20/mo launch price, regular $39) unlocks 10 members, unlimited projects and tasks, Ordis AI, and My Day. Business offers custom solutions via Contact Us.',
  },
  {
    question: 'How does Ordis AI catch delayed tasks?',
    answer:
      'Available on Pro and Business workspaces, Ordis AI monitors due dates, unassigned deliverables, blocked work, and teammate capacity across projects. You can ask Ordis which tasks need attention today or who has free bandwidth before a deadline slips.',
  },
  {
    question: 'What is the My Day feature in Cursis?',
    answer:
      'My Day is a daily focus planner included in Pro and Business plans. Each teammate selects 3 to 5 priority tasks for the day, estimates hours against an 8-hour workday, and runs a focus timer that updates Team Pulse without interrupting the team with status meetings.',
  },
  {
    question: 'How does Cursis compare to using Slack plus Asana or ClickUp?',
    answer:
      'Instead of splitting conversations in Slack and deliverables in separate task trackers, Cursis puts task threads, grouped streams, Kanban boards, approvals, meeting follow-ups, and Ordis AI analysis side by side in one predictable workspace subscription.',
  },
  {
    question: 'Who built Cursis?',
    answer:
      'Cursis was built by Saransh Vashistha (CEO, Product direction), Mukul Kumar (CTO, Engineering), and Lakhan (CGO, Growth & community) to make next actions and team workload clear without bloated templates.',
  },
  {
    question: 'Can agencies and creator teams use Cursis for client reviews?',
    answer:
      'Yes. Agencies and creator studios use Cursis to attach briefs and review links directly to deliverables, assign explicit reviewers, track multi-stage production pipelines, and keep approval history beside each task.',
  },
  {
    question: 'How do cancellations and refunds work?',
    answer:
      'All Cursis purchases are final with no refunds after purchasing. You can cancel anytime without lock-in fees to stop future renewals, while keeping access until the end of your current paid period.',
  },
  {
    question: 'Can I sign in with an existing account?',
    answer:
      'Yes. Choose Sign In in the navigation with your registered email and password or Google Sign-In rather than creating another account.',
  },
  {
    question: 'Where do I change privacy choices, export data, or close my account?',
    answer:
      'Open the Privacy Centre at cursis.in/privacy/rights from the footer at any time to manage consent settings, export your workspace records, or submit an account deletion request.',
  },
];
