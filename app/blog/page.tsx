import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { getPosts } from '@/lib/seo/blog';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/blog', 'Teamwork notes from Cursis', 'Practical draft guides to workload balancing, agency project management and catching delayed tasks.');
export default function Blog() { return <MarketingPage title="Less chase. More clarity." intro="Practical notes for small teams. These starter articles are drafts awaiting editorial review."><div className="marketing-grid">{getPosts().map(post => <article className="marketing-card" key={post.slug}><p className="lp-section-label">Draft · Editorial review pending</p><h2><Link href={'/blog/' + post.slug}>{post.title}</Link></h2><p>{post.description}</p><Link href={'/blog/' + post.slug}>Read draft →</Link></article>)}</div></MarketingPage>; }
