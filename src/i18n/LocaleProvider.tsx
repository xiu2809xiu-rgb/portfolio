'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { defaultLocale, localizePath, stripLocale, type Locale } from './config';

/**
 * The current language, for client components.
 *
 * Set once by the root layout from the `[lang]` route segment. It is never read
 * from the address bar: English pages are reached through a rewrite, so the URL
 * a browser shows (`/work`) and the path the page was prerendered at
 * (`/en/work`) are different strings, and anything derived from the URL would
 * render one thing on the server and another while hydrating.
 */
const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export const useLocale = (): Locale => useContext(LocaleContext);

/**
 * Picks the current language's side of a `{ en, zh }` pair.
 *
 * Dictionaries are plain modules imported by whichever component needs them,
 * rather than one object handed down from the layout. That keeps each page's
 * bundle to the strings it actually renders, and lets a dictionary hold
 * functions — `(n, total) => …` — which could not cross from server to client
 * as a prop.
 */
export function useT<T>(dictionary: Record<Locale, T>): T {
  return dictionary[useLocale()];
}

/** `localizePath` bound to the current language. */
export function useLocalizePath(): (href: string) => string {
  const locale = useLocale();
  return useCallback((href: string) => localizePath(locale, href), [locale]);
}

/**
 * The pathname with any locale prefix removed.
 *
 * Use this instead of `usePathname()` for anything that affects what is
 * rendered — an active nav link, a branch on the current route. The raw
 * pathname is `/en/work` during prerender and `/work` in the browser; this
 * returns `/work` for both, so the two renders agree.
 */
export function useBarePathname(): string {
  return stripLocale(usePathname());
}
