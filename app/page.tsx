import LandingPage from '@/components/landing/LandingPage';
import { marketingMetadata, socialProfiles } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('', 'Cursis – Team Workspace with AI Task & Workload Management', 'Your free team workspace for tasks, projects, chat and meetings. Ordis AI helps catch delayed tasks and share work. Free for teams of up to 10.');
// TODO_CONFIRM_WITH_FOUNDER: Set SCHEMA_OFFER_CURRENCY to the confirmed ISO currency.
const currency = process.env.SCHEMA_OFFER_CURRENCY;
const schema = { '@context': 'https://schema.org', '@graph': [
 { '@type': 'Organization', '@id': 'https://cursis.in/#organization', name: 'Cursis', url: 'https://cursis.in', logo: 'https://cursis.in/icon.png', sameAs: socialProfiles.map(p => p.url) },
 { '@type': 'WebSite', name: 'Cursis', url: 'https://cursis.in', publisher: { '@id': 'https://cursis.in/#organization' } },
 { '@type': 'SoftwareApplication', name: 'Cursis', operatingSystem: 'Web', applicationCategory: 'BusinessApplication', url: 'https://cursis.in', offers: { '@type': 'Offer', price: '0', ...(currency && /^[A-Z]{3}$/.test(currency) ? { priceCurrency: currency } : {}) }, author: { '@id': 'https://cursis.in/#organization' } }
] };
export default function MainPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g, '\\u003c')}} /><LandingPage /></>; }
