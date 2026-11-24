import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout & Payment | CURSIS',
  description: 'Upgrade your Cursis workspace with Razorpay. Instant activation for Pro, Business, and Enterprise plans via UPI, Cards, NetBanking, and Wallets.',
  alternates: {
    canonical: 'https://cursis.in/pay',
  },
};

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
