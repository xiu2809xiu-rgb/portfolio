/**
 * Locales, and the one rule about URLs.
 *
 * English is the default and lives at the URLs it has always had: `/work`,
 * `/blog/…`. Chinese lives under `/zh`. Nothing that was ever linked, printed on
 * a résumé or cached by a search engine moves, and Chinese is something a reader
 * chooses rather than something the site decides for them.
 *
 * Internally every page sits under `app/[lang]`. `next.config.ts` rewrites an
 * unprefixed path to `/en/…`, so the English tree is reached without the prefix
 * ever appearing in the address bar.
 *
 * This file is safe to import from anywhere — server, client or config — and
 * deliberately imports nothing itself.
 */

export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

/**
 * BCP 47 tags, for `<html lang>` and `hreflang`.
 *
 * `zh-Hans`, not bare `zh`: the script subtag is what tells a browser to pick
 * Simplified glyph shapes. Without it, a machine whose first CJK font is
 * Japanese will render shared Han characters with Japanese forms, which reads
 * as subtly wrong to anyone who knows the difference.
 */
export const htmlLang: Record<Locale, string> = { en: 'en', zh: 'zh-Hans' };

/** Open Graph wants language_TERRITORY and has no entry for Singapore Chinese. */
export const ogLocale: Record<Locale, string> = { en: 'en_SG', zh: 'zh_CN' };

/** For `Intl` and `toLocaleDateString`. Singapore conventions in both. */
export const intlLocale: Record<Locale, string> = { en: 'en-SG', zh: 'zh-SG' };

/**
 * A Chinese calendar date as this site writes it: `2026 年 11 月 20 日`.
 *
 * Written out by hand instead of asking `Intl`, for two reasons. `Intl` sets the
 * date solid — 2026年11月20日 — while every sentence on the Chinese site puts a
 * thin gap between Han characters and digits, so a formatted date would be the
 * one piece of text breaking the page's own rule. And `Intl` output belongs to
 * whichever engine runs it: a date rendered on the server and again in a browser
 * with different locale data is a hydration mismatch waiting for the right
 * visitor. Three numbers and three characters cannot disagree with themselves.
 *
 * A part left out is skipped: `{ year, month }` gives `2026 年 11 月`.
 */
export function chineseDate(parts: { year?: number; month: number; day?: number }): string {
  return [
    parts.year === undefined ? '' : `${parts.year} 年`,
    `${parts.month} 月`,
    parts.day === undefined ? '' : `${parts.day} 日`,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Each language named in itself — the only honest label for a switcher. */
export const localeLabel: Record<Locale, string> = { en: 'English', zh: '中文' };

/** Picks one side of a `{ en, zh }` pair. */
export const pick = <T>(dictionary: Record<Locale, T>, locale: Locale): T => dictionary[locale];

/*
  Everything under these is a file in /public or an API route. It has no
  language, so it is never prefixed — `/zh/docs/Resume.pdf` does not exist.
*/
const UNLOCALISED = /^\/(?:api|audio|docs|img|models|video|_next|_vercel)(?:\/|$)/;
const UNLOCALISED_FILES = new Set([
  '/icon.svg',
  '/favicon.ico',
  '/apple-icon.png',
  '/robots.txt',
  '/sitemap.xml',
]);

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join('|')})(?=/|$|[?#])`);

/** `/zh/work` → `/work`, `/en` → `/`, `/zhang` → `/zhang`. */
export function stripLocale(pathname: string): string {
  const bare = pathname.replace(LOCALE_PREFIX, '');
  if (bare === '') return '/';
  return bare.startsWith('/') ? bare : `/${bare}`;
}

/**
 * The same destination, in the given language.
 *
 * Takes the canonical unprefixed path — which is how every href in the content
 * files is written — and returns what should go in the address bar. Anything
 * that is not an internal page (an external URL, a mailto, a bare `#hash`, a
 * file) comes back untouched, so this is safe to call on any href at all.
 */
export function localizePath(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;

  const bare = stripLocale(href);
  const pathOnly = bare.split(/[?#]/)[0];
  if (UNLOCALISED.test(pathOnly) || UNLOCALISED_FILES.has(pathOnly)) return bare;
  if (locale === defaultLocale) return bare;

  /* `/#about` becomes `/zh#about`, not `/zh/#about`. */
  return bare === '/' || /^\/[?#]/.test(bare) ? `/${locale}${bare.slice(1)}` : `/${locale}${bare}`;
}
