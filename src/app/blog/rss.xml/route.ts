import { profile } from '@/content/profile';
import { getPosts } from '@/lib/blog';
import { absoluteUrl, siteConfig } from '@/lib/site';

export const dynamic = 'force-static';
// Rebuild the feed at most hourly; posts are files, so this only changes on deploy.
export const revalidate = 3600;

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
 */
export async function GET() {
  const posts = await getPosts();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${post.date}T09:00:00+08:00`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${profile.fullName} — Writing`)}</title>
    <link>${absoluteUrl('/blog')}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en-sg</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl('/blog/rss.xml')}" rel="self" type="application/rss+xml"/>
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
