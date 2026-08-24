'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { primaryNav } from '@/content/navigation';
import { profile } from '@/content/profile';
import { cn } from '@/lib/utils';

/**
 * Sticky site header.
 *
 * Goes opaque once the page scrolls so the hero reads cleanly at the top but
 * navigation stays legible over content further down. The mobile sheet is a
 * plain overlay rather than a Radix Dialog — it needs no focus trapping beyond
 * what is here, and this avoids the layout shift the scroll-lock introduces.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    // Deferred by a frame rather than called inline: the page can load already
    // scrolled (a shared /#about link, or a restored position), so the initial
    // value still has to be read — just not during the effect's own render pass.
    const initial = requestAnimationFrame(onScroll);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Close the menu whenever the route changes.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  // Lock the page behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'border-b border-hairline bg-[#05070a]/80 backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <nav className="wrap flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            className="font-heading text-sm font-extrabold tracking-tight text-foreground md:text-base"
            aria-label={`${profile.fullName} — home`}
          >
            RICHIE<span className="text-lime">.</span>KOH
          </Link>

          <ul className="hidden items-center gap-7 lg:flex">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'link-underline font-mono text-xs uppercase tracking-widest transition-colors',
                    isActive(item.href)
                      ? 'text-lime'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/book"
              className={cn(
                'group hidden items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all sm:inline-flex',
                pathname === '/book'
                  ? 'border-lime/50 bg-lime/10 text-lime'
                  : 'border-hairline text-foreground hover:border-lime/40 hover:bg-lime/5',
              )}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
              </span>
              Book me
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-hairline text-foreground transition-colors hover:border-lime/40 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-nav"
        hidden={!open}
        className={cn(
          'fixed inset-0 z-40 flex flex-col bg-[#05070a]/97 px-6 pb-10 pt-24 backdrop-blur-2xl lg:hidden',
          open ? 'animate-in fade-in duration-300' : '',
        )}
      >
        <ul className="flex flex-col gap-1">
          {primaryNav.map((item, index) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-baseline gap-4 border-b border-hairline py-4 font-heading text-3xl font-semibold tracking-tight transition-colors hover:text-lime"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/book"
          className="mt-8 flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-4 font-mono text-sm uppercase tracking-widest text-black"
        >
          Book a session
        </Link>

        <div className="mt-auto pt-8 font-mono text-xs text-muted-foreground">
          {profile.location} · {profile.email}
        </div>
      </div>
    </>
  );
}
