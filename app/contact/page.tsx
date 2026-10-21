import MarketingPage from '@/components/landing/MarketingPage';
import MarketingForm from '@/components/landing/MarketingForm';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/contact', 'Contact Cursis — Support & Feedback', 'Send Cursis a question, get support or share feedback about your free team workspace.');
export default function Contact() { return <MarketingPage title="Let’s make teamwork easier." intro="Questions, ideas or something getting in your way? Tell us."><section className="marketing-card"><h2>Send the team a message</h2><MarketingForm kind="contact" /><p>Prefer email? <a href="mailto:cursis.in@gmail.com">cursis.in@gmail.com</a></p></section></MarketingPage>; }
