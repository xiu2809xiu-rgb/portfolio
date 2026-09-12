import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, flatten, join } from '@gltf-transform/functions';
import { statSync } from 'node:fs';

const [, , input, output] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
await doc.transform(dedup(), flatten(), join(), weld(), prune(), quantize());
await io.write(output, doc);
const before = statSync(input).size;
const after = statSync(output).size;
console.log(`${(before / 1024).toFixed(1)}KB -> ${(after / 1024).toFixed(1)}KB (${Math.round((1 - after / before) * 100)}% smaller)`);
