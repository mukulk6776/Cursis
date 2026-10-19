import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = { ...marketingMetadata('/login', 'Sign In', 'Sign in to your Cursis team workspace.'), robots: { index: true, follow: true } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
