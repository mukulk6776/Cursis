import Link from 'next/link';
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
            <Link className="blog-card-link" href={'/blog/' + post.slug} aria-label={'Read article: ' + post.title}>Read article <span aria-hidden="true">↗</span></Link>
          </article>
        ))}
      </div>
    </MarketingPage>
  );
}
