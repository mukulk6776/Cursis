import Link from 'next/link';
import WorkspaceFooterLink from './WorkspaceFooterLink';
import CookiePreferenceButton from '@/components/CookiePreferenceButton';

const groups = [
  { title: 'Explore', links: [['/#features', 'Why Cursis'], ['/#ordis', 'Try Ordis'], ['/pricing', 'Free plan'], ['/compare', 'Compare'], ['/faq', 'FAQ']] },
  { title: 'People & ideas', links: [['/about', 'About'], ['/creators', 'For creators'], ['/blog', 'Blog'], ['/changelog', 'Changelog'], ['/social', 'Community'], ['/contact', 'Contact']] },
  { title: 'Legal', links: [['/privacy', 'Privacy Notice'], ['/privacy/rights', 'Privacy Centre'], ['/terms', 'Terms'], ['/refund-policy', 'Refund & cancellation'], ['/cookie-policy', 'Cookies'], ['/data-deletion', 'Data deletion'], ['/dmca', 'Copyright']] },
];
export default function Footer() {
  return <footer className="lp-footer"><div className="lp-footer-inner">
    <div className="lp-footer-brand"><Link href="/" className="lp-footer-logo" aria-label="Cursis home"><svg viewBox="0 0 1024 1024" fill="none" width="28" height="28" aria-hidden="true"><path d="M 545 240 A 282 282 0 1 0 782 566" stroke="#0A0A0A" strokeWidth="142" strokeLinecap="round" /><rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" /></svg><span className="lp-footer-logo-text">Cursis</span></Link><WorkspaceFooterLink /></div>
    <div className="lp-footer-links-group">{groups.map(group => <nav className="lp-footer-col" key={group.title} aria-label={group.title}><h2 className="lp-footer-col-title">{group.title}</h2>{group.links.map(([href, label]) => <Link prefetch={false} key={href} href={href} className="lp-footer-link">{label}</Link>)}</nav>)}</div>
  </div><div className="lp-footer-bottom"><span>© 2026 Cursis</span><CookiePreferenceButton className="lp-footer-cookie" /></div></footer>;
}
