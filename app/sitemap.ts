import { getPosts } from '@/lib/seo/blog';
import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { return ["","about","social","signup","login","pricing","faq","contact","blog","compare","creators","privacy","terms","cookie-policy","refund-policy","dmca"].concat(getPosts().filter(post => !post.draft).map(post => 'blog/' + post.slug)).map(path => ({url: 'https://cursis.in/' + path, changeFrequency: 'monthly' as const, priority: path ? 0.6 : 1})); }
