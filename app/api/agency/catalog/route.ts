import { NextResponse } from 'next/server';
import { getAgencyServiceCatalog } from '@/lib/db/agency';

export async function GET() {
  try {
    const catalog = await getAgencyServiceCatalog();
    return NextResponse.json({
      agencyHeadline: 'Cursis gives everyone a free AI workplace. If a business needs more, Cursis builds it for them.',
      services: catalog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
