'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ActivePlanSummary } from '@/lib/dashboard/types';

interface ActivePlanBadgeProps {
  activePlan?: ActivePlanSummary | null;
  size?: 'sm' | 'md';
}

/**
 * Renders the user's active plan name only when an active purchased or admin-assigned plan exists.
 * Returns null when the user has no active plan, or when revoked/expired (no Free placeholder).
 */
export default function ActivePlanBadge({ activePlan, size = 'sm' }: ActivePlanBadgeProps) {
  if (!activePlan || activePlan.status !== 'active' || !activePlan.planName) {
    return null;
  }

  if (activePlan.expiresAt) {
    const exp = Date.parse(activePlan.expiresAt);
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      return null;
    }
  }

  const padding = size === 'md' ? '4px 10px' : '2px 8px';
  const fontSize = size === 'md' ? '11.5px' : '10.5px';

  return (
    <Badge
      data-testid="active-plan-badge"
      variant="secondary"
      title={
        activePlan.source === 'admin'
          ? `${activePlan.planName} (Admin-assigned${activePlan.expiresAt ? ` · expires ${new Date(activePlan.expiresAt).toLocaleDateString()}` : ''})`
          : `${activePlan.planName} (Purchased)`
      }
      style={{
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        border: '1px solid var(--border-color)',
        background: 'var(--c-bg-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      {activePlan.planName}
    </Badge>
  );
}
