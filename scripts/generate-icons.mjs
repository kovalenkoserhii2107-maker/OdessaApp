import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/icon.svg', import.meta.url));
for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/${name}`, import.meta.url).pathname);
}
const inset = await sharp(source).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#182c2b' } })
  .composite([{ input: inset, left: 76, top: 76 }])
  .png()
  .toFile(new URL('../public/icon-maskable.png', import.meta.url).pathname);
