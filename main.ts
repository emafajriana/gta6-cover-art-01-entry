// Sunset Cover Studio — hand-in program for the make.fun
// gta6-cover-art-01 competition (Node 22, standard library only).
//
// The entry itself is the static web app under app/: open
// app/index.html in a desktop browser and it runs offline, turning a
// photo and a caption into multi-panel GTA-poster-style cover art —
// Pop-Out mode, retro-chrome headlines and all — and exporting it as
// a PNG. This program's whole job is the hand-in: copy app/ and
// screenshots/ from beside this file into the output directory, then
// write dossier.json there with buildDossier from the kit's vendored
// library (vendor/makefun-app.ts, kept byte-for-byte as the kit ships
// it, because the gate rebuilds the dossier with its own copy and
// compares the two).
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Count the files under a copied tree, for the hand-in summary below.
function countFiles(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

// The app goes in whole; the screenshots folder follows it (a valid
// entry carries 3 or 4).
mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own for this competition, handed to
// the dossier builder so an entry the scorer would refuse for size is
// refused here first, in the open: at most 4 screenshots of 256 KiB
// each; app/ at most 993 entries and 48 MiB with no path over 1000
// bytes; the dossier's source text capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Say what was handed in, so a local run shows at a glance that the
// bundle is complete: the app, its screenshots, and the dossier.
const appFiles = countFiles(join(outDir, 'app'));
const shotDir = join(outDir, 'screenshots');
const shotFiles = existsSync(shotDir) ? readdirSync(shotDir).length : 0;
console.log(
  `Sunset Cover Studio handed in: ${appFiles} app files, ` +
  `${shotFiles} screenshots, dossier.json (${Buffer.byteLength(dossier)} bytes) -> ${outDir}`,
);
