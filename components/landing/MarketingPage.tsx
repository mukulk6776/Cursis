import Link from 'next/link';
import LandingNav from './LandingNav';
import Footer from './Footer';
import '@/styles/landing.css';

export default function MarketingPage({ title, intro, children, nextStep = 'Put it into practice' }: { title: string; intro: string; children: React.ReactNode; nextStep?: string }) {
  return <div className="lp-body"><LandingNav /><main id="main-content" className="marketing-main" tabIndex={-1}>
    <header className="lp-section-header"><h1 className="lp-section-title">{title}</h1><p className="lp-section-subtitle">{intro}</p></header>
    {children}
    <div className="marketing-next"><h2>{nextStep}</h2><Link prefetch={false} href="/signup" className="btn btn-primary">Make my workspace <span aria-hidden="true">→</span></Link></div>
  </main><Footer /></div>;
}
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return <div className="marketing-faq">{items.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>;
}
