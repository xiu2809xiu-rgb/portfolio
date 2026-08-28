/**
 * Builds the looping preview video that plays on each project card.
 *
 * The source material is the project's own screenshots — the same files the case
 * study pages use. Each shot gets a slow push-in, the shots cross-fade, and the
 * reel ends on a still copy of the opening frame so the HTML `loop` restart lands
 * on an identical frame instead of a visible cut.
 *
 * Re-run after adding or reordering screenshots:
 *   node scripts/build-previews.mjs
 *
 * If you later record a real screen capture of a project, drop the mp4 straight
 * into public/video/work/<slug>.mp4 and remove that slug from REELS below — the
 * card does not care where the file came from.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'video', 'work');

/** Output geometry — matches the card's 16:10 frame. */
const W = 960;
const H = 600;
const FPS = 25;
const HOLD = 3.0;      // seconds each shot is on screen
const FADE = 0.6;      // cross-fade length
const STEP = HOLD - FADE;

const REELS = [
  { slug: 'smartrecap', dir: 'smartrecap', shots: ['landing', 'grounding', 'features', 'app'] },
  { slug: 'singink-support', dir: 'ticketing', shots: ['support-center', 'create-ticket', 'my-tickets', 'ticket-detail', 'admin-dashboard', 'admin-tickets'] },
  { slug: 'table-tennis-cca-website', dir: 'cca', shots: ['homepage', 'why-join-us', 'achievements', 'club-socials', 'members'] },
];

/*
  Sources are 2.09:1 browser captures; the card is 1.6:1. Cropping to 1.6 first
  (centred, the way `object-cover` would) means the push-in never reveals an edge.
*/
const prepare = (label, zoomed) => {
  const base = `crop='min(iw,ih*1.6)':ih,scale=1200:750,setsar=1`;
  if (!zoomed) return `${base},trim=duration=${FADE + 0.2},scale=${W}:${H},fps=${FPS},format=yuv420p[${label}]`;
  return (
    `${base},zoompan=z='min(zoom+0.00075,1.13)':d=${Math.round(HOLD * FPS)}` +
    `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS},format=yuv420p[${label}]`
  );
};

for (const reel of REELS) {
  const inputs = reel.shots.map((name) => path.join(ROOT, 'public', 'img', 'work', reel.dir, `${name}.jpg`));
  const missing = inputs.filter((file) => !existsSync(file));
  if (missing.length) {
    console.warn(`skip ${reel.slug} — missing ${missing.map((f) => path.basename(f)).join(', ')}`);
    continue;
  }

  const args = [];
  for (const file of inputs) args.push('-loop', '1', '-t', String(HOLD), '-i', file);
  // The tail: a still of shot 0, so the loop point is frame-identical to the start.
  args.push('-loop', '1', '-t', String(FADE + 0.2), '-i', inputs[0]);

  const filters = inputs.map((_, i) => prepare(`v${i}`, true));
  filters.push(prepare(`vt`, false).replace(`[${'vt'}]`, '[vt]'));

  let chain = 'v0';
  let offset = STEP;
  const clips = [...inputs.map((_, i) => `v${i}`).slice(1), 'vt'];
  clips.forEach((clip, i) => {
    const out = i === clips.length - 1 ? 'out' : `x${i}`;
    filters.push(`[${chain}][${clip}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`);
    chain = out;
    offset += STEP;
  });

  mkdirSync(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, `${reel.slug}.mp4`);

  execFileSync(ffmpeg, [
    '-y', ...args,
    '-filter_complex', filters.join(';'),
    '-map', '[out]',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slower', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
    '-r', String(FPS),
    dest,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const kb = Math.round(statSync(dest).size / 1024);
  console.log(`${reel.slug}.mp4  ${inputs.length} shots  ${kb} KB`);
}
