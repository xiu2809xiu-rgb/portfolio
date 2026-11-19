/* Path rules for the two languages. Pure functions, so tested without a browser. */
import { localizePath, stripLocale } from '../src/i18n/config.ts';

const cases = [
  [() => localizePath('zh', '/'), '/zh'],
  [() => localizePath('zh', '/work'), '/zh/work'],
  [() => localizePath('zh', '/#about'), '/zh#about'],
  [() => localizePath('zh', '/?x=1'), '/zh?x=1'],
  [() => localizePath('zh', '/work/smartrecap#demo'), '/zh/work/smartrecap#demo'],
  [() => localizePath('zh', '/blog/rss.xml'), '/zh/blog/rss.xml'],
  [() => localizePath('zh', '/zhang'), '/zh/zhang'],
  // Already localised: idempotent, and convertible in both directions.
  [() => localizePath('zh', '/zh/work'), '/zh/work'],
  [() => localizePath('zh', '/en/work'), '/zh/work'],
  [() => localizePath('en', '/zh/work'), '/work'],
  [() => localizePath('en', '/zh'), '/'],
  [() => localizePath('en', '/zh#about'), '/#about'],
  [() => localizePath('en', '/work'), '/work'],
  // Things with no language are never prefixed.
  [() => localizePath('zh', '/docs/Resume_Richie_Koh.pdf'), '/docs/Resume_Richie_Koh.pdf'],
  [() => localizePath('zh', '/img/people/richie.jpg'), '/img/people/richie.jpg'],
  [() => localizePath('zh', '/api/health'), '/api/health'],
  [() => localizePath('zh', '/icon.svg'), '/icon.svg'],
  [() => localizePath('zh', 'https://github.com/x'), 'https://github.com/x'],
  [() => localizePath('zh', 'mailto:a@b.c'), 'mailto:a@b.c'],
  [() => localizePath('zh', '#main'), '#main'],
  [() => localizePath('zh', '//cdn.example.com/x'), '//cdn.example.com/x'],
  [() => stripLocale('/zh'), '/'],
  [() => stripLocale('/zh/work'), '/work'],
  [() => stripLocale('/en/work/smartrecap'), '/work/smartrecap'],
  [() => stripLocale('/zhang'), '/zhang'],
  [() => stripLocale('/english'), '/english'],
  [() => stripLocale('/'), '/'],
  [() => stripLocale('/work'), '/work'],
];

let bad = 0;
for (const [run, want] of cases) {
  const got = run();
  if (got !== want) {
    bad += 1;
    console.log(`FAIL ${run.toString().slice(6)} -> ${got}  (want ${want})`);
  }
}
console.log(bad ? `${bad} FAILED` : `all ${cases.length} path cases pass`);
process.exit(bad ? 1 : 0);
