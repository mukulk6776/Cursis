import { marketingMetadata } from '@/lib/seo/marketing';

export const metadata = {
  ...marketingMetadata(
    '/signup',
    'Sign Up — Create Your Workspace',
    'Create your Cursis team workspace. Start without a credit card and upgrade to Starter ($9/mo) or Pro ($20/mo) anytime.'
  ),
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
