import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/response';
import { getAgencyServiceCatalog } from '@/lib/db/agency';

export async function GET() {
  try {
    const catalog = await getAgencyServiceCatalog();
    return NextResponse.json({
      agencyHeadline: 'Cursis gives everyone a free AI workplace. If a business needs more, Cursis builds it for them.',
      services: catalog,
    });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to fetch agency service catalog', 500);
  }
}
