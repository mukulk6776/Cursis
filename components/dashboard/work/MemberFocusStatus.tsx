'use client';
import { useWorkHub } from '@/lib/work-hub/WorkHubContext';

export default function MemberFocusStatus({ userId, fallback = '' }: { userId: string; fallback?: string }) {
  const { snapshot } = useWorkHub();
  const focus = snapshot?.focus.find(session => session.userId === userId);
  return <span>{focus ? `🎯 Working on: ${focus.taskTitle} (Est. done at ${new Date(focus.expectedEndAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})` : fallback}</span>;
}
