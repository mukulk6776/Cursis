import { SUPPORT_EMAIL } from '@/lib/site';
import MarketingPage from '@/components/landing/MarketingPage';
import MarketingForm from '@/components/landing/MarketingForm';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/contact', 'Contact — Ask the Cursis Team', 'Send a support question or product suggestion directly to the people building Cursis.');
export default function Contact() {
  return <MarketingPage title="Ask the team." intro="Tell us what you need help with, or what you wish worked differently." nextStep="Ready to try it yourself?">
    <div className="marketing-card"><MarketingForm kind="contact" /><p>Prefer email? <a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a></p></div>
  </MarketingPage>;
}
