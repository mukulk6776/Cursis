export const dynamic = 'force-dynamic';

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAdminContext } from '@/lib/auth/admin-guard';

/**
 * Server-side route guard for all /admin/* routes.
 * Blocks unauthenticated users and non-admins before any admin HTML/UI is rendered.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getServerAdminContext();

  if (ctx.status === 'unauthenticated') {
    redirect('/login?redirect=/admin');
  }

  if (ctx.status === 'forbidden') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
