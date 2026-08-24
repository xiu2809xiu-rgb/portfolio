import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotFoundGlitch } from '@/components/layout/NotFoundGlitch';
import { primaryNav } from '@/content/navigation';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That page does not exist.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[70svh] flex-col items-center justify-center pb-24 pt-32 text-center">
      <NotFoundGlitch />

      <h1 className="mt-6 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        This page doesn&rsquo;t exist
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The link may be out of date, or I may have moved something. Here is everything
        that does exist:
      </p>

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
        Back home
      </Link>
    </div>
  );
}
