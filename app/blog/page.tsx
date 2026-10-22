import Link from 'next/link';
import MarketingPage from '@/components/landing/MarketingPage';
import { getPosts } from '@/lib/seo/blog';
import { marketingMetadata } from '@/lib/seo/marketing';
export const metadata = marketingMetadata('/blog', 'Cursis Blog — Teamwork & Project Management', 'Practical guides to workload balancing, agency project management and catching delayed tasks.');
export default function Blog() {
  return (
    <MarketingPage title="Less chase. More clarity." intro="Practical notes for small teams.">
      <div className="marketing-grid blog-grid">
        {getPosts().map(post => (
          <article className="marketing-card" key={post.slug}>
            <h2><Link href={'/blog/' + post.slug}>{post.title}</Link></h2>
            <p className="blog-card-description">{post.description}</p>
            <Link className="blog-card-link" href={'/blog/' + post.slug} aria-label={'Read article: ' + post.title}>Read article <span aria-hidden="true">↗</span></Link>
          </article>
        ))}
      </div>
    </MarketingPage>
  );
}
