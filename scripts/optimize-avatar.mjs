/**
 * Avatar GLB optimisation pipeline.
 *
 * The raw Tripo export ships three 4096x4096 textures (one of them a 12 MB PNG),
 * which costs ~268 MB of VRAM and makes the model unusable on mobile. This script
 * downsamples them, re-encodes to WebP, and prunes unused data.
 *
 * Run: node scripts/optimize-avatar.mjs
 */
import { NodeIO } from '@gltf-transform/core';
import { EXTTextureWebP, KHRTextureBasisu } from '@gltf-transform/extensions';
import { dedup, prune, resample } from '@gltf-transform/functions';
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';

const IN = 'public/models/avatar-raw.glb';
const OUT = 'public/models/avatar.glb';

/** Per-slot target resolution + quality. Roughness/normal tolerate far more loss than basecolor. */
const SLOT_RULES = [
  { match: /basecolor|basecolour|diffuse|albedo/i, size: 1024, quality: 84 },
  { match: /normal/i, size: 1024, quality: 80 },
  { match: /_rm$|roughness|metallic|orm/i, size: 512, quality: 72 },
];

const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

const io = new NodeIO().registerExtensions([EXTTextureWebP, KHRTextureBasisu]);
const doc = await io.read(IN);
const root = doc.getRoot();

console.log(`input:  ${mb(statSync(IN).size)}`);

// --- textures -------------------------------------------------------------
doc.createExtension(EXTTextureWebP).setRequired(false);

for (const tex of root.listTextures()) {
  const name = tex.getName() || 'texture';
  const before = tex.getImage()?.byteLength ?? 0;
  const rule = SLOT_RULES.find((r) => r.match.test(name)) ?? { size: 1024, quality: 80 };

  // `failOn: 'none'` sidesteps the libvips colourspace assertion that the
  // gltf-transform CLI trips over on this asset's 16-bit PNG.
  const pipeline = sharp(Buffer.from(tex.getImage()), { failOn: 'none' })
    .toColourspace('srgb')
    .resize(rule.size, rule.size, { fit: 'fill' })
    .webp({ quality: rule.quality, effort: 6 });

  const out = await pipeline.toBuffer();
  tex.setImage(new Uint8Array(out)).setMimeType('image/webp');
  console.log(`  ${name.padEnd(38)} ${mb(before).padStart(9)} -> ${mb(out.byteLength).padStart(9)}  @${rule.size}px q${rule.quality}`);
}

// --- animations + graph ---------------------------------------------------
await doc.transform(
  resample({ tolerance: 1e-4 }), // drop redundant keyframes on the 7 clips
  dedup(),
  prune({ keepAttributes: false, keepLeaves: false }),
);

await io.write(OUT, doc);

const inSize = statSync(IN).size;
const outSize = statSync(OUT).size;
console.log(`output: ${mb(outSize)}  (${(100 - (outSize / inSize) * 100).toFixed(1)}% smaller)`);
console.log('animations:', root.listAnimations().map((a) => a.getName()).join(', '));
