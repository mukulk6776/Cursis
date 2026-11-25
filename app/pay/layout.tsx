import type { Metadata } from 'next';
import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata: Metadata = marketingMetadata(
  '/pay',
  'Checkout & Plans | CURSIS',
  'Upgrade to Starter ($9/mo) or Pro ($20/mo) on CURSIS with secure Razorpay checkout.'
);

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
