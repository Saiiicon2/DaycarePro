import fs from 'fs/promises';
import path from 'path';

async function removeIfExists(p) {
  try {
    const stat = await fs.stat(p).catch(() => null);
    if (!stat) return false;
    // remove file or directory
    await fs.rm(p, { recursive: true, force: true });
    return true;
  } catch (e) {
    console.warn('Could not remove', p, e?.message ?? e);
    return false;
  }
}

async function main() {
  const root = path.resolve(new URL(import.meta.url).pathname, '..', '..');
  // common vite cache locations in this repo layout
  const candidates = [
    path.join(root, 'client', '.vite'),
    path.join(root, 'client', 'node_modules', '.vite'),
    path.join(root, 'node_modules', '.vite'),
    path.join(root, '.vite'),
  ];

  let removedAny = false;
  for (const c of candidates) {
    const ok = await removeIfExists(c);
    if (ok) {
      console.log('Removed Vite cache at', c);
      removedAny = true;
    }
  }

  if (!removedAny) console.log('No .vite cache directories found');
}

main().catch((e) => {
  console.error('clean-vite error', e);
  process.exit(1);
});
