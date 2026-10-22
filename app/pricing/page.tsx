import Link from 'next/link';
import MarketingPage, { FaqList } from '@/components/landing/MarketingPage';
import { marketingMetadata, marketingFaqs } from '@/lib/seo/marketing';
import { FREE_WORKSPACE_TEXT, INCLUDED_TOOLS } from '@/lib/site';
export const metadata = marketingMetadata('/pricing', 'Pricing — Free Team Workspace', FREE_WORKSPACE_TEXT + '. All tools included. No paid plans, no trials, no credit card.');
export default function Pricing() {
  return <MarketingPage title={FREE_WORKSPACE_TEXT} intro="Completely free. No credit card. No paid plans or trials.">
    <section className="marketing-card"><h2>All your team’s tools, included.</h2><ul>{INCLUDED_TOOLS.map(tool => <li key={tool}>{tool}</li>)}</ul><p>{FREE_WORKSPACE_TEXT}. Nothing is charged.</p><Link href="/signup" className="btn btn-primary">Make my free workspace</Link></section>
    <h2>Good questions, clear answers.</h2><FaqList items={marketingFaqs.slice(0, 4)} />
  </MarketingPage>;
}
