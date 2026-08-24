import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { MdxContent } from '@/components/blog/MdxContent';
import { profile } from '@/content/profile';
import { formatPostDate, getPost, getPosts } from '@/lib/blog';
import { absoluteUrl } from '@/lib/site';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not found' };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.date,
      authors: [profile.legalName],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const all = await getPosts();
  const index = all.findIndex((entry) => entry.slug === post.slug);
  const next = index > 0 ? all[index - 1] : null;
  const previous = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Person', name: profile.legalName, url: absoluteUrl('/') },
    keywords: post.tags.join(', '),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <article className="pb-24 pt-32 md:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="wrap-tight">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          All writing
        </Link>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {post.readingMinutes} min read
            </span>
          </div>

          <h1 className="mt-4 font-heading text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.03em]">
            {post.title}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {post.description}
          </p>

          <ul className="mt-6 flex flex-wrap gap-1.5 border-b border-hairline pb-8">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-hairline px-2 py-0.5 font-mono text-[0.6rem] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        </header>

        <div className="mt-2 text-base">
          <MdxContent source={post.content} />
        </div>

        <nav className="mt-16 grid gap-3 border-t border-hairline pt-8 sm:grid-cols-2">
          {previous ? (
            <Link
              href={`/blog/${previous.slug}`}
              className="glass glass-hover rounded-2xl p-5"
            >
              <p className="eyebrow">Previous</p>
              <p className="mt-2 font-heading text-sm font-bold leading-snug">
                {previous.title}
              </p>
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="glass glass-hover rounded-2xl p-5 sm:text-right"
            >
              <p className="eyebrow">Next</p>
              <p className="mt-2 font-heading text-sm font-bold leading-snug">{next.title}</p>
            </Link>
          ) : null}
        </nav>

        <div className="mt-10 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Working on something similar, or want to talk it through?
          </p>
          <Link
            href="/book"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
          >
            Book a session
          </Link>
        </div>
      </div>
    </article>
  );
}
