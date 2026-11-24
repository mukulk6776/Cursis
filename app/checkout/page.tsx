import { redirect } from 'next/navigation';

export default async function CheckoutRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const queryString = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') {
      queryString.set(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      queryString.set(key, value[0]);
    }
  });

  const query = queryString.toString();
  redirect(query ? `/pay?${query}` : '/pay');
}
