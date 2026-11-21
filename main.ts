// main.ts — Sunset Cover Studio's hand-in program for the make.fun
// gta6-cover-art-01 competition (Node 22, standard library only).
//
// The entry is the static web app under app/: open app/index.html in
// a desktop browser and it runs offline, turning a photo and a
// caption into multi-panel GTA-poster-style cover art. Its headline
// lettering is not a font — app/src/glyphs.js holds a poster
// alphabet as polygon data written for this studio, and
// app/src/cover.js fills those outlines with chrome, sunset or
// neon. No font files exist anywhere in the entry.
//
// This program does the handing in, and nothing else: it copies
// app/ and screenshots/ from beside this file into the output
// directory, then writes dossier.json there with buildDossier from
// the kit's vendored library (vendor/makefun-app.ts, kept byte for
// byte as the kit ships it, because the gate rebuilds the dossier
// with its own copy and compares the two).
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// How many plain files a copied tree holds, counted by a short
// recursion — the app tree is a handful of directories deep, so the
// walk never gets anywhere near the call stack's ceiling.
function tallyFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += tallyFiles(join(dir, entry.name));
    else if (entry.isFile()) count += 1;
  }
  return count;
}

// Stage the two trees. The screenshots folder is copied when the
// repository carries one (a valid entry holds 3 or 4 shots).
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
const shotsSource = join(repoRoot, 'screenshots');
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier, built under the scorer's own caps for this
// competition, so an entry the scorer would refuse for size is
// refused here first, in the open: at most 4 screenshots of
// 256 KiB each; app/ at most 993 entries and 48 MiB in all, with no
// path over 1000 bytes; the dossier's source text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// One line saying what was handed in, so a local run shows at a
// glance that the bundle is complete.
const appFiles = tallyFiles(join(outputDir, 'app'));
const shotDir = join(outputDir, 'screenshots');
const shotFiles = existsSync(shotDir) ? readdirSync(shotDir).length : 0;
console.log(
  `Sunset Cover Studio handed in: ${appFiles} app files, ` +
  `${shotFiles} screenshots, dossier.json (${dossier.byteLength} bytes) -> ${outputDir}`,
);
