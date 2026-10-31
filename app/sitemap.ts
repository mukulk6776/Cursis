import { getPosts } from '@/lib/seo/blog';
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap { return ["","about","creators","social","signup","login","pricing","faq","contact","blog","compare","changelog","privacy","terms","cookie-policy","cancellation-policy","data-deletion","privacy/rights","dmca"].concat(getPosts().filter(post => !post.draft).map(post => 'blog/' + post.slug)).map(path => ({url: SITE_URL + '/' + path, changeFrequency: 'monthly' as const, priority: path ? 0.6 : 1})); }
