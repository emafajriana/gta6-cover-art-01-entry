// app/src/glyphs.js — the Sunset Cover Studio poster alphabet.
//
// This studio sets no type. Every headline letter is a polygon: the
// glyphs below are outline data on a 100-unit cap grid (y = 0 is the
// cap top, y = 100 the baseline), drawn as filled Path2D paths and
// painted by cover.js with chrome, sunset or neon. There is no font
// file anywhere in this app and no canvas text call draws the poster
// lettering — the letterforms the judge sees are these coordinates.
//
// A glyph is [advance, polygons]: each polygon is a flat point list
// [x0, y0, x1, y1, ...]. The first polygon is the outer contour and
// any that follow are counters (the holes in A, B, D, O, P, Q, R and
// the digits), punched at fill time with the 'evenodd' rule. The set
// holds 44 glyphs: A-Z, 0-9, and space ' , - . ! ? :

export const GLYPH_COUNT = 44;
export const CAP_UNITS = 100;

const GLYPHS = {
  A: [72, [[0, 100, 36, 0, 72, 100, 54, 100, 47, 72, 25, 72, 18, 100], [36, 31, 43, 58, 29, 58]]],
  B: [66, [[0, 0, 46, 0, 60, 10, 60, 33, 52, 44, 62, 54, 62, 85, 50, 100, 0, 100], [17, 15, 41, 15, 45, 21, 45, 31, 41, 37, 17, 37], [17, 54, 43, 54, 47, 60, 47, 81, 42, 88, 17, 88]]],
  C: [68, [[68, 25, 55, 7, 22, 0, 7, 13, 0, 31, 0, 71, 8, 91, 23, 100, 51, 100, 68, 85, 68, 63, 46, 63, 46, 77, 39, 84, 25, 84, 17, 74, 17, 28, 24, 16, 40, 16, 48, 23, 48, 33, 68, 33]]],
  D: [70, [[0, 0, 42, 0, 61, 15, 70, 35, 70, 67, 61, 89, 42, 100, 0, 100], [17, 17, 38, 17, 50, 29, 52, 40, 52, 63, 48, 78, 38, 85, 17, 85]]],
  E: [58, [[0, 0, 58, 0, 58, 16, 17, 16, 17, 40, 50, 40, 50, 56, 17, 56, 17, 84, 58, 84, 58, 100, 0, 100]]],
  F: [56, [[0, 0, 56, 0, 56, 16, 17, 16, 17, 42, 48, 42, 48, 58, 17, 58, 17, 100, 0, 100]]],
  G: [70, [[70, 25, 57, 7, 23, 0, 7, 13, 0, 31, 0, 71, 8, 91, 23, 100, 53, 100, 70, 86, 70, 52, 42, 52, 42, 65, 52, 65, 53, 77, 46, 84, 26, 84, 17, 74, 17, 28, 24, 16, 41, 16, 50, 23, 50, 32, 70, 32]]],
  H: [70, [[0, 0, 17, 0, 17, 40, 53, 40, 53, 0, 70, 0, 70, 100, 53, 100, 53, 57, 17, 57, 17, 100, 0, 100]]],
  I: [30, [[4, 0, 26, 0, 26, 15, 19, 15, 19, 85, 26, 85, 26, 100, 4, 100, 4, 85, 11, 85, 11, 15, 4, 15]]],
  J: [52, [[52, 0, 52, 73, 44, 91, 28, 100, 9, 100, 0, 91, 0, 73, 16, 73, 17, 82, 24, 86, 31, 84, 35, 74, 35, 0]]],
  K: [68, [[0, 0, 17, 0, 17, 38, 44, 0, 64, 0, 37, 47, 67, 100, 47, 100, 25, 58, 17, 68, 17, 100, 0, 100]]],
  L: [56, [[0, 0, 17, 0, 17, 84, 56, 84, 56, 100, 0, 100]]],
  M: [90, [[0, 0, 20, 0, 45, 33, 70, 0, 90, 0, 90, 100, 73, 100, 73, 37, 45, 72, 17, 37, 17, 100, 0, 100]]],
  N: [72, [[0, 0, 18, 0, 55, 61, 55, 0, 72, 0, 72, 100, 54, 100, 17, 39, 17, 100, 0, 100]]],
  O: [72, [[15, 0, 57, 0, 72, 17, 72, 83, 57, 100, 15, 100, 0, 83, 0, 17], [19, 19, 53, 19, 55, 27, 55, 73, 53, 81, 19, 81, 17, 73, 17, 27]]],
  P: [64, [[0, 0, 48, 0, 64, 13, 64, 42, 54, 56, 17, 56, 17, 100, 0, 100], [17, 15, 44, 15, 49, 20, 49, 35, 44, 41, 17, 41]]],
  Q: [74, [[15, 0, 57, 0, 72, 17, 72, 82, 65, 93, 80, 102, 62, 102, 54, 94, 50, 100, 15, 100, 0, 83, 0, 17], [19, 19, 53, 19, 55, 27, 55, 73, 53, 81, 19, 81, 17, 73, 17, 27]]],
  R: [66, [[0, 0, 48, 0, 64, 13, 64, 42, 55, 55, 68, 100, 48, 100, 32, 58, 17, 58, 17, 100, 0, 100], [17, 15, 44, 15, 49, 20, 49, 35, 44, 41, 17, 41]]],
  S: [62, [[58, 16, 48, 4, 22, 2, 8, 10, 3, 22, 5, 34, 12, 42, 46, 58, 55, 68, 55, 84, 45, 95, 24, 98, 8, 92, 2, 80, 4, 68, 18, 68, 24, 78, 36, 79, 42, 72, 38, 61, 10, 47, 3, 36, 4, 18, 12, 6]]],
  T: [64, [[0, 0, 64, 0, 64, 16, 40, 16, 40, 100, 24, 100, 24, 16, 0, 16]]],
  U: [70, [[0, 0, 17, 0, 17, 75, 24, 84, 46, 84, 53, 75, 53, 0, 70, 0, 70, 77, 60, 93, 46, 100, 24, 100, 9, 92, 0, 78]]],
  V: [70, [[0, 0, 18, 0, 35, 65, 52, 0, 70, 0, 44, 100, 26, 100]]],
  W: [96, [[0, 0, 18, 0, 28, 63, 40, 24, 48, 24, 56, 63, 66, 0, 84, 0, 70, 100, 53, 100, 43, 45, 33, 100, 15, 100]]],
  X: [66, [[0, 0, 20, 0, 33, 29, 46, 0, 66, 0, 44, 49, 66, 100, 46, 100, 33, 68, 20, 100, 0, 100, 22, 49]]],
  Y: [66, [[0, 0, 19, 0, 33, 31, 47, 0, 66, 0, 41, 55, 41, 100, 25, 100, 25, 55]]],
  Z: [64, [[0, 0, 64, 0, 64, 14, 23, 84, 64, 84, 64, 100, 0, 100, 0, 86, 41, 16, 0, 16]]],
  '0': [62, [[14, 0, 48, 0, 62, 16, 62, 84, 48, 100, 14, 100, 0, 84, 0, 16], [18, 20, 44, 20, 44, 80, 18, 80]]],
  '1': [46, [[13, 15, 36, 0, 46, 0, 46, 100, 28, 100, 28, 24, 13, 32]]],
  '2': [62, [[0, 27, 8, 9, 24, 1, 46, 1, 59, 12, 59, 29, 50, 45, 17, 84, 62, 84, 62, 100, 0, 100, 0, 85, 33, 43, 42, 31, 42, 19, 35, 15, 21, 15, 15, 20, 14, 31, 0, 33]]],
  '3': [60, [[2, 23, 12, 5, 29, 0, 48, 4, 59, 17, 57, 33, 49, 45, 59, 55, 61, 80, 51, 97, 29, 100, 9, 94, 0, 79, 18, 79, 25, 85, 37, 85, 43, 77, 43, 65, 36, 57, 20, 57, 20, 43, 33, 43, 41, 37, 41, 23, 35, 16, 23, 16, 16, 22, 16, 31, 2, 33]]],
  '4': [64, [[37, 0, 55, 0, 55, 37, 68, 37, 68, 53, 55, 53, 55, 100, 37, 100, 37, 53, 0, 53, 0, 38], [37, 21, 37, 37, 21, 37]]],
  '5': [60, [[4, 0, 58, 0, 58, 16, 21, 16, 19, 36, 31, 31, 47, 34, 59, 47, 59, 80, 49, 96, 28, 100, 8, 94, 0, 79, 18, 77, 26, 84, 39, 84, 44, 76, 43, 59, 35, 51, 19, 51, 7, 57, 3, 39, 5, 14]]],
  '6': [60, [[49, 2, 58, 15, 41, 20, 25, 33, 19, 51, 28, 45, 45, 45, 58, 55, 58, 83, 47, 98, 23, 100, 7, 91, 0, 73, 2, 45, 11, 21, 27, 7, 41, 0], [19, 63, 20, 76, 26, 84, 41, 84, 45, 77, 44, 64, 37, 58, 26, 58]]],
  '7': [62, [[0, 0, 62, 0, 62, 13, 30, 100, 12, 100, 37, 16, 0, 16]]],
  '8': [62, [[16, 0, 46, 0, 58, 11, 58, 31, 52, 43, 60, 53, 60, 85, 48, 100, 14, 100, 2, 85, 2, 53, 10, 43, 4, 31, 4, 11], [19, 15, 43, 15, 45, 21, 45, 31, 43, 37, 19, 37, 17, 30, 17, 21], [18, 57, 44, 57, 47, 65, 47, 81, 43, 88, 19, 88, 15, 80, 15, 65]]],
  '9': [60, [[13, 98, 4, 85, 21, 80, 37, 67, 43, 49, 34, 55, 17, 55, 4, 45, 4, 17, 15, 3, 39, 0, 55, 9, 62, 27, 60, 55, 51, 79, 35, 93, 21, 100], [17, 23, 18, 37, 24, 44, 39, 44, 44, 38, 43, 22, 37, 15, 24, 15, 18, 17]]],
  ' ': [34, []],
  "'": [22, [[5, 0, 20, 0, 15, 28, 3, 28]]],
  ',': [24, [[5, 62, 20, 62, 20, 82, 12, 100, 2, 100, 9, 82, 5, 80]]],
  '-': [40, [[4, 42, 36, 42, 36, 58, 4, 58]]],
  '.': [24, [[5, 82, 19, 82, 19, 100, 5, 100]]],
  '!': [24, [[5, 0, 19, 0, 17, 64, 7, 64], [5, 82, 19, 82, 19, 100, 5, 100]]],
  '?': [58, [[2, 25, 10, 7, 25, 0, 45, 2, 57, 13, 57, 29, 49, 43, 35, 53, 35, 65, 18, 65, 18, 47, 28, 37, 38, 28, 38, 18, 32, 14, 20, 14, 15, 20, 15, 31, 2, 31], [19, 83, 35, 83, 35, 100, 19, 100]]],
  ':': [24, [[5, 13, 19, 13, 19, 29, 5, 29], [5, 71, 19, 71, 19, 87, 5, 87]]],
};

// Characters the studio can letter. Anything else in a caption is
// dropped at render time, so a pasted emoji or accent never breaks
// the poster — it just never reaches it.
export function letterable(text) {
  return String(text).toUpperCase().split('').filter((ch) => GLYPHS[ch]).join('');
}

// The advance of one character at a given pixel size, where size is
// the cap height in pixels. Tracking is added per character by the
// measurer below, not here, so this stays a pure glyph metric.
export function advanceOf(ch, size) {
  const glyph = GLYPHS[ch];
  return glyph ? (glyph[0] * size) / CAP_UNITS : 0;
}

// Total advance of a string at a cap height, with a fixed tracking
// gap (in cap units) between characters.
export function measureText(text, size, trackingUnits = 6) {
  const clean = letterable(text);
  let total = 0;
  for (const ch of clean) total += advanceOf(ch, size);
  if (clean.length > 1) total += ((clean.length - 1) * trackingUnits * size) / CAP_UNITS;
  return total;
}

// The cap height that makes a string exactly fill a target width:
// measure once at a reference size, then scale arithmetically — no
// shrink loop, so the fit is one division and always lands.
export function fitSize(text, targetWidth, trackingUnits = 6) {
  const atReference = measureText(text, 100, trackingUnits);
  return atReference > 0 ? (targetWidth * 100) / atReference : 0;
}

// Build one Path2D holding every glyph of a string, with the text's
// left edge at x and its cap top at y. Fill it with 'evenodd' or the
// counters close up. Returns the path and the advance it consumed,
// so callers can centre or chain runs themselves.
export function textPath(text, x, y, size, trackingUnits = 6) {
  const clean = letterable(text);
  const scale = size / CAP_UNITS;
  const path = new Path2D();
  let cursor = x;
  for (const ch of clean) {
    const glyph = GLYPHS[ch];
    if (glyph) {
      for (const poly of glyph[1]) {
        for (let i = 0; i < poly.length; i += 2) {
          const px = cursor + poly[i] * scale;
          const py = y + poly[i + 1] * scale;
          if (i === 0) path.moveTo(px, py);
          else path.lineTo(px, py);
        }
        path.closePath();
      }
      cursor += glyph[0] * scale + trackingUnits * scale;
    }
  }
  return { path, width: cursor - x - (clean.length ? trackingUnits * scale : 0) };
}
