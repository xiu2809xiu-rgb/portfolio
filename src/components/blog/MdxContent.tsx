import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';
import { highlight } from '@/lib/highlight';

/**
 * MDX renderer for blog posts.
 *
 * Runs entirely as a server component: MDX is compiled and code is highlighted
 * during the request (or at build time for static routes), so the browser gets
 * finished HTML and neither the MDX compiler nor Shiki ships to the client.
 */

/** Highlights fenced code blocks; MDX hands us `<pre><code class="language-x">`. */
async function Pre({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const child = children as
    | { props?: { className?: string; children?: string } }
    | undefined;

  const className = child?.props?.className ?? '';
  const language = /language-(\w+)/.exec(className)?.[1] ?? 'text';
  const source = String(child?.props?.children ?? '').replace(/\n$/, '');

  if (!source) return <pre {...props}>{children}</pre>;

  const html = await highlight(source, language);

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-hairline bg-[#0b0e13]">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
          {language}
        </span>
      </div>
      <div
        className="overflow-x-auto p-4 text-[0.82rem] leading-relaxed [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

const components = {
  pre: Pre,

  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      className="mt-12 scroll-mt-28 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className="mt-9 scroll-mt-28 font-heading text-xl font-bold tracking-tight"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="mt-5 leading-[1.75] text-muted-foreground" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mt-5 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol
      className="mt-5 list-decimal space-y-2 pl-5 leading-relaxed text-muted-foreground"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="mt-6 border-l-2 border-lime/40 pl-5 font-serif text-lg italic text-foreground/85"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-hairline" />,

  a: ({ href = '', ...props }: ComponentPropsWithoutRef<'a'>) => {
    const external = href.startsWith('http');
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="link-underline text-lime"
          {...props}
        />
      );
    }
    return <Link href={href} className="link-underline text-lime" {...props} />;
  },

  // Inline code only — fenced blocks are intercepted by `pre` above.
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      className="rounded border border-hairline bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.85em] text-lime"
      {...props}
    />
  ),

  // Wide tables must scroll inside their own container, never the page.
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-7 overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th
      className="border-b border-hairline bg-white/[0.03] px-4 py-2.5 text-left font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground"
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-hairline px-4 py-2.5 text-muted-foreground" {...props} />
  ),
};

export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
