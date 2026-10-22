import { FREE_WORKSPACE_TEXT } from '@/lib/site';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = { ...marketingMetadata('/signup', 'Sign Up — Create Your Free Team Workspace', FREE_WORKSPACE_TEXT + '. All tools included. No credit card required.'), robots: { index: true, follow: true } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
