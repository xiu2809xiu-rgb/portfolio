import type { MetadataRoute } from 'next';
import { projects } from '@/content/projects';
import { defaultLocale, htmlLang, locales, localizePath } from '@/i18n/config';
import { getPosts } from '@/lib/blog';
import { absoluteUrl } from '@/lib/site';

type Entry = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>;

/**
 * One sitemap entry per language for a page, each naming every version of it.
 *
 * Search engines treat hreflang as a claim that has to be confirmed from both
 * sides: the English page must point at the Chinese one and the Chinese one
 * back, and each must also list itself. So every entry carries the full set
 * rather than only "the other one". `x-default` is English — what a reader with
 * neither preference should be sent to.
 */
function localized(path: string, entry: Entry): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(
      locales.map((locale) => [htmlLang[locale], absoluteUrl(localizePath(locale, path))]),
    ),
    'x-default': absoluteUrl(localizePath(defaultLocale, path)),
  };

  return locales.map((locale) => ({
    url: absoluteUrl(localizePath(locale, path)),
    ...entry,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  /*
    Slugs and dates are the same in both languages, so the English lists are
    enough to enumerate every URL. The owner-only booking approval pages are
    deliberately absent, and so are the two detours (/drive and /pitch).
  */
  const posts = await getPosts();

  return [
    ...localized('/', { lastModified: now, changeFrequency: 'monthly', priority: 1 }),
    ...localized('/work', { lastModified: now, changeFrequency: 'monthly', priority: 0.9 }),
    ...localized('/blog', { lastModified: now, changeFrequency: 'weekly', priority: 0.8 }),
    ...localized('/book', { lastModified: now, changeFrequency: 'monthly', priority: 0.9 }),
    ...localized('/uses', { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }),
    ...projects.flatMap((project) =>
      localized(`/work/${project.slug}`, {
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.7,
      }),
    ),
    ...posts.flatMap((post) =>
      localized(`/blog/${post.slug}`, {
        lastModified: new Date(post.date),
        changeFrequency: 'yearly',
        priority: 0.6,
      }),
    ),
  ];
}
