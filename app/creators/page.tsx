import MarketingPage from '@/components/landing/MarketingPage';
import CreatorsSection from '@/components/landing/CreatorsSection';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/creators', 'Team Workspace for Creators & Media Teams', 'Keep ideas, production, reviews and publishing together in a free Cursis workspace for teams of up to 10.');
export default function Creators() { return <MarketingPage title="More creating. Less chasing." intro="Keep your team’s ideas, reviews and next steps together."><CreatorsSection /></MarketingPage>; }
