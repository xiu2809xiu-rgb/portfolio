import type { Metadata } from 'next';
import { Link } from '@/i18n/Link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { htmlLang } from '@/i18n/config';
import { blogDict } from '@/i18n/dictionaries/blog';
import { getLocale, localizedAlternates } from '@/i18n/server';
import { formatPostDate, getPosts } from '@/lib/blog';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = blogDict[locale].meta;

  return {
    title: t.title,
    description: t.description,
    alternates: localizedAlternates(locale, '/blog'),
  };
}

export default async function BlogPage() {
  const locale = await getLocale();
  const t = blogDict[locale];
  const posts = await getPosts(locale);

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">~/richie/writing</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          {t.index.heading((words) => (
            <span className="text-gradient-lime">{words}</span>
          ))}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t.index.lede}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-16 text-muted-foreground">{t.index.empty}</p>
      ) : (
        <ul className="mt-16 divide-y divide-hairline border-t border-hairline">
          {posts.map((post, index) => {
            /* A post with no translation yet is listed in the language it is written in. */
            const original = post.language === locale ? undefined : htmlLang[post.language];

            return (
              <Reveal as="li" key={post.slug} delay={index * 0.06}>
                <Link href={`/blog/${post.slug}`} className="group block py-8">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                    <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {t.readingTime(post.readingMinutes)}
                    </span>
                    {post.draft ? (
                      <span className="rounded-full border border-warning/40 px-2 py-0.5 text-warning">
                        {t.draft}
                      </span>
                    ) : null}
                    {original ? (
                      <span className="rounded-full border border-hairline px-2 py-0.5">
                        {t.untranslated.badge}
                      </span>
                    ) : null}
                  </div>

                  <h2
                    lang={original}
                    className="mt-3 flex items-start gap-2 font-heading text-xl font-extrabold tracking-tight transition-colors group-hover:text-lime sm:text-2xl"
                  >
                    <span>{post.title}</span>
                    <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime" />
                  </h2>

                  <p
                    lang={original}
                    className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground"
                  >
                    {post.description}
                  </p>

                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-md border border-hairline px-2 py-0.5 font-mono text-[0.6rem] text-muted-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
}
