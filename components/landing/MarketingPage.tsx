import Link from 'next/link';
import LandingNav from './LandingNav';
import Footer from './Footer';
import CtaSection from './CtaSection';
import '@/styles/landing.css';

export default function MarketingPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <div className="lp-body"><LandingNav /><main id="main-content" className="marketing-main"><header className="lp-section-header"><p className="lp-section-label">Cursis / Team workspace</p><h1 className="lp-section-title">{title}</h1><p className="lp-section-subtitle">{intro}</p></header>{children}<p className="marketing-links"><Link href="/faq">Questions? Read the FAQ</Link> · <Link href="/contact">Talk to the team</Link></p></main><CtaSection /><Footer /></div>;
}

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return <div className="marketing-faq">{items.map(item => <details id={item.question.startsWith("What is included") ? "included-tools" : item.question.startsWith("How does Ordis") ? "ordis-data" : undefined} key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>;
}
