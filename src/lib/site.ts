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
    'Full-stack developer and UX designer at Nanyang Polytechnic. First place at the NYP × AWS Hackathon 2026. Case studies, writing, and a calendar you can book directly. Seeking a 2027 software engineering internship in Singapore.',
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
    'full-stack developer',
    'UX design',
    'software engineering internship',
    'SmartRecap',
  ],
} as const;

export const absoluteUrl = (path = '/') =>
  `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
