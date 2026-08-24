/**
 * Lanyard card GLB optimisation.
 *
 * The upstream React Bits card ships a 2.3 MB PNG texture for what is a small
 * badge, a clip, and a clamp. The card's own face texture is replaced at runtime
 * by the generated front/back atlas, so the baked one only needs to cover the
 * metal clip — downsampling and re-encoding it costs nothing visually.
 *
 * Run: node scripts/optimize-lanyard-card.mjs
 */
import { NodeIO } from '@gltf-transform/core';
import { EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune } from '@gltf-transform/functions';
import sharp from 'sharp';
import { statSync } from 'node:fs';

const IN = 'public/models/lanyard-card-raw.glb';
const OUT = 'public/models/lanyard-card.glb';

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

const io = new NodeIO().registerExtensions([EXTTextureWebP]);
const doc = await io.read(IN);
const root = doc.getRoot();

console.log(`input:  ${mb(statSync(IN).size)}`);

doc.createExtension(EXTTextureWebP).setRequired(false);

for (const tex of root.listTextures()) {
  const before = tex.getImage()?.byteLength ?? 0;
  const out = await sharp(Buffer.from(tex.getImage()), { failOn: 'none' })
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();

  tex.setImage(new Uint8Array(out)).setMimeType('image/webp');
  console.log(`  texture ${mb(before)} -> ${mb(out.byteLength)}`);
}

await doc.transform(dedup(), prune({ keepAttributes: false, keepLeaves: false }));
await io.write(OUT, doc);

const inSize = statSync(IN).size;
const outSize = statSync(OUT).size;
console.log(`output: ${mb(outSize)}  (${(100 - (outSize / inSize) * 100).toFixed(1)}% smaller)`);
console.log('nodes:', root.listNodes().map((n) => n.getName()).filter(Boolean).join(', '));
