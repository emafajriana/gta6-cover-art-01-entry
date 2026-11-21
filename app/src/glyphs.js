// glyphs.js — the studio's hand-drawn vector lettering. Every glyph
// of the poster alphabet was drawn by hand as polygon coordinates on
// a 90-unit cap-height grid and is stored here as plain data: A–Z,
// 0–9 and the punctuation a caption needs. A headline is never set in
// a typeface — the renderer below walks the text, turns each glyph's
// polygons (and its counter holes) into one canvas Path2D, and the
// cover painter fills that path with chrome, sunset or neon. No font
// files, no fillText: the lettering is code, start to finish.
//
// Glyph space: x grows right from the glyph's left edge, y grows down
// from the cap top (0) to the baseline (90). p holds the filled
// outlines, h the counter holes (punched with an even-odd fill).
//
// Round 4 re-cut eight glyphs for a chunkier poster hand: A grew a
// pointed apex, M's vertex drops deeper, S's lower bowl rounds out,
// G's spur thickens, R's leg kicks further, Q's tail swings below
// the baseline, 4's crossbar rises, and 7 gains a crossbar of its
// own. Widths did not move, so the fitting arithmetic is untouched.

export const CAP_UNITS = 90;
const TRACK_UNITS = 5;

const GLYPHS = {
  A: { w: 74, p: [[0, 90, 30, 0, 44, 0, 74, 90, 56, 90, 50, 66, 24, 66, 18, 90]], h: [[37, 22, 44, 52, 30, 52]] },
  B: { w: 71, p: [[0, 0, 18, 0, 18, 90, 0, 90], [18, 0, 50, 0, 63, 5, 69, 15, 69, 25, 64, 35, 55, 41, 64, 47, 70, 57, 70, 71, 64, 83, 52, 90, 18, 90]], h: [[36, 14, 48, 14, 53, 20, 53, 27, 48, 32, 36, 32], [36, 56, 50, 56, 55, 62, 55, 71, 50, 78, 36, 78]] },
  C: { w: 70, p: [[70, 20, 58, 6, 40, 0, 22, 4, 8, 16, 2, 34, 2, 56, 8, 74, 22, 86, 40, 90, 58, 84, 70, 70, 56, 62, 47, 72, 36, 74, 24, 70, 17, 58, 17, 32, 24, 20, 36, 16, 47, 18, 56, 28]] },
  D: { w: 70, p: [[0, 0, 44, 0, 60, 10, 69, 28, 69, 62, 60, 80, 44, 90, 0, 90]], h: [[36, 16, 46, 16, 54, 28, 54, 62, 46, 74, 36, 74]] },
  E: { w: 62, p: [[0, 0, 62, 0, 62, 16, 18, 16, 18, 36, 54, 36, 54, 52, 18, 52, 18, 74, 62, 74, 62, 90, 0, 90]] },
  F: { w: 60, p: [[0, 0, 60, 0, 60, 16, 18, 16, 18, 38, 50, 38, 50, 54, 18, 54, 18, 90, 0, 90]] },
  G: { w: 72, p: [[72, 22, 59, 6, 41, 0, 23, 4, 9, 16, 3, 34, 3, 56, 9, 74, 23, 86, 41, 90, 56, 86, 66, 77, 72, 66, 72, 48, 40, 48, 40, 65, 58, 65, 58, 71, 48, 74, 35, 74, 25, 69, 19, 57, 19, 33, 25, 21, 35, 16, 48, 16, 58, 24, 64, 32, 72, 36]] },
  H: { w: 70, p: [[0, 0, 18, 0, 18, 36, 52, 36, 52, 0, 70, 0, 70, 90, 52, 90, 52, 54, 18, 54, 18, 90, 0, 90]] },
  I: { w: 36, p: [[0, 0, 36, 0, 36, 15, 27, 15, 27, 75, 36, 75, 36, 90, 0, 90, 0, 75, 9, 75, 9, 15, 0, 15]] },
  J: { w: 56, p: [[40, 0, 58, 0, 58, 64, 52, 80, 40, 89, 24, 90, 10, 84, 2, 72, 14, 62, 22, 70, 30, 73, 38, 70, 40, 60]] },
  K: { w: 68, p: [[0, 0, 18, 0, 18, 90, 0, 90], [20, 38, 44, 0, 64, 0, 30, 46], [28, 42, 68, 90, 47, 90, 20, 50]] },
  L: { w: 58, p: [[0, 0, 18, 0, 18, 74, 58, 74, 58, 90, 0, 90]] },
  M: { w: 84, p: [[0, 90, 0, 0, 22, 0, 42, 38, 64, 0, 84, 0, 84, 90, 66, 90, 66, 38, 42, 70, 18, 38, 18, 90]] },
  N: { w: 72, p: [[0, 90, 0, 0, 20, 0, 54, 56, 54, 0, 72, 0, 72, 90, 52, 90, 18, 34, 18, 90]] },
  O: { w: 72, p: [[36, 0, 54, 4, 66, 16, 71, 34, 71, 56, 66, 74, 54, 86, 36, 90, 18, 86, 6, 74, 1, 56, 1, 34, 6, 16, 18, 4]], h: [[36, 17, 47, 20, 54, 30, 54, 60, 47, 70, 36, 73, 25, 70, 18, 60, 18, 30, 25, 20]] },
  P: { w: 68, p: [[0, 0, 44, 0, 58, 7, 66, 20, 66, 34, 58, 47, 44, 54, 18, 54, 18, 90, 0, 90]], h: [[18, 15, 43, 15, 49, 21, 49, 32, 43, 38, 18, 38]] },
  Q: { w: 72, p: [[36, 0, 54, 4, 66, 16, 71, 34, 71, 56, 66, 74, 54, 86, 36, 90, 18, 86, 6, 74, 1, 56, 1, 34, 6, 16, 18, 4], [42, 60, 74, 93, 57, 93, 36, 68]], h: [[36, 17, 47, 20, 54, 30, 54, 60, 47, 70, 36, 73, 25, 70, 18, 60, 18, 30, 25, 20]] },
  R: { w: 68, p: [[0, 0, 44, 0, 58, 7, 66, 20, 66, 34, 58, 47, 44, 54, 18, 54, 18, 90, 0, 90], [38, 52, 68, 90, 50, 90, 27, 56]], h: [[18, 15, 43, 15, 49, 21, 49, 32, 43, 38, 18, 38]] },
  S: { w: 66, p: [[64, 18, 50, 3, 34, 0, 19, 4, 8, 16, 8, 30, 14, 40, 24, 46, 44, 52, 54, 58, 61, 67, 59, 79, 47, 88, 30, 90, 15, 86, 4, 74, 16, 64, 26, 73, 38, 74, 46, 70, 46, 62, 40, 56, 20, 49, 10, 42, 4, 31, 6, 17, 16, 7, 30, 2, 46, 3, 58, 10]] },
  T: { w: 66, p: [[0, 0, 66, 0, 66, 16, 42, 16, 42, 90, 24, 90, 24, 16, 0, 16]] },
  U: { w: 70, p: [[0, 0, 18, 0, 18, 58, 22, 70, 28, 75, 42, 75, 48, 70, 52, 58, 52, 0, 70, 0, 70, 58, 64, 76, 52, 87, 36, 90, 20, 87, 8, 76, 0, 58]] },
  V: { w: 70, p: [[0, 0, 18, 0, 35, 64, 52, 0, 70, 0, 44, 90, 26, 90]] },
  W: { w: 84, p: [[0, 0, 0, 90, 22, 90, 42, 60, 64, 90, 84, 90, 84, 0, 66, 0, 66, 56, 42, 24, 18, 56, 18, 0]] },
  X: { w: 68, p: [[0, 0, 20, 0, 34, 26, 48, 0, 68, 0, 44, 45, 68, 90, 48, 90, 34, 62, 20, 90, 0, 90, 24, 45]] },
  Y: { w: 72, p: [[0, 0, 19, 0, 36, 32, 55, 0, 72, 0, 45, 52, 45, 90, 27, 90, 27, 52]] },
  Z: { w: 64, p: [[0, 0, 64, 0, 64, 14, 22, 74, 64, 74, 64, 90, 0, 90, 0, 76, 42, 16, 0, 16]] },
  0: { w: 66, p: [[33, 0, 49, 4, 59, 16, 64, 34, 64, 56, 59, 74, 49, 86, 33, 90, 17, 86, 7, 74, 2, 56, 2, 34, 7, 16, 17, 4]], h: [[33, 17, 42, 20, 48, 30, 48, 60, 42, 70, 33, 73, 24, 70, 18, 60, 18, 30, 24, 20]] },
  1: { w: 40, p: [[6, 22, 28, 0, 28, 74, 40, 74, 40, 90, 0, 90, 0, 74, 12, 74, 12, 34, 2, 42]] },
  2: { w: 64, p: [[6, 26, 14, 8, 30, 0, 46, 2, 58, 12, 58, 26, 50, 38, 16, 74, 58, 74, 58, 90, 2, 90, 2, 78, 36, 36, 42, 26, 42, 18, 34, 14, 22, 16, 16, 24, 14, 32]] },
  3: { w: 64, p: [[8, 4, 30, 0, 48, 4, 58, 16, 56, 30, 46, 40, 56, 48, 60, 62, 54, 78, 40, 88, 20, 90, 6, 82, 14, 68, 28, 74, 40, 72, 44, 62, 38, 52, 22, 48, 22, 34, 36, 32, 42, 24, 38, 16, 24, 14, 14, 18]] },
  4: { w: 68, p: [[40, 0, 56, 0, 56, 32, 68, 32, 68, 48, 56, 48, 56, 90, 40, 90, 40, 48, 0, 48, 0, 36]] },
  5: { w: 62, p: [[8, 0, 58, 0, 58, 16, 22, 16, 22, 33, 36, 30, 50, 36, 59, 50, 59, 67, 51, 81, 35, 90, 18, 89, 6, 80, 15, 67, 29, 74, 41, 72, 44, 62, 38, 52, 24, 49, 8, 54]] },
  6: { w: 64, p: [[50, 2, 60, 14, 63, 32, 63, 58, 58, 76, 46, 87, 30, 90, 14, 84, 5, 70, 2, 50, 4, 30, 12, 14, 24, 4, 38, 0], [14, 44, 44, 6, 56, 12, 30, 48]], h: [[32, 52, 43, 55, 48, 64, 48, 72, 43, 79, 32, 81, 22, 79, 16, 71, 16, 63, 21, 55]] },
  7: { w: 62, p: [[0, 0, 62, 0, 62, 13, 30, 90, 13, 90, 22, 64, 6, 64, 6, 52, 26, 52, 38, 16, 0, 16]] },
  8: { w: 64, p: [[32, 0, 46, 3, 55, 12, 55, 24, 50, 34, 56, 42, 59, 54, 55, 72, 46, 85, 32, 90, 18, 85, 9, 72, 5, 54, 8, 42, 14, 34, 9, 24, 9, 12, 18, 3]], h: [[32, 13, 39, 15, 41, 21, 41, 27, 39, 32, 32, 34, 25, 32, 23, 27, 23, 21, 25, 15], [32, 50, 41, 53, 44, 61, 44, 70, 41, 78, 32, 80, 23, 78, 20, 70, 20, 61, 23, 53]] },
  9: { w: 64, p: [[14, 88, 4, 76, 1, 58, 1, 32, 6, 14, 18, 3, 34, 0, 50, 6, 59, 20, 62, 40, 60, 60, 52, 76, 40, 86, 26, 90], [50, 46, 20, 84, 8, 78, 34, 42]], h: [[32, 38, 43, 35, 48, 27, 48, 19, 43, 11, 32, 9, 22, 11, 16, 18, 16, 26, 21, 35]] },
  '.': { w: 20, p: [[2, 74, 18, 74, 18, 90, 2, 90]] },
  ',': { w: 20, p: [[5, 72, 17, 72, 15, 84, 8, 92, 3, 90, 8, 80]] },
  '!': { w: 20, p: [[3, 0, 17, 0, 15, 58, 5, 58], [3, 72, 17, 72, 17, 90, 3, 90]] },
  "'": { w: 16, p: [[3, 0, 15, 0, 11, 18, 3, 20]] },
  '-': { w: 44, p: [[2, 38, 42, 38, 42, 52, 2, 52]] },
  ':': { w: 20, p: [[3, 16, 17, 16, 17, 32, 3, 32], [3, 58, 17, 58, 17, 74, 3, 74]] },
  '?': { w: 60, p: [[6, 22, 12, 8, 26, 1, 42, 1, 54, 9, 56, 22, 50, 34, 38, 42, 36, 56, 22, 56, 22, 38, 30, 30, 38, 24, 38, 16, 30, 13, 20, 15, 15, 22, 14, 28], [23, 72, 37, 72, 37, 88, 23, 88]] },
  '/': { w: 62, p: [[46, 0, 58, 0, 16, 90, 4, 90]] },
};

// ---------------------------------------------------------------------
// The renderer. A glyph becomes a Path2D once and is reused; a whole
// line of text becomes one Path2D in glyph space (x from 0 to the
// line's width in units, y from the cap top 0 to the baseline 90), so
// the painter can place it with a single transform and fill, stroke
// and clip it as one lettered object.
// ---------------------------------------------------------------------

const glyphPathCache = new Map();
const textPathCache = new Map();

function tracePolygon(path, flat) {
  path.moveTo(flat[0], flat[1]);
  for (let i = 2; i < flat.length; i += 2) path.lineTo(flat[i], flat[i + 1]);
  path.closePath();
}

function glyphPath(ch) {
  let path = glyphPathCache.get(ch);
  if (path) return path;
  const glyph = GLYPHS[ch];
  path = new Path2D();
  if (glyph) {
    for (const poly of glyph.p) tracePolygon(path, poly);
    for (const hole of glyph.h || []) tracePolygon(path, hole);
  }
  glyphPathCache.set(ch, path);
  return path;
}

// The line's width in glyph units, tracking included.
export function vectorTextWidth(text) {
  const chars = [...String(text).toUpperCase()];
  let width = 0;
  chars.forEach((ch, i) => {
    if (i > 0) width += TRACK_UNITS;
    width += ch === ' ' ? 34 : (GLYPHS[ch] ? GLYPHS[ch].w : 34);
  });
  return width;
}

// One Path2D holding the whole line, in glyph space. Fill it with
// 'evenodd' so the counter holes punch through.
export function buildTextPath(text) {
  const key = String(text).toUpperCase();
  let built = textPathCache.get(key);
  if (built) return built;
  const path = new Path2D();
  let cursor = 0;
  for (const ch of key) {
    if (ch !== ' ') {
      path.addPath(glyphPath(ch), new DOMMatrix().translate(cursor, 0));
      cursor += (GLYPHS[ch] ? GLYPHS[ch].w : 34) + TRACK_UNITS;
    } else {
      cursor += 34 + TRACK_UNITS;
    }
  }
  built = { path, width: Math.max(0, cursor - TRACK_UNITS) };
  textPathCache.set(key, built);
  return built;
}

// How many glyphs the alphabet ships — the UI names the feature with
// this count, so it is counted, not remembered.
export const GLYPH_COUNT = Object.keys(GLYPHS).length;
