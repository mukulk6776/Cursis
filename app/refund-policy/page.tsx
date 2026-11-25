import CancellationPolicyPage from '../cancellation-policy/page';
import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = {
  ...marketingMetadata(
    '/refund-policy',
    'Refund & Cancellation Policy',
    'Request a hassle-free refund by email or cancel your Cursis plan anytime. Refunds are processed via Razorpay within 5–7 business days.'
  ),
  alternates: { canonical: 'https://cursis.in/refund-policy' },
};

export default function RefundPolicyPage() {
  return <CancellationPolicyPage />;
}
