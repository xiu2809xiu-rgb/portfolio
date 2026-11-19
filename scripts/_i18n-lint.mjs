/**
 * Typography lint for the Chinese copy.
 *
 * Checks the things a careful Chinese editor checks by eye and a compiler
 * cannot: a space between Chinese and Latin or digits, full-width punctuation,
 * curly quotes, doubled dashes and ellipses, and stray Traditional characters.
 * None of these change meaning, and all of them are what makes a page read as
 * "translated by software" when they are wrong.
 *
 * It reads source rather than rendered pages, so a problem is reported at the
 * line that has to change:
 *
 *   src/i18n/dictionaries/*.ts(x)   every string literal and JSX text with Chinese in it
 *   src/content/zh/*.ts             the same
 *   src/content/blog/zh/*.mdx       prose, with code and link targets removed
 *
 *   node scripts/_i18n-lint.mjs            exit code 1 if anything is found
 */
import ts from 'typescript';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const HAN = '\\u3400-\\u9fff';
const re = (source, flags = 'u') => new RegExp(source.replaceAll('HAN', HAN), flags);
const hasChinese = (text) => re('[HAN]').test(text);

/** Common Traditional forms. The site is Simplified; one of these is a slip. */
const TRADITIONAL =
  '體學國們這個為與開發實現點擊時間問題應該經驗設計師網頁資訊軟說話讓對沒還邊進過選擇顯確認預約';

const RULES = [
  ['space between Chinese and Latin/digits', re('[HAN][A-Za-z0-9]|[A-Za-z0-9][HAN]')],
  ['half-width punctuation in Chinese', re('[HAN][,;:!?]|[,;!?][HAN]|[HAN]\\.(?=\\s|$)')],
  ['half-width parentheses in Chinese', re('[HAN]\\(|\\([HAN]|[HAN]\\)|\\)[HAN]')],
  ['space beside full-width punctuation', re(' [，。、；：？！）》”’]|[（《“‘] |[，。、；：？！] ')],
  ['straight quote in Chinese', re('[HAN]["\']|["\'][HAN]')],
  ['three dots instead of ……', re('\\.\\.\\.')],
  ['single … (should be ……)', re('(?<!…)…(?!…)')],
  ['single — beside Chinese (should be ——)', re('[HAN]—(?!—)|(?<!—)—[HAN]')],
  ['hyphen used as a dash between Chinese', re('[HAN] -{1,2} [HAN]')],
  ['corner quotes 「」', re('[「」『』]')],
  ['formal 您', re('您')],
  ['full-width letters or digits', re('[\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A]')],
  ['Traditional character', re(`[${TRADITIONAL}]`)],
];

const problems = [];

function check(file, line, text) {
  if (!hasChinese(text)) return;
  for (const [name, pattern] of RULES) {
    const match = pattern.exec(text);
    if (!match) continue;
    const from = Math.max(0, match.index - 14);
    problems.push({ file, line, name, near: text.slice(from, match.index + 16).replace(/\s+/g, ' ') });
  }
}

function lintTypeScript(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const lineOf = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
      check(file, lineOf(node), node.text);
    } else if (ts.isTemplateExpression(node)) {
      /* Each literal piece on its own: what sits beside a ${…} is unknowable here. */
      check(file, lineOf(node), node.head.text);
      for (const span of node.templateSpans) check(file, lineOf(span), span.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function lintMdx(file) {
  let fenced = false;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((raw, index) => {
      if (/^\s*```/.test(raw)) {
        fenced = !fenced;
        return;
      }
      if (fenced) return;
      const prose = raw
        .replace(/`[^`]*`/g, ' x ') // inline code
        .replace(/\]\([^)]*\)/g, ']') // link targets
        .replace(/<[^>]+>/g, ' ') // tags and their attributes
        .replace(/^(\s*)([-*]|\d+\.)\s+/, '$1') // list markers
        .replace(/^#+\s+/, '') // heading markers
        .replace(/\*\*|__|\*/g, ''); // emphasis markers
      check(file, index + 1, prose);
    });
}

const list = (dir, pattern) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => pattern.test(name))
        .map((name) => path.posix.join(dir, name))
    : [];

const sources = [...list('src/i18n/dictionaries', /\.tsx?$/), ...list('src/content/zh', /\.ts$/)];
const posts = list('src/content/blog/zh', /\.mdx$/);

sources.forEach(lintTypeScript);
posts.forEach(lintMdx);

if (problems.length === 0) {
  console.log(`clean: ${sources.length} source files and ${posts.length} posts`);
  process.exit(0);
}

let current = '';
for (const problem of problems) {
  if (problem.file !== current) {
    current = problem.file;
    console.log(`\n${current}`);
  }
  console.log(`  ${String(problem.line).padStart(4)}  ${problem.name}  …${problem.near}…`);
}
console.log(`\n${problems.length} problem(s) in ${new Set(problems.map((p) => p.file)).size} file(s)`);
process.exit(1);
