type Testimonial = { name: string; quote: string; approved: boolean };
// Populate only with real, permissioned customer quotes. Never seed with demo entries.
const testimonials: Testimonial[] = [];
export default function Testimonials() {
  const real = testimonials.filter(item => item.approved);
  if (process.env.NEXT_PUBLIC_ENABLE_TESTIMONIALS !== 'true' || real.length < 3) return null;
  return <section aria-label="Customer feedback">{real.map(item => <figure key={item.name}><blockquote>{item.quote}</blockquote><figcaption>{item.name}</figcaption></figure>)}</section>;
}
