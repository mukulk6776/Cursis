'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function WorkspaceFooterLink() {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => { let active = true; fetch('/api/auth/session', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(data => { if (active) setAuthenticated(Boolean(data?.user || data?.data?.user)); }).catch(() => {}); return () => { active = false; }; }, []);
  return <Link prefetch={false} href={authenticated ? '/dashboard' : '/login'} className="lp-footer-link">{authenticated ? 'Open Workspace' : 'Sign In'}</Link>;
}
