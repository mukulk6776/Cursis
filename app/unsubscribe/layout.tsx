import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = { ...marketingMetadata('/unsubscribe', 'Email preferences', 'Manage Cursis product update email preferences.'), robots: { index: false, follow: true } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
