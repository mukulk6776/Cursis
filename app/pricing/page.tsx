import MarketingPage, { FaqList } from '@/components/landing/MarketingPage';
import { marketingMetadata, marketingFaqs } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/pricing', 'Free for your whole team', 'Cursis is 100% free for teams of up to 10. All tools included, no paid plans and no credit card required.');
export default function Pricing() {
  return <MarketingPage title="Free for your whole team" intro="100% free. No credit card. Each team workspace supports up to 10 users."><section className="marketing-card"><p className="lp-section-label">Everything included</p><h2>One workspace. All your team’s tools.</h2><ul>{['Ordis AI', 'Tasks and projects', 'Calendar and video meetings', 'Automatic actions', 'Progress reports'].map(tool => <li key={tool}>{tool}</li>)}</ul><p>There are no paid plans.</p></section><h2>Good questions, clear answers.</h2><FaqList items={marketingFaqs.slice(0, 3)} /></MarketingPage>;
}
