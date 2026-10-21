import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = { ...marketingMetadata('/signup', 'Sign Up — Create Your Free Team Workspace', 'Create your Cursis team workspace. No credit card required.'), robots: { index: true, follow: true } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
