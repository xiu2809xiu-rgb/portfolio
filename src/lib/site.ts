import { profile } from '@/content/profile';

/**
 * Canonical site URL.
 *
 * Prefers an explicit value, then Vercel's per-deploy host so preview builds get
 * correct absolute URLs in their metadata, then localhost for `next dev`.
 */
export const siteUrl = (() => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
})();

export const siteConfig = {
  name: `${profile.fullName} — ${profile.role}`,
  shortName: profile.fullName,
  description:
    'IT student at Nanyang Polytechnic building user-centric web experiences with Python, Flask, and TypeScript. Case studies, writing, and a calendar you can book directly.',
  url: siteUrl,
  locale: 'en_SG',
  keywords: [
    'Richie Koh',
    'Koh Shan Shun',
    'software developer portfolio',
    'Nanyang Polytechnic',
    'Singapore developer',
    'Flask developer',
    'Next.js portfolio',
  ],
} as const;

export const absoluteUrl = (path = '/') =>
  `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
