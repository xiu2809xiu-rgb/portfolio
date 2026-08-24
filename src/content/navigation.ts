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
