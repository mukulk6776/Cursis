import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import MarketingPage from '@/components/landing/MarketingPage';
import { getPosts } from '@/lib/seo/blog';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/blog', 'Cursis Blog — Teamwork & Project Management', 'Practical guides to workload balancing, agency project management and catching delayed tasks.');
export default function Blog() {
  return (
    <MarketingPage title="Good habits for a working week." intro="Short guides you can put to use today." nextStep="Take one idea into your next project">
      <div className="marketing-grid blog-grid">
        {getPosts().map(post => (
          <article className="marketing-card" key={post.slug}>
            <h2><Link href={'/blog/' + post.slug}>{post.title}</Link></h2>
            <Link className="blog-card-link" href={'/blog/' + post.slug} aria-label={'Read article: ' + post.title} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Read article <ArrowUpRight size={14} aria-hidden="true" /></Link>
          </article>
        ))}
      </div>
    </MarketingPage>
  );
}
