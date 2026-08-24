import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { formatPostDate, getPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Notes on building things — scheduling correctness, 3D performance, and what university projects actually teach you.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">~/richie/writing</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          Notes from <span className="text-gradient-lime">the build</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Things I worked out the hard way, written down while the details were still
          fresh. Mostly the bugs — those are the parts worth reading.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-16 text-muted-foreground">No posts yet. Check back soon.</p>
      ) : (
        <ul className="mt-16 divide-y divide-hairline border-t border-hairline">
          {posts.map((post, index) => (
            <Reveal as="li" key={post.slug} delay={index * 0.06}>
              <Link href={`/blog/${post.slug}`} className="group block py-8">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {post.readingMinutes} min read
                  </span>
                  {post.draft ? (
                    <span className="rounded-full border border-warning/40 px-2 py-0.5 text-warning">
                      Draft
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 flex items-start gap-2 font-heading text-xl font-extrabold tracking-tight transition-colors group-hover:text-lime sm:text-2xl">
                  <span>{post.title}</span>
                  <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime" />
                </h2>

                <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
          ))}
        </ul>
      )}
    </div>
  );
}
