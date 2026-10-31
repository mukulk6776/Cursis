import { GET as getOverview } from '@/app/api/dashboards/overview/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return getOverview(request);
}

