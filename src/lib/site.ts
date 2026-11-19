import { profileContent } from '@/content/localized/profile';
import { ogLocale, type Locale } from '@/i18n/config';
import { commonDict } from '@/i18n/dictionaries/common';

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

/**
 * Site-level metadata, in the reader's language.
 *
 * A function of the locale rather than a constant: the name, description and
 * keywords all appear in the document head, and a Chinese page announcing
 * itself to a search engine in English would be indexed as the wrong thing.
 */
export function getSiteConfig(locale: Locale) {
  const { profile } = profileContent[locale];
  const t = commonDict[locale].site;

  return {
    name: t.name(profile.fullName, profile.role),
    shortName: profile.fullName,
    description: t.description,
    url: siteUrl,
    locale: ogLocale[locale],
    keywords: t.keywords,
    rssTitle: t.rssTitle(profile.fullName),
  };
}

export const absoluteUrl = (path = '/') =>
  `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
