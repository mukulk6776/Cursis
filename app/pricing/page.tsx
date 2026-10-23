import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { marketingMetadata } from '@/lib/seo/marketing';
import { TEAM_USER_LIMIT } from '@/lib/site';
export const metadata = marketingMetadata('/pricing', 'Free Plan — No Subscription', 'The Cursis workspace costs nothing for teams of up to 10. No paid tier, trial deadline or payment details.');
export default function Pricing() {
  return <MarketingPage title="One plan. Nothing to pay." intro="No subscription to manage and no trial countdown." nextStep="Start without a billing step">
    <section className="marketing-card marketing-free-plan" aria-labelledby="free-plan-heading"><p className="marketing-price">₹0</p><h2 id="free-plan-heading">For a team of up to {TEAM_USER_LIMIT}</h2><p>Every workspace tool is included. You will not be asked for payment details.</p><p>Need more seats? Keep each workspace within the limit. <Link href="/contact">Ask us about your team’s needs</Link>.</p><p><Link className="marketing-link" href="/refund-policy">Account closure and refund information</Link></p></section>
  </MarketingPage>;
}
