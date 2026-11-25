import { redirect } from 'next/navigation';

export default async function CheckoutRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value) && value.length > 0) query.set(key, value[0]);
  });

  const qs = query.toString();
  redirect(qs ? `/pay?${qs}` : '/pay');
}
