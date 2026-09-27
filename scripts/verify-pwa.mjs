import assert from 'node:assert/strict';
import { readFile, copyFile, writeFile, access } from 'node:fs/promises';

const base = process.env.VITE_BASE_PATH ?? '/odessa-app/';
const origin = 'https://example.invalid';
const manifestUrl = new URL(`${base}manifest.webmanifest`, origin);
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const start = new URL(manifest.start_url, manifestUrl);
const scope = new URL(manifest.scope, manifestUrl);
assert.equal(start.href, new URL(base, origin).href, 'Shortcut must open the deployed app');
assert.equal(scope.href, start.href, 'App scope must match the deployed path');
assert.equal(new URL(manifest.id, origin).href, start.href, 'App identity must stay stable');

const html = await readFile('dist/index.html', 'utf8');
for (const icon of manifest.icons) {
  const url = new URL(icon.src, manifestUrl);
  assert(url.pathname.startsWith(base), 'Icons must stay inside the app path');
  await access(`dist/${url.pathname.slice(base.length)}`);
}
assert(html.includes(`${base}manifest.webmanifest`), 'HTML must load the correct manifest');
assert(html.includes(`${base}apple-touch-icon.png`), 'iOS icon must use the deployment path');
await access('dist/apple-touch-icon.png');
const sw = await readFile('dist/sw.js', 'utf8');
assert(sw.includes(`${base}index.html`), 'Offline launch must load the deployed app');

// GitHub Pages serves this shell for stale/deep links. Asset URLs keep the correct base.
await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
console.log(`PWA verified: shortcut, scope, icons and offline shell at ${base}`);
