import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/creators', 'For Creators — Keep Reviews Moving', 'A clear brief, a named reviewer and the latest file: give creative work a clear path to approval in Cursis.');
export default function Creators() {
  return <MarketingPage title="Make the next review easier." intro="Give creative work a clear path from brief to approval." nextStep="Bring your next brief">
    <article className="marketing-card"><h2>Keep the decision beside the work</h2><p>Put the brief and latest file on the task. Name the person reviewing it and say what needs a decision. Keep the approval notes there so the next person can continue.</p><Link className="marketing-link" href="/blog/agency-project-management">Read the guide to briefs and handoffs</Link></article>
  </MarketingPage>;
}
