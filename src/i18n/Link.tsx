'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { localizePath, type Locale } from './config';
import { useLocale } from './LocaleProvider';

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'locale'> & {
  /** Link into a specific language instead of the current one. */
  locale?: Locale;
};

/**
 * `next/link`, staying in the reader's language.
 *
 * Every internal href in this codebase is written once, unprefixed — `/work`,
 * `/#about` — and this is the single place that turns it into `/zh/work` for a
 * Chinese reader. Content files and components therefore never need to know
 * which language they are being rendered in, and a link cannot quietly drop
 * someone back into English half way through the site.
 *
 * External URLs, mailto links, bare hashes and files under /public pass through
 * unchanged, so this is a drop-in replacement wherever `next/link` was used.
 */
export function Link({ href, locale, ...props }: LinkProps) {
  const current = useLocale();
  const resolved = typeof href === 'string' ? localizePath(locale ?? current, href) : href;
  return <NextLink href={resolved} {...props} />;
}

export default Link;
