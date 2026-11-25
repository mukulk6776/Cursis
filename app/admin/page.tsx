export const dynamic = 'force-dynamic';

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAdminContext } from '@/lib/auth/admin-guard';
import AdminConsole from '@/components/admin/AdminConsole';

export default async function AdminPage() {
  const ctx = await getServerAdminContext();

  if (ctx.status === 'unauthenticated') {
    redirect('/login?redirect=/admin');
  }
  if (ctx.status === 'forbidden') {
    redirect('/dashboard');
  }

  return (
    <AdminConsole
      currentAdmin={{
        uid: ctx.adminUser.uid,
        email: ctx.adminUser.email,
        displayName: ctx.adminUser.displayName,
      }}
    />
  );
}
