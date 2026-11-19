import type { MetadataRoute } from 'next';
import { htmlLang, isLocale, locales, localizePath } from '@/i18n/config';
import { commonDict } from '@/i18n/dictionaries/common';
import { getSiteConfig } from '@/lib/site';

export const dynamic = 'force-static';

/** One manifest per language: `/manifest.webmanifest` and `/zh/manifest.webmanifest`. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * The web app manifest, as a Route Handler rather than `app/manifest.ts`.
 *
 * The file convention produces exactly one manifest for the whole site, and a
 * manifest names things a person reads — the app's name and description — and
 * says where it opens. Someone who installs the Chinese site should get a
 * Chinese name and land on `/zh`, so each language needs its own.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<'/[lang]/manifest.webmanifest'>,
) {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response('Not found', { status: 404 });

  const site = getSiteConfig(lang);

  const manifest: MetadataRoute.Manifest = {
    name: site.name,
    short_name: site.shortName,
    description: commonDict[lang].site.manifestDescription,
    lang: htmlLang[lang],
    start_url: localizePath(lang, '/'),
    display: 'standalone',
    background_color: '#05070a',
    theme_color: '#05070a',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
