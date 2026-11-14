import { MAX_TEAM_MEMBERS } from '@/lib/db/types';

export const BRAND_NAME = 'Cursis';
export const SITE_URL = 'https://cursis.in';
export const SUPPORT_EMAIL = 'cursis.in@gmail.com';
export const TEAM_USER_LIMIT = MAX_TEAM_MEMBERS;
export const FREE_WORKSPACE_TEXT = `Free for up to ${TEAM_USER_LIMIT} people per workspace`;
export const INCLUDED_TOOLS = ['Ordis AI', 'Tasks', 'Projects', 'Team', 'Calendar', 'Video meetings', 'Automatic actions', 'Progress reports'];
export const TWITTER_HANDLE = '@cursis_';
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/cursis.in',
  x: 'https://x.com/cursis_',
  linkedin: 'https://www.linkedin.com/company/cursis/',
  discord: 'https://discord.gg/AnwFKSsA5e',
};
export const SOCIAL_PROFILES = [
  { name: 'Instagram', url: SOCIAL_LINKS.instagram },
  { name: 'X', url: SOCIAL_LINKS.x },
  { name: 'LinkedIn', url: SOCIAL_LINKS.linkedin },
  { name: 'Discord', url: SOCIAL_LINKS.discord },
];
