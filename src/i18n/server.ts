import { notFound } from 'next/navigation';
import { lang } from 'next/root-params';
import type { Metadata } from 'next';
import { defaultLocale, htmlLang, isLocale, localizePath, type Locale } from './config';
import { commonDict } from './dictionaries/common';

/**
 * The current language, for Server Components.
 *
 * `next/root-params` exposes the `[lang]` segment to any Server Component
 * without it being passed down as a prop, which is what lets a section five
 * levels deep ask what language it is in. It does not work in Route Handlers,
 * image routes or Server Actions — those receive `params` and should use that.
 *
 * An unknown value 404s here rather than in the layout. Thrown from a page, the
 * error is caught by `[lang]/not-found.tsx` and rendered inside the site's own
 * chrome; thrown from the root layout there would be nothing above it to catch.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/**
 * The current language, falling back to English instead of 404ing.
 *
 * For the not-found page itself, which is what an unknown language ends up
 * rendering — throwing `notFound()` from inside it would have nowhere to go.
 */
export async function getLocaleOrDefault(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : defaultLocale;
}

/** The current language's side of a `{ en, zh }` pair. */
export async function getT<T>(dictionary: Record<Locale, T>): Promise<T> {
  return dictionary[await getLocale()];
}

/**
 * Head tags for a page that turned out not to exist.
 *
 * Used by `not-found.tsx`, and also by any page that can call `notFound()`.
 * The second part is not redundant: the server answers a 404 with the
 * not-found page's own head, but the body is then drawn by the client from the
 * *page's* data — and the page's metadata replaces what the server sent. A page
 * that returns nothing here ends up titled as if it were the home page.
 */
export function notFoundMetadata(locale: Locale): Metadata {
  const t = commonDict[locale].notFound;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: true },
  };
}

/**
 * Canonical URL and hreflang alternates for a page.
 *
 * `path` is the unprefixed path (`/work/smartrecap`). Each language's page is
 * canonical for itself and names the other as an alternate; `x-default` points
 * at English, which is what a reader with neither preference should get.
 */
export function localizedAlternates(locale: Locale, path: string): NonNullable<Metadata['alternates']> {
  return {
    canonical: localizePath(locale, path),
    languages: {
      [htmlLang.en]: localizePath('en', path),
      [htmlLang.zh]: localizePath('zh', path),
      'x-default': localizePath(defaultLocale, path),
    },
  };
}
