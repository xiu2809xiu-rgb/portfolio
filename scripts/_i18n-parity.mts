/**
 * Structural parity between the English and Chinese sides of every dictionary
 * and content module.
 *
 * The type system already guarantees the two sides have the same keys. What it
 * cannot see:
 *
 *   · an array that is shorter in one language (`string[]` is `string[]`), which
 *     silently drops a bullet point or a step from one version of the site;
 *   · a Chinese value that is still the English sentence, copied across and
 *     never translated;
 *   · a field that should be identical in both — a slug, a link, an image path —
 *     and has drifted.
 *
 *   npx tsx scripts/_i18n-parity.mts         exit code 1 on a structural mismatch
 *
 * "Identical to English" is reported as a note, not a failure: product names,
 * technologies and people's names are meant to be the same in both.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type Pair = { en: unknown; zh: unknown };

const HAN = /[㐀-鿿]/;
/** Fields that must not differ between languages. */
const IDENTITY = /^(slug|href|src|url|id|icon|avatar|photo|image|email|resume|timezone|date|year|ms)$/;

/*
  Places where the two languages are meant to differ in shape. A pitch line's
  segments are cut where each language's wording puts its link (their targets
  are checked by position elsewhere), and the Chinese hero headline is set in
  two lines where the English needs three.
*/
const SHAPE_MAY_DIFFER = [/hardSellLines\[\d+\]$/, /hero\.headline$/];

const errors: string[] = [];
const same: string[] = [];

const isPair = (value: unknown): value is Pair =>
  typeof value === 'object' && value !== null && 'en' in value && 'zh' in value;

/** Looks like a sentence or phrase in English, rather than a name or a token. */
const isProse = (text: string) => (text.match(/[A-Za-z]{3,}/g) ?? []).length >= 3;

function walk(where: string, en: unknown, zh: unknown, identity: boolean): void {
  if (SHAPE_MAY_DIFFER.some((pattern) => pattern.test(where))) return;
  if (typeof en !== typeof zh) {
    errors.push(`${where}: type differs (${typeof en} vs ${typeof zh})`);
    return;
  }
  if (typeof en === 'string' && typeof zh === 'string') {
    const key = where.split('.').pop()?.replace(/\[\d+\]$/, '') ?? '';
    if (identity && IDENTITY.test(key)) {
      if (en !== zh) errors.push(`${where}: should be identical in both languages`);
    } else if (en === zh && isProse(en) && !HAN.test(en)) {
      same.push(`${where}: ${en.length > 90 ? `${en.slice(0, 90)}…` : en}`);
    }
    return;
  }
  if (Array.isArray(en) && Array.isArray(zh)) {
    if (en.length !== zh.length) {
      errors.push(`${where}: ${en.length} items in English, ${zh.length} in Chinese`);
    }
    for (let i = 0; i < Math.min(en.length, zh.length); i += 1) {
      walk(`${where}[${i}]`, en[i], zh[i], identity);
    }
    return;
  }
  if (typeof en === 'object' && en !== null && typeof zh === 'object' && zh !== null) {
    const a = en as Record<string, unknown>;
    const b = zh as Record<string, unknown>;
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(key in a)) errors.push(`${where}.${key}: only in Chinese`);
      else if (!(key in b)) errors.push(`${where}.${key}: only in English`);
      else walk(`${where}.${key}`, a[key], b[key], identity);
    }
  }
  /* Functions and numbers: nothing to compare without calling them. */
}

/*
  `identity` is on for content only. A content field called `href` or `email` is
  data that must match; in a dictionary the same name is usually a label for
  that thing ("Email" / "邮箱"), which is meant to differ.
*/
async function checkFolder(dir: string, pattern: RegExp, identity: boolean): Promise<number> {
  let count = 0;
  for (const name of readdirSync(dir).filter((file) => pattern.test(file))) {
    const file = path.posix.join(dir, name);
    try {
      const loaded = (await import(pathToFileURL(path.resolve(file)).href)) as Record<string, unknown>;
      for (const [exportName, value] of Object.entries(loaded)) {
        if (!isPair(value)) continue;
        walk(`${file}:${exportName}`, value.en, value.zh, identity);
        count += 1;
      }
    } catch (error) {
      errors.push(`${file}: could not be loaded — ${(error as Error).message.split('\n')[0]}`);
    }
  }
  return count;
}

const dictionaries = await checkFolder('src/i18n/dictionaries', /\.tsx?$/, false);
const content = await checkFolder('src/content/localized', /\.ts$/, true);

console.log(`checked ${dictionaries} dictionaries and ${content} content modules`);

if (same.length) {
  console.log(`\n${same.length} value(s) identical to English — check each is a name and not a miss:`);
  for (const line of same) console.log(`  ${line}`);
}
if (errors.length) {
  console.log(`\n${errors.length} structural problem(s):`);
  for (const line of errors) console.log(`  ${line}`);
  process.exit(1);
}
console.log('\nstructure matches in both languages');
