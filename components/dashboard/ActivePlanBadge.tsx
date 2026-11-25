'use client';

import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
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

  const isProOrBiz = activePlan.plan === 'pro' || activePlan.plan === 'business';
  const padding = size === 'md' ? '4px 10px' : '2px 8px';
  const fontSize = size === 'md' ? '11.5px' : '10.5px';
  const iconSize = size === 'md' ? 12 : 11;

  return (
    <Badge
      data-testid="active-plan-badge"
      variant={isProOrBiz ? 'solid' : 'default'}
      title={
        activePlan.source === 'admin'
          ? `${activePlan.planName} (Admin-assigned${activePlan.expiresAt ? ` · expires ${new Date(activePlan.expiresAt).toLocaleDateString()}` : ''})`
          : `${activePlan.planName} (Purchased)`
      }
      style={{
        padding,
        fontSize,
        fontWeight: 800,
        letterSpacing: '0.03em',
        lineHeight: 1.2,
        border: '1.5px solid #0A0A0A',
        boxShadow: '2px 2px 0px #0A0A0A',
        background: isProOrBiz ? '#FF5500' : '#FFC233',
        color: isProOrBiz ? '#FFFFFF' : '#0A0A0A',
      }}
    >
      {isProOrBiz ? <Crown size={iconSize} aria-hidden="true" /> : <Sparkles size={iconSize} aria-hidden="true" />}
      {activePlan.planName}
    </Badge>
  );
}
