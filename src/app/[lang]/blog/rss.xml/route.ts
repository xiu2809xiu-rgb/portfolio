import { isLocale, locales, localizePath } from '@/i18n/config';
import { getPosts } from '@/lib/blog';
import { absoluteUrl, getSiteConfig } from '@/lib/site';

export const dynamic = 'force-static';
// Rebuild the feed at most hourly; posts are files, so this only changes on deploy.
export const revalidate = 3600;

/** One feed per language: `/blog/rss.xml` and `/zh/blog/rss.xml`. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** RSS wants an RFC 1766 tag; `zh-cn` is the one feed readers recognise. */
const feedLanguage = { en: 'en-sg', zh: 'zh-cn' } as const;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * RSS 2.0 feed for the blog.
 *
 * Descriptions only, not full post bodies: the MDX renders through React
 * components that have no meaningful HTML equivalent in a reader, and a
 * half-rendered post reads worse than a summary plus a link.
 *
 * The language comes from `params` — `next/root-params` is for Server
 * Components and is not available in a Route Handler.
 */
export async function GET(_request: Request, { params }: RouteContext<'/[lang]/blog/rss.xml'>) {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response('Not found', { status: 404 });

  const site = getSiteConfig(lang);
  const posts = await getPosts(lang);
  const url = (path: string) => absoluteUrl(localizePath(lang, path));

  const items = posts
    .map((post) => {
      const link = url(`/blog/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${post.date}T09:00:00+08:00`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.rssTitle)}</title>
    <link>${url('/blog')}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${feedLanguage[lang]}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${url('/blog/rss.xml')}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
