import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

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
}

/** A post without its body — everything the index page needs. */
export type PostSummary = Omit<Post, 'content'>;

const POSTS_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

/** 200 wpm is the usual reading-time constant; round up so 0 never shows. */
const readingTime = (markdown: string) =>
  Math.max(1, Math.round(markdown.trim().split(/\s+/).length / 200));

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

function parse(slug: string, raw: string): Post {
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
  };
}

/**
 * All published posts, newest first.
 *
 * Drafts are filtered in production but kept in development, so a work-in-progress
 * is previewable locally without being publicly readable.
 */
export async function getPosts(): Promise<PostSummary[]> {
  let files: string[];
  try {
    files = await readdir(POSTS_DIR);
  } catch {
    return [];
  }

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith('.mdx'))
      .map(async (file) => {
        const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
        return parse(file.replace(/\.mdx$/, ''), raw);
      }),
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
      };
      return summary;
    });
}

export async function getPost(slug: string): Promise<Post | null> {
  // Guard against `../` in the route segment reaching the filesystem.
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;

  try {
    const raw = await readFile(path.join(POSTS_DIR, `${slug}.mdx`), 'utf8');
    const post = parse(slug, raw);
    if (post.draft && process.env.NODE_ENV === 'production') return null;
    return post;
  } catch {
    return null;
  }
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getPosts();
  return [...new Set(posts.flatMap((post) => post.tags))].sort();
}

export const formatPostDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
