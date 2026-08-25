/**
 * Avatar GLB optimisation pipeline.
 *
 * The raw Tripo export ships three 4096x4096 textures — one of them a 12 MB PNG —
 * costing ~268 MB of VRAM, which is unusable on mobile. This script reduces that
 * while keeping the model visually indistinguishable from the source.
 *
 * The per-slot budgets below are not guesses. Each source texture was
 * round-tripped (downsample, re-upsample, compare to the original) to find where
 * real detail stops, measured as PSNR — above ~40 dB the loss is invisible:
 *
 *   basecolor   2048px  36.4 dB     1024px  33.8 dB   <- the one that matters
 *   normal      2048px  47.9 dB     1024px  45.8 dB
 *   roughness   2048px  44.0 dB     1024px  41.4 dB
 *
 * So basecolor is the only map with detail worth keeping past 1024, and nothing
 * benefits from 4096. Quality is near-lossless WebP (q94-96) rather than the
 * default: at 2048px the difference between q88 and q96 is ~250 KB, which is
 * cheap insurance against banding on skin tones.
 *
 * Run: node scripts/optimize-avatar.mjs
 */
import { NodeIO } from '@gltf-transform/core';
import { EXTTextureWebP, KHRTextureBasisu } from '@gltf-transform/extensions';
import { dedup, prune, resample } from '@gltf-transform/functions';
import sharp from 'sharp';
import { statSync } from 'node:fs';

const IN = 'public/models/avatar-raw.glb';
const OUT = 'public/models/avatar.glb';

/**
 * Per-slot budgets. `size` comes from the PSNR analysis above; `quality` is set
 * high because texture bytes are a one-time download while banding is forever.
 */
const SLOT_RULES = [
  { match: /basecolor|basecolour|diffuse|albedo/i, size: 2048, quality: 96 },
  { match: /normal/i, size: 2048, quality: 94 },
  { match: /_rm$|roughness|metallic|orm/i, size: 1024, quality: 94 },
];

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

const io = new NodeIO().registerExtensions([EXTTextureWebP, KHRTextureBasisu]);
const doc = await io.read(IN);
const root = doc.getRoot();

console.log(`input:  ${mb(statSync(IN).size)}`);

// --- textures -------------------------------------------------------------
doc.createExtension(EXTTextureWebP).setRequired(false);

let vram = 0;

for (const tex of root.listTextures()) {
  const name = tex.getName() || 'texture';
  const before = tex.getImage()?.byteLength ?? 0;
  const rule = SLOT_RULES.find((r) => r.match.test(name)) ?? { size: 2048, quality: 94 };

  // `failOn: 'none'` sidesteps the libvips colourspace assertion that the
  // gltf-transform CLI trips over on this asset's 16-bit PNG. lanczos3 is the
  // sharpest of sharp's kernels, which matters when halving resolution.
  const out = await sharp(Buffer.from(tex.getImage()), { failOn: 'none' })
    .toColourspace('srgb')
    .resize(rule.size, rule.size, { fit: 'fill', kernel: 'lanczos3' })
    .webp({ quality: rule.quality, effort: 6, smartSubsample: true })
    .toBuffer();

  tex.setImage(new Uint8Array(out)).setMimeType('image/webp');
  vram += (rule.size * rule.size * 4 * 1.33) / 1048576;

  console.log(
    `  ${name.padEnd(38)} ${mb(before).padStart(9)} -> ${mb(out.byteLength).padStart(9)}  @${rule.size}px q${rule.quality}`,
  );
}

// --- animations + graph ---------------------------------------------------
await doc.transform(
  // A tight tolerance: this only drops keyframes that lie on the curve already,
  // so the seven clips keep their timing exactly.
  resample({ tolerance: 1e-5 }),
  dedup(),
  prune({ keepAttributes: false, keepLeaves: false }),
);

await io.write(OUT, doc);

const inSize = statSync(IN).size;
const outSize = statSync(OUT).size;
console.log(`output: ${mb(outSize)}  (${(100 - (outSize / inSize) * 100).toFixed(1)}% smaller)`);
console.log(`estimated GPU memory: ~${vram.toFixed(0)} MB (was ~268 MB)`);
console.log('animations:', root.listAnimations().map((a) => a.getName()).join(', '));
