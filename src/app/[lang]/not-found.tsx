import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { NotFoundGlitch } from '@/components/layout/NotFoundGlitch';
import { navigationContent } from '@/content/localized/navigation';
import { commonDict } from '@/i18n/dictionaries/common';
import { Link } from '@/i18n/Link';
import { getLocaleOrDefault, notFoundMetadata } from '@/i18n/server';

/*
  The language is read with the non-throwing getter. This page is what an
  unknown language ends up rendering, so asking for the locale in the way that
  404s on a bad one would be throwing from inside the thing that catches it.
*/

export async function generateMetadata(): Promise<Metadata> {
  return notFoundMetadata(await getLocaleOrDefault());
}

export default async function NotFound() {
  const locale = await getLocaleOrDefault();
  const t = commonDict[locale].notFound;
  const { primaryNav } = navigationContent[locale];

  return (
    <div className="wrap flex min-h-[70svh] flex-col items-center justify-center pb-24 pt-32 text-center">
      <NotFoundGlitch />

      <h1 className="mt-6 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t.heading}
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t.body}</p>

      <nav className="mt-8">
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex rounded-full border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-lime/40 hover:bg-lime/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        href="/"
        className="group mt-10 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 font-mono text-xs uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {t.backHome}
      </Link>
    </div>
  );
}
