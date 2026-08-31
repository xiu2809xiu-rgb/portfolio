import type { Link } from './types';

export const primaryNav: readonly Link[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Work', href: '/work' },
  { label: 'Blog', href: '/blog' },
  { label: 'Uses', href: '/uses' },
  { label: 'Contact', href: '/#contact' },
];

export const footerNav: readonly Link[] = [
  { label: 'Work', href: '/work' },
  { label: 'Blog', href: '/blog' },
  { label: 'Uses', href: '/uses' },
  { label: 'Book me', href: '/book' },
  { label: 'Résumé', href: '/docs/Resume_Richie_Koh.pdf', external: true },
];

/**
 * The two pages that are not part of the portfolio proper.
 *
 * Kept out of `footerNav` and out of the header on purpose: someone arriving to
 * read a CV should meet the CV. These are for people who scroll to the bottom
 * and poke about, which is exactly the audience they are for.
 */
export const asideNav: readonly Link[] = [
  { label: 'Take the car out', href: '/drive' },
  { label: 'The pitch', href: '/pitch' },
];
