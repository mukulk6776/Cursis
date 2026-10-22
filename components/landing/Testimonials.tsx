import { testimonials } from '@/content/testimonials';
export default function Testimonials() {
  const real = testimonials.filter(item => item.approved);
  if (real.length === 0) return null;
  return <section aria-label="Customer feedback">{real.map(item => <figure key={item.name}><blockquote>{item.quote}</blockquote><figcaption>{item.name}</figcaption></figure>)}</section>;
}
