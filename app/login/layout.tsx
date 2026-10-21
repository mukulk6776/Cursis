import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = { ...marketingMetadata('/login', 'Sign In to Your Team Workspace', 'Sign in to Cursis to access your team’s tasks, projects, messages, video meetings and Ordis AI in one shared workspace.'), robots: { index: true, follow: true } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
