'use client';
import { Target } from 'lucide-react';
import { useWorkHub } from '@/lib/work-hub/WorkHubContext';

export default function MemberFocusStatus({ userId, fallback = '' }: { userId: string; fallback?: string }) {
  const { snapshot } = useWorkHub();
  const focus = snapshot?.focus.find(session => session.userId === userId);
  if (!focus) return <span>{fallback}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Target size={12} aria-hidden="true" />
      Working on: {focus.taskTitle} (Est. done at {new Date(focus.expectedEndAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})
    </span>
  );
}
