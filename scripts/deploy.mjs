import { spawnSync } from 'node:child_process';

// Do not silently deploy to a different repository after an origin migration.
const repo = process.env.DEPLOY_REPOSITORY;
const base = process.env.VITE_BASE_PATH;
if (!repo || !base) {
  console.error('Set DEPLOY_REPOSITORY (Git URL) and VITE_BASE_PATH (for example /OdessaApp/).');
  process.exit(1);
}
for (const args of [
  ['run', 'check'],
  ['exec', '--', 'gh-pages', '-d', 'dist', '--dotfiles', '-r', repo],
]) {
  const result = spawnSync('npm', args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Build pushed to gh-pages. Enable Pages for that branch and verify the live URL.');
