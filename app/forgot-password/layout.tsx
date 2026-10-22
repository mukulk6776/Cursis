import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = {
  ...marketingMetadata('/forgot-password', 'Reset Your Password', 'Get a reset code by email and choose a new Cursis password.'),
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
