import CancellationPolicyPage from '../cancellation-policy/page';
import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = {
  ...marketingMetadata(
    '/refund-policy',
    'Refund & Cancellation Policy',
    'All Cursis purchases and subscriptions are final with no refunds after purchasing. You can cancel anytime to stop future renewals.'
  ),
  alternates: { canonical: 'https://cursis.in/refund-policy' },
};

export default function RefundPolicyPage() {
  return <CancellationPolicyPage />;
}
