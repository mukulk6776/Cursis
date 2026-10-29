import Link from 'next/link';
import MarketingPage, { FaqList } from '@/components/landing/MarketingPage';
import { marketingMetadata, marketingFaqs } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/faq', 'FAQ — Before You Join', 'Practical answers about joining a Cursis workspace, working with a larger team, privacy and account closure.');
export default function Faq() {
  return <MarketingPage title="Before you join." intro="A few practical answers to help you get started." nextStep="Have what you need?">
    <FaqList items={marketingFaqs} /><div className="marketing-link-list"><Link className="marketing-link" href="/pricing">Plans</Link><Link className="marketing-link" href="/privacy">Read the Privacy Notice</Link><Link className="marketing-link" href="/contact">Ask another question</Link></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: marketingFaqs.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }).replace(/</g, '\\u003c') }} />
  </MarketingPage>;
}
