import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { defaultLocale, intlLocale, type Locale } from '@/i18n/config';

export interface PostFrontmatter {
  title: string;
  description: string;
  /** ISO date, e.g. "2026-07-14". */
  date: string;
  tags: string[];
  draft?: boolean;
}

export interface Post extends PostFrontmatter {
  slug: string;
  content: string;
  readingMinutes: number;
  /**
   * The language this post is actually written in.
   *
   * Usually the one that was asked for. It differs when a post has no
   * translation yet: the Chinese site then serves the English original rather
   * than a 404, and the page uses this to say so.
   */
  language: Locale;
}

/** A post without its body — everything the index page needs. */
export type PostSummary = Omit<Post, 'content'>;

/*
  English posts sit directly in this folder and define which posts exist.
  A translation is the same filename in a subfolder named for its locale:

    src/content/blog/my-post.mdx        ← the post
    src/content/blog/zh/my-post.mdx     ← its Chinese version, if there is one

  Slugs are shared, so `/blog/my-post` and `/zh/blog/my-post` are always the
  same article.
*/
const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

const CJK = /[㐀-鿿豈-﫿]/g;

/**
 * Minutes to read, rounded so 0 never shows.
 *
 * 200 words a minute is the usual constant for English. Chinese has no spaces
 * to count words by and is read by the character, at roughly 400 a minute — so
 * the two are counted separately and added. For a post with no Chinese in it
 * this is exactly the old words-over-200.
 */
function readingTime(markdown: string): number {
  const characters = markdown.match(CJK)?.length ?? 0;
  const words = markdown.replace(CJK, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(characters / 400 + words / 200));
}

/**
 * YAML turns an unquoted `2026-08-18` into a JavaScript Date, while a quoted one
 * stays a string. Normalising to `YYYY-MM-DD` here means callers can always sort
 * and format the same way, whichever style a post's frontmatter happens to use.
 */
function toIsoDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 10);
  return '1970-01-01';
}

function parse(slug: string, raw: string, language: Locale): Post {
  const { data, content } = matter(raw);
  const frontmatter = data as Record<string, unknown>;

  return {
    slug,
    title: typeof frontmatter.title === 'string' ? frontmatter.title : slug,
    description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
    date: toIsoDate(frontmatter.date),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
    draft: frontmatter.draft === true,
    content,
    readingMinutes: readingTime(content),
    language,
  };
}

/** The translation if one exists, otherwise the English original. */
async function read(slug: string, locale: Locale): Promise<Post> {
  if (locale !== defaultLocale) {
    try {
      const raw = await readFile(path.join(POSTS_DIR, locale, `${slug}.mdx`), 'utf8');
      return parse(slug, raw, locale);
    } catch {
      /* No translation yet — fall through to the original. */
    }
  }
  const raw = await readFile(path.join(POSTS_DIR, `${slug}.mdx`), 'utf8');
  return parse(slug, raw, defaultLocale);
}

/**
 * All published posts, newest first.
 *
 * Drafts are filtered in production but kept in development, so a work-in-progress
 * is previewable locally without being publicly readable.
 */
export async function getPosts(locale: Locale = defaultLocale): Promise<PostSummary[]> {
  let files: string[];
  try {
    files = await readdir(POSTS_DIR);
  } catch {
    return [];
  }

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => read(file.replace(/\.mdx$/, ''), locale)),
  );

  return posts
    .filter((post) => (process.env.NODE_ENV === 'production' ? !post.draft : true))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((post) => {
      const summary: PostSummary = {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        tags: post.tags,
        draft: post.draft,
        readingMinutes: post.readingMinutes,
        language: post.language,
      };
      return summary;
    });
}

export async function getPost(slug: string, locale: Locale = defaultLocale): Promise<Post | null> {
  // Guard against `../` in the route segment reaching the filesystem.
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;

  try {
    const post = await read(slug, locale);
    if (post.draft && process.env.NODE_ENV === 'production') return null;
    return post;
  } catch {
    return null;
  }
}

export async function getAllTags(locale: Locale = defaultLocale): Promise<string[]> {
  const posts = await getPosts(locale);
  return [...new Set(posts.flatMap((post) => post.tags))].sort();
}

export const formatPostDate = (iso: string, locale: Locale = defaultLocale) =>
  new Date(iso).toLocaleDateString(intlLocale[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
