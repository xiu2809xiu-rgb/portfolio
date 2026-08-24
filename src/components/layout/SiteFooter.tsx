import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { footerNav } from '@/content/navigation';
import { profile } from '@/content/profile';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-hairline">
      <div className="wrap py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-heading text-lg font-extrabold tracking-tight"
              aria-label={`${profile.fullName} — home`}
            >
              RICHIE<span className="text-lime">.</span>KOH
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {profile.role} in {profile.location}. Currently open to internships and
              collaborations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-2">
            <nav aria-label="Footer">
              <h2 className="eyebrow mb-4">Site</h2>
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
              <h2 className="eyebrow mb-4">Elsewhere</h2>
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
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile.legalName}. Built with Next.js, Three.js, and too much tea.
          </p>
          <p className="flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
            </span>
            Available for work
          </p>
        </div>
      </div>
    </footer>
  );
}
