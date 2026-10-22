import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarketingPage from '@/components/landing/MarketingPage';
import { getPosts } from '@/lib/seo/blog';
import { marketingMetadata } from '@/lib/seo/marketing';
export function generateStaticParams() { return getPosts().map(post => ({slug: post.slug})); }
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) { const {slug} = await params; const post = getPosts().find(p => p.slug === slug); return post ? {...marketingMetadata('/blog/' + slug, post.title, post.description), robots: {index: true, follow: true}} : {}; }
export default async function Post({params}: {params: Promise<{slug: string}>}) {
 const {slug} = await params; const posts = getPosts(); const post = posts.find(p => p.slug === slug); if (!post) notFound();
 const schema = {'@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.description, author: {'@type': 'Organization', name: 'Cursis', url: 'https://cursis.in/about'}, publisher: {'@type': 'Organization', name: 'Cursis'}, image: 'https://cursis.in/marketing-og.png', mainEntityOfPage: 'https://cursis.in/blog/' + slug, creativeWorkStatus: 'Published'};
 return <MarketingPage title={post.title} intro={post.description}><article className="marketing-card marketing-prose">{post.body.replace(/^(## .+)\n/gm, '$1\n\n').split('\n\n').map((block, i) => block.startsWith('## ') ? <h2 key={i}>{block.slice(3)}</h2> : <p key={i}>{block}</p>)}</article><aside><h2>Keep reading</h2>{posts.filter(p => p.slug !== slug).map(p => <p key={p.slug}><Link href={'/blog/' + p.slug}>{p.title}</Link></p>)}</aside><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g, '\\u003c')}} /></MarketingPage>;
}
