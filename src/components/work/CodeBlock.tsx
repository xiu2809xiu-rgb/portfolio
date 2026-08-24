import { highlight } from '@/lib/highlight';

interface CodeBlockProps {
  filename: string;
  language: string;
  source: string;
}

/**
 * Syntax-highlighted code sample.
 *
 * Highlighting runs on the server via Shiki, so the browser receives coloured
 * HTML and ships no highlighter bundle at all — Shiki's grammars are larger than
 * every other dependency on the page combined.
 */
export async function CodeBlock({ filename, language, source }: CodeBlockProps) {
  const html = await highlight(source, language);

  return (
    <figure className="overflow-hidden rounded-2xl border border-hairline bg-[#0b0e13]">
      <figcaption className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-2.5">
        <span className="font-mono text-xs text-foreground">{filename}</span>
        <span className="font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
          {language}
        </span>
      </figcaption>

      <div
        className="overflow-x-auto p-5 text-[0.82rem] leading-relaxed [&_pre]:!bg-transparent [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}
