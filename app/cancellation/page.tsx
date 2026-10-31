import CancellationPolicyPage from '../cancellation-policy/page';
import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = {
  ...marketingMetadata(
    '/cancellation',
    'Cancellation Policy',
    'Learn how to cancel your Cursis account or workspace anytime without fees or penalties.'
  ),
  alternates: { canonical: 'https://cursis.in/cancellation-policy' },
};

export default function CancellationRedirectPage() {
  return <CancellationPolicyPage />;
}

