'use client';

import { Languages } from 'lucide-react';
import { htmlLang, type Locale } from '@/i18n/config';
import { commonDict } from '@/i18n/dictionaries/common';
import { Link } from '@/i18n/Link';
import { useBarePathname, useLocale, useT } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

/**
 * Switches between English and Chinese, staying on the same page.
 *
 * A real link rather than a button with a handler: `/work` and `/zh/work` are
 * two addresses for the same page, so the switch is navigation and should
 * behave like it — middle-click opens the other language in a new tab, it works
 * before any JavaScript has loaded, and a crawler can follow it.
 *
 * The label names the language it leads to, in that language. Someone who
 * cannot read the page they landed on has to be able to read the way out of it,
 * which rules out a label written in the current language. `lang` on the link
 * makes a screen reader pronounce it correctly too.
 *
 * Scroll position is kept. The two versions are the same page at very nearly
 * the same length, and being thrown back to the top for changing language is
 * exactly the kind of small punishment that makes people stop trying things.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = useBarePathname();
  const t = useT(commonDict).languageSwitch;
  const target: Locale = locale === 'en' ? 'zh' : 'en';

  return (
    <Link
      href={pathname}
      locale={target}
      scroll={false}
      /*
        Not prefetched. Left on, every reader would download the other
        language's copy of every page they open, for a link very few of them
        press. And on a 404 the other version does not exist either: that
        prefetch goes through the rewrite into the catch-all route, where it was
        observed to stay open and never complete.
      */
      prefetch={false}
      hrefLang={htmlLang[target]}
      lang={htmlLang[target]}
      aria-label={t.aria}
      className={cn(
        'inline-flex h-[2.125rem] items-center gap-1.5 rounded-full border border-hairline px-3 text-muted-foreground transition-colors hover:border-lime/40 hover:bg-lime/5 hover:text-foreground',
        /* Latin initials take the site's mono label style; Chinese is set in
           the reader's own UI font, without the tracking meant for capitals. */
        target === 'en'
          ? 'font-mono text-xs uppercase tracking-widest'
          : 'text-[0.8rem] font-medium tracking-[0.06em]',
        className,
      )}
    >
      <Languages className="size-3.5" aria-hidden />
      {t.label}
    </Link>
  );
}
