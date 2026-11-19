import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocaleOrDefault, notFoundMetadata } from '@/i18n/server';

/*
  Catches every path that no other route under `[lang]` claims.

  The root layout lives under `[lang]`, so the framework's built-in 404 has no
  layout to render in and falls back to a bare white page. This route is what
  keeps a mistyped URL inside the site: the request reaches a real page, which
  immediately says "not found", and that is caught by `[lang]/not-found.tsx` —
  inside the header and footer, in the reader's language, with a 404 status.
*/

export async function generateMetadata(): Promise<Metadata> {
  return notFoundMetadata(await getLocaleOrDefault());
}

export default function CatchAll() {
  notFound();
}
