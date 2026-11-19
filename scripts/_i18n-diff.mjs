/**
 * Compares two snapshots made by `_i18n-snapshot.mjs`.
 *
 *   node scripts/_i18n-diff.mjs <before.json> <after.json>
 *
 * Text a reader can see or a screen reader can announce is expected to be
 * identical, and any difference is listed with the words around it. Head tags
 * are reported separately: adding a second language legitimately changes some
 * of those (hreflang links appear, share-image URLs gain a locale), and they
 * are easier to judge side by side than as a pass or fail.
 */
import { readFileSync } from 'node:fs';

const [, , BEFORE, AFTER] = process.argv;
const before = JSON.parse(readFileSync(BEFORE, 'utf8'));
const after = JSON.parse(readFileSync(AFTER, 'utf8'));

const TEXT = ['status', 'lang', 'title', 'description', 'visible', 'mounted', 'links', 'aria', 'alts'];
const HEAD = ['canonical', 'alternates', 'ogTitle', 'ogDescription', 'ogUrl', 'ogLocale'];

const flat = (value) => (Array.isArray(value) ? value.join('\n') : String(value ?? ''));

/*
  The language switch is new on every page, on purpose. Left in, it would be the
  first difference everywhere and hide any real one behind it, so it is removed
  from the "after" side before comparing: its label, its link and its aria-label.
*/
const SWITCH_LABEL = '中文';
const SWITCH_ARIA = '切换到中文';
function withoutSwitch(field, value) {
  if (field === 'visible') return String(value ?? '').replace(`\n${SWITCH_LABEL}\n`, '\n');
  if (field === 'mounted') return String(value ?? '').replace(SWITCH_LABEL, '');
  if (field === 'links') return (value ?? []).filter((href) => !/^\/zh(\/|$|#)/.test(href));
  if (field === 'aria') return (value ?? []).filter((label) => label !== SWITCH_ARIA);
  return value;
}

/** The first place two strings part ways, with a little context either side. */
function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const from = Math.max(0, i - 60);
  const clip = (s) => JSON.stringify(s.slice(from, i + 90));
  return `at ${i}:\n        before ${clip(a)}\n        after  ${clip(b)}`;
}

let textDiffs = 0;
const headNotes = [];

for (const label of Object.keys(before.pages)) {
  const a = before.pages[label];
  const b = after.pages[label];
  if (!b) {
    console.log(`MISSING  ${label}`);
    textDiffs += 1;
    continue;
  }

  const changed = TEXT.filter((field) => flat(a[field]) !== flat(withoutSwitch(field, b[field])));
  if (changed.length === 0) {
    console.log(`same     ${label}`);
  } else {
    textDiffs += changed.length;
    console.log(`DIFFERS  ${label}`);
    for (const field of changed) {
      console.log(
        `    ${field} ${firstDifference(flat(a[field]), flat(withoutSwitch(field, b[field])))}`,
      );
    }
  }

  for (const field of HEAD) {
    if (flat(a[field]) !== flat(b[field])) {
      headNotes.push(`${label}  ${field}: ${JSON.stringify(a[field])} → ${JSON.stringify(b[field])}`);
    }
  }
  if (b.errors?.length) console.log(`    page errors: ${JSON.stringify(b.errors)}`);
}

for (const route of Object.keys(before.raw ?? {})) {
  const a = before.raw[route];
  const b = after.raw?.[route];
  /* Feeds and sitemaps stamp the build time, so compare them without it. */
  const stable = (text) =>
    String(text ?? '')
      .replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/g, '')
      .replace(/<lastmod>[^<]*<\/lastmod>/g, '');
  if (!b) console.log(`MISSING  raw ${route}`);
  else if (a.status === b.status && stable(a.body) === stable(b.body)) console.log(`same     raw ${route}`);
  else {
    console.log(`DIFFERS  raw ${route} (status ${a.status} → ${b.status})`);
    console.log(`    ${firstDifference(stable(a.body), stable(b.body))}`);
  }
}

console.log(`\n${textDiffs} reader-facing difference(s)`);
if (headNotes.length) {
  console.log(`\nhead tags that changed (${headNotes.length}):`);
  for (const note of headNotes) console.log(`  ${note}`);
}
