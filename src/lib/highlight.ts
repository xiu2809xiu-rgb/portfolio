import { createHighlighter, type Highlighter } from 'shiki';

/** Only the grammars this site actually renders — each one costs bundle weight. */
const LANGS = ['python', 'javascript', 'typescript', 'tsx', 'bash', 'json', 'sql', 'html', 'css'] as const;

const THEME = 'github-dark-default';

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Shared Shiki instance.
 *
 * Creating a highlighter loads and compiles every grammar, which takes hundreds
 * of milliseconds — so it is created once per server process and reused across
 * requests and across every code block on a page.
 */
function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({ themes: [THEME], langs: [...LANGS] });
  return highlighterPromise;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Returns highlighted HTML, falling back to escaped plain text on any failure. */
export async function highlight(source: string, language: string): Promise<string> {
  const lang = (LANGS as readonly string[]).includes(language) ? language : 'text';

  try {
    const highlighter = await getHighlighter();
    return highlighter.codeToHtml(source, { lang, theme: THEME });
  } catch {
    return `<pre><code>${escapeHtml(source)}</code></pre>`;
  }
}
