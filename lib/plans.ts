import { isFounderEmail } from '@/lib/auth/founder';
import { MAX_TEAM_MEMBERS, type WorkspaceTier } from '@/lib/db/types';

export type PlanKey = 'free' | 'starter' | 'pro' | 'business';

export interface PlanLimits {
  id: PlanKey;
  name: string;
  subtitle: string;
  priceUsd: number | null; // null = Contact Us / custom quote
  originalPriceUsd?: number;
  recommended?: boolean;
  maxMembers: number;
  maxProjects: number | null; // null = unlimited
  maxTasksPerProject: number | null; // null = unlimited
  hasOrdisAi: boolean;
  hasMyDay: boolean;
  features: string[];
  excludedFeatures?: string[];
}

export const PLAN_CATALOG: Record<PlanKey, PlanLimits> = {
  free: {
    id: 'free',
    name: 'Free Preview',
    subtitle: 'Trial workspace preview before upgrading to Starter or Pro',
    priceUsd: 0,
    maxMembers: MAX_TEAM_MEMBERS, // 4
    maxProjects: 3,
    maxTasksPerProject: 5,
    hasOrdisAi: false,
    hasMyDay: false,
    features: [
      'Up to 4 team members',
      'Up to 3 projects',
      'Up to 5 tasks per project',
      'Tasks, Projects, Calendar, Meetings & Inbox',
      'Documents, CRM, Analytics & Settings',
    ],
    excludedFeatures: ['No access to Ordis AI', 'No access to My Day feature'],
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    subtitle: 'For individuals and small teams',
    priceUsd: 9,
    originalPriceUsd: 19,
    maxMembers: 6,
    maxProjects: 10,
    maxTasksPerProject: 5,
    hasOrdisAi: false,
    hasMyDay: false,
    features: [
      '6 team members',
      '5 tasks per project',
      '10 projects',
      'Full access to Tasks, Calendar, Meetings, Inbox, Documents, CRM & Analytics',
      'Integrations & Workspace Settings',
    ],
    excludedFeatures: ['No access to Ordis AI', 'No access to My Day feature'],
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    subtitle: 'For growing teams and startups',
    priceUsd: 20,
    originalPriceUsd: 39,
    recommended: true,
    maxMembers: 10,
    maxProjects: null,
    maxTasksPerProject: null,
    hasOrdisAi: true,
    hasMyDay: true,
    features: [
      '10 team members',
      'Unlimited tasks',
      'Unlimited projects',
      'Access to Ordis AI',
      'Access to My Day feature & all workspace tools',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    subtitle: 'For established companies and organizations',
    priceUsd: null,
    maxMembers: 100,
    maxProjects: null,
    maxTasksPerProject: null,
    hasOrdisAi: true,
    hasMyDay: true,
    features: [
      'Custom team management solutions',
      'Custom AI agents and workflows',
      'Dedicated Ordis AI configuration',
      'Custom dashboards',
      'Advanced business analytics',
      'Dedicated onboarding',
      'Custom workspace configuration',
      'Dedicated account assistance',
      'Tailored automation solutions',
      'Custom development based on business requirements',
    ],
  },
};

export const PUBLIC_PLANS = [PLAN_CATALOG.starter, PLAN_CATALOG.pro, PLAN_CATALOG.business] as const;

export function resolvePlanKey(tier?: WorkspaceTier | string | null, userEmail?: string | null): PlanKey {
  if (userEmail && isFounderEmail(userEmail)) {
    return 'pro';
  }
  const normalized = String(tier || 'free').trim().toLowerCase();
  if (normalized === 'business') return 'business';
  if (normalized === 'pro' || normalized === 'paid') return 'pro';
  if (normalized === 'starter') return 'starter';
  return 'free';
}

export function getPlanLimits(tier?: WorkspaceTier | string | null, userEmail?: string | null): PlanLimits {
  return PLAN_CATALOG[resolvePlanKey(tier, userEmail)];
}
