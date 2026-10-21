import MarketingPage, { FaqList } from '@/components/landing/MarketingPage';
import { marketingMetadata, marketingFaqs } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/faq', 'FAQs — Workspace, Ordis AI & Privacy', 'Answers about the free Cursis workspace, up to 10 users, Ordis AI, privacy, migration, meetings and account deletion.');
export default function Faq() {
  return <MarketingPage title="A little clarity before you start." intro="Answers to common questions about Cursis."><FaqList items={marketingFaqs} /><p><a href="/privacy">Privacy Notice</a> · <a href="/privacy/rights">Privacy Centre</a></p><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: marketingFaqs.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }) }} /></MarketingPage>;
}
