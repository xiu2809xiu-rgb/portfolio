import type { Metadata } from 'next';
import { Link } from '@/i18n/Link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { MdxContent } from '@/components/blog/MdxContent';
import { profile } from '@/content/profile';
import { htmlLang, localizePath, ogLocale } from '@/i18n/config';
import { blogDict } from '@/i18n/dictionaries/blog';
import { commonDict } from '@/i18n/dictionaries/common';
import { getLocale, localizedAlternates, notFoundMetadata } from '@/i18n/server';
import { formatPostDate, getPost, getPosts } from '@/lib/blog';
import { absoluteUrl } from '@/lib/site';

/*
  Every slug is known at build time, so each page is prerendered. An unknown
  slug is deliberately NOT refused at the routing layer with
  `dynamicParams = false`: that hands the request to the framework's built-in
  404, which has no layout to render in now that the root layout lives under
  `[lang]`. Letting it reach `notFound()` below sends it to
  `[lang]/not-found.tsx` instead — the site's own 404, in the reader's language.
*/

/* Slugs are shared between languages, so the English list names every page. */
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getPost(slug, locale);
  if (!post) return notFoundMetadata(locale);

  const path = `/blog/${post.slug}`;
  /*
    A post that has not been translated yet is the English article at a second
    address. Its canonical is the English URL, and it claims no Chinese
    alternate — announcing the English text as the Chinese version would tell
    search engines there is a translation when there is not.
  */
  const translated = post.language === locale;

  return {
    title: post.title,
    description: post.description,
    alternates: translated
      ? localizedAlternates(locale, path)
      : { canonical: localizePath(post.language, path) },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: absoluteUrl(localizePath(post.language, path)),
      locale: ogLocale[post.language],
      publishedTime: post.date,
      authors: [profile.legalName],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: PageProps<'/[lang]/blog/[slug]'>) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getPost(slug, locale);
  if (!post) notFound();

  const t = blogDict[locale];
  const all = await getPosts(locale);
  const index = all.findIndex((entry) => entry.slug === post.slug);
  const next = index > 0 ? all[index - 1] : null;
  const previous = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  /*
    Set on the article's own text when it is not in the page's language, so a
    screen reader switches voice and the browser hyphenates and shapes it as the
    language it actually is. The chrome around it stays in the reader's language.
  */
  const original = post.language === locale ? undefined : htmlLang[post.language];
  const path = `/blog/${post.slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: htmlLang[post.language],
    author: { '@type': 'Person', name: profile.legalName, url: absoluteUrl('/') },
    keywords: post.tags.join(', '),
    mainEntityOfPage: absoluteUrl(localizePath(post.language, path)),
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
          {t.post.allWriting}
        </Link>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {t.readingTime(post.readingMinutes)}
            </span>
          </div>

          <h1
            lang={original}
            className="mt-4 font-heading text-[clamp(2rem,5.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.03em]"
          >
            {post.title}
          </h1>

          <p lang={original} className="mt-4 text-lg leading-relaxed text-muted-foreground">
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

        {original ? (
          <p className="mt-8 rounded-xl border border-hairline bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
            {t.untranslated.notice}
          </p>
        ) : null}

        <div lang={original} className="mt-2 text-base">
          <MdxContent source={post.content} />
        </div>

        <nav className="mt-16 grid gap-3 border-t border-hairline pt-8 sm:grid-cols-2">
          {previous ? (
            <Link
              href={`/blog/${previous.slug}`}
              className="glass glass-hover rounded-2xl p-5"
            >
              <p className="eyebrow">{t.post.previous}</p>
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
              <p className="eyebrow">{t.post.next}</p>
              <p className="mt-2 font-heading text-sm font-bold leading-snug">{next.title}</p>
            </Link>
          ) : null}
        </nav>

        <div className="mt-10 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6 text-center">
          <p className="text-sm text-muted-foreground">{t.post.cta}</p>
          <Link
            href="/book"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
          >
            {commonDict[locale].header.bookSession}
          </Link>
        </div>
      </div>
    </article>
  );
}
