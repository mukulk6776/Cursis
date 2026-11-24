import type { Metadata } from 'next';
import { marketingMetadata } from '@/lib/seo/marketing';
import { TEAM_USER_LIMIT } from '@/lib/site';

export const metadata: Metadata = {
  ...marketingMetadata(
    '/pay',
    'Paid Plans Coming Soon | CURSIS',
    `Online billing on CURSIS is coming soon. Workspaces for up to ${TEAM_USER_LIMIT} members remain free with no payment details required.`
  ),
  robots: {
    index: false,
    follow: true,
  },
};

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
