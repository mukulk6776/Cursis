import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = { ...marketingMetadata('/signup', 'Start your free workspace', 'Create your free Cursis team workspace for up to 10 users. No credit card required.'), robots: { index: true, follow: true } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
