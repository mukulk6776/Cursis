import { FREE_WORKSPACE_TEXT } from '@/lib/site';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/about', 'About Cursis — Built for Better Teamwork', 'Meet the people building Cursis. ' + FREE_WORKSPACE_TEXT + ', with Ordis AI to help catch delays and share work.');
export default function Layout({children}: {children: React.ReactNode}) { return children; }
