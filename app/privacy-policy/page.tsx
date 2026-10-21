import { marketingMetadata } from '@/lib/seo/marketing';

export { default } from '../privacy/page';

export const metadata = {
  ...marketingMetadata('/privacy-policy', 'Privacy Policy | Cursis', 'Review how Cursis collects and processes personal data, uses AI providers, and handles consent, retention and your privacy rights.'),
  alternates: { canonical: 'https://cursis.in/privacy' },
};
