import { ArrowUpRight } from 'lucide-react';
import { navigationContent } from '@/content/localized/navigation';
import { profileContent } from '@/content/localized/profile';
import type { Locale } from '@/i18n/config';
import { commonDict } from '@/i18n/dictionaries/common';
import { Link } from '@/i18n/Link';

/**
 * Takes the locale as a prop rather than reading it itself. The footer is
 * rendered by the root layout, which has already resolved the language and
 * must not throw — so it hands the answer down instead of each piece of chrome
 * asking again.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();
  const t = commonDict[locale];
  const { asideNav, footerNav } = navigationContent[locale];
  const { profile } = profileContent[locale];

  return (
    <footer className="relative mt-24 border-t border-hairline">
      <div className="wrap py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-heading text-lg font-extrabold tracking-tight"
              aria-label={t.header.homeAria(profile.fullName)}
            >
              RICHIE<span className="text-lime">.</span>KOH
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t.footer.blurb(profile.role, profile.location)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <nav aria-label={t.footer.navAria}>
              <h2 className="eyebrow mb-4">{t.footer.site}</h2>
              <ul className="space-y-2.5">
                {footerNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground"
                      {...(item.external
                        ? { target: '_blank', rel: 'noreferrer noopener' }
                        : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="eyebrow mb-4">{t.footer.elsewhere}</h2>
              <ul className="space-y-2.5">
                {profile.socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      {...(social.external
                        ? { target: '_blank', rel: 'noreferrer noopener' }
                        : {})}
                    >
                      <span className="link-underline">{social.label}</span>
                      {social.external ? (
                        <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/*
              Deliberately last and deliberately quiet. Neither of these is part
              of the portfolio; they are what you find if you go looking.
            */}
            <div>
              <h2 className="eyebrow mb-4">{t.footer.detours}</h2>
              <ul className="space-y-2.5">
                {asideNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.builtWith(year, profile.legalName)}</p>
          <p className="flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
            </span>
            {t.footer.available}
          </p>
        </div>
      </div>
    </footer>
  );
}
