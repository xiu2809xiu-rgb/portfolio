import type { Link } from '../types';

/*
  Navigation, in Chinese. Every href is the same canonical, unprefixed path the
  English file uses — `@/i18n/Link` adds `/zh` where it belongs, so nothing here
  needs to know which language it is being rendered in.
*/

export const primaryNav: readonly Link[] = [
  { label: '首页', href: '/' },
  { label: '关于', href: '/#about' },
  { label: '作品', href: '/work' },
  { label: '博客', href: '/blog' },
  { label: '工具', href: '/uses' },
  { label: '联系', href: '/#contact' },
];

export const footerNav: readonly Link[] = [
  { label: '作品', href: '/work' },
  { label: '博客', href: '/blog' },
  { label: '工具', href: '/uses' },
  { label: '预约', href: '/book' },
  { label: '简历', href: '/docs/Resume_Richie_Koh.pdf', external: true },
];

/** The two pages that are not part of the portfolio proper. */
export const asideNav: readonly Link[] = [
  { label: '开车兜风', href: '/drive' },
  { label: '毛遂自荐', href: '/pitch' },
];
