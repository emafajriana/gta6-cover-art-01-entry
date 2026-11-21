// app/src/cover.js — the painting engine of Sunset Cover Studio.
//
// paintCover() draws one finished poster onto a 2D context: photo
// panels under a colour grade, a hero portal that breaks the poster
// frame, and a headline lettered from the vector alphabet in
// glyphs.js (filled Path2D outlines in chrome, sunset or neon —
// never a typeface). The editor preview and the PNG export call the
// same paint, so the file a person downloads is the picture they
// were shown. Every random-looking finish (sparkles, grain) comes
// from a seeded generator, so the same state always paints the same
// cover, byte for byte.

import { fitSize, measureText, textPath } from './glyphs.js';

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const SLOT_NAMES = ['hero', 'back', 'left', 'right'];

export const SLOT_LABELS = {
  hero: 'Hero portrait',
  back: 'Backdrop scene',
  left: 'Second panel',
  right: 'Third panel',
};

// The studio's opening state: sample scenes in every slot, the
// pop-out layout, a sunset grade and a chrome headline.
export function defaultState() {
  return {
    size: 'wide',
    layout: 'popout',
    grade: 'sunset',
    titleStyle: 'chrome',
    caption: 'SUNSET HEIST',
    subtitle: 'A VICE CITY STORY',
    titleScale: 1,
    gradeStrength: 0.85,
    burst: 0.5,
    slots: {
      hero: { fx: 0.5, fy: 0.38, zoom: 1 },
      back: { fx: 0.5, fy: 0.5, zoom: 1 },
      left: { fx: 0.5, fy: 0.5, zoom: 1 },
      right: { fx: 0.5, fy: 0.45, zoom: 1 },
    },
  };
}

// A tiny deterministic generator (mulberry32). Finishes seeded from
// it look scattered but never change between renders, which keeps
// the preview, the export and the screenshots identical.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Colour grades ------------------------------------------------
// A grade is a gradient map: each pixel's luminance is pushed
// through a ramp of colour stops, then mixed back with the original
// by the strength the user asked for. The ramps are the studio's
// three house looks.

const GRADE_RAMPS = {
  sunset: [[0, [26, 10, 50]], [0.35, [124, 32, 88]], [0.62, [233, 85, 62]], [0.85, [255, 167, 66]], [1, [255, 237, 172]]],
  neon: [[0, [4, 33, 49]], [0.35, [15, 92, 112]], [0.6, [179, 44, 141]], [0.85, [255, 94, 169]], [1, [215, 255, 245]]],
  dusk: [[0, [17, 14, 45]], [0.4, [75, 44, 97]], [0.7, [197, 84, 111]], [1, [255, 215, 150]]],
};

function buildLut(stops) {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
  }
  return lut;
}

const LUTS = Object.fromEntries(Object.entries(GRADE_RAMPS).map(([name, stops]) => [name, buildLut(stops)]));

// Draw a source into a w x h box with cover-fit: the source fills
// the box, and fx/fy choose which part of the overflow is kept, so
// dragging a photo in the editor is just moving the focus point.
function drawFitted(ctx, source, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const iw = source.naturalWidth || source.width;
  const ih = source.naturalHeight || source.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(source, x - (dw - w) * fx, y - (dh - h) * fy, dw, dh);
}

// --- Lettering ----------------------------------------------------
// The headline is one Path2D from glyphs.js, fitted to its measure
// in a single arithmetic step, then painted: a hard offset shadow in
// magenta, a near-black keyline, and the style's fill on top.

function headlineFill(ctx, style, top, height) {
  if (style === 'sunset') {
    const g = ctx.createLinearGradient(0, top, 0, top + height);
    g.addColorStop(0, '#ffe259');
    g.addColorStop(0.45, '#ffa751');
    g.addColorStop(0.78, '#ff5e8a');
    g.addColorStop(1, '#c44dff');
    return g;
  }
  if (style === 'neon') return '#eaffff';
  // chrome: bright sky above a hard mirror line, deep water below it
  const g = ctx.createLinearGradient(0, top, 0, top + height);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.38, '#cfe6ff');
  g.addColorStop(0.49, '#5f7fa6');
  g.addColorStop(0.52, '#f2faff');
  g.addColorStop(0.58, '#8fb7d9');
  g.addColorStop(0.8, '#3d5a80');
  g.addColorStop(1, '#d9ecff');
  return g;
}

// Paints the caption centred at cx with its cap top at top, fitted
// to maxWidth and capped at maxCap pixels tall. Returns the cap
// height actually used, so the subtitle can be placed under it.
function paintHeadline(ctx, text, cx, top, maxWidth, maxCap, style) {
  const fitted = fitSize(text, maxWidth, 6);
  const size = Math.max(10, Math.min(fitted, maxCap));
  const width = measureText(text, size, 6);
  const x = cx - width / 2;
  const { path } = textPath(text, x, top, size, 6);
  ctx.save();
  ctx.lineJoin = 'round';
  if (style === 'neon') {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.35;
    ctx.fillStyle = '#ff71ce';
    ctx.fill(path, 'evenodd');
    ctx.shadowColor = '#01cdfe';
    ctx.shadowBlur = size * 0.22;
    ctx.fillStyle = '#eaffff';
    ctx.fill(path, 'evenodd');
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(10, 20, 40, 0.85)';
    ctx.lineWidth = Math.max(1, size * 0.045);
    ctx.stroke(path);
  } else {
    ctx.save();
    ctx.translate(size * 0.05, size * 0.055);
    ctx.fillStyle = 'rgba(255, 46, 136, 0.85)';
    ctx.fill(path, 'evenodd');
    ctx.restore();
    ctx.strokeStyle = '#160f24';
    ctx.lineWidth = size * 0.14;
    ctx.stroke(path);
    ctx.fillStyle = headlineFill(ctx, style, top, size);
    ctx.fill(path, 'evenodd');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = Math.max(1, size * 0.02);
    ctx.stroke(path);
  }
  ctx.restore();
  return size;
}

// The subtitle is the same vector alphabet, small and tracked wide,
// with a hand-drawn swoosh ruled under it.
function paintSubtitle(ctx, text, cx, top, size, colour) {
  if (!text) return 0;
  const tracking = 30;
  const width = measureText(text, size, tracking);
  const { path } = textPath(text, cx - width / 2, top, size, tracking);
  ctx.save();
  ctx.fillStyle = colour;
  ctx.fill(path, 'evenodd');
  const swooshY = top + size * 1.55;
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.52, swooshY);
  ctx.quadraticCurveTo(cx, swooshY + size * 0.5, cx + width * 0.52, swooshY);
  ctx.stroke();
  ctx.restore();
  return size * 1.9;
}

const SUBTITLE_COLOURS = { chrome: '#ffd166', sunset: '#fff3b0', neon: '#7df9ff' };

// --- Finishes -----------------------------------------------------

// A four-point sparkle star, the studio's burst finish.
function sparkle(ctx, cx, cy, r, colour, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

function paintSparkles(ctx, W, H, amount) {
  const count = Math.round(amount * 30);
  if (count <= 0) return;
  const rng = mulberry32(7101);
  for (let i = 0; i < count; i++) {
    const x = rng() * W;
    const y = rng() * H * 0.62;
    const r = (0.006 + rng() * 0.014) * W;
    sparkle(ctx, x, y, r, rng() > 0.4 ? '#ffffff' : '#ffd166', 0.35 + rng() * 0.55);
  }
}

let grainTile = null;
function paintGrain(ctx, W, H) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 240;
    grainTile.height = 240;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(240, 240);
    const rng = mulberry32(4177);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rng() * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paintVignette(ctx, W, H) {
  const r = Math.hypot(W, H) * 0.62;
  const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  g.addColorStop(0, 'rgba(8, 4, 18, 0)');
  g.addColorStop(1, 'rgba(8, 4, 18, 0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// --- The studio ---------------------------------------------------

export function createStudio(canvas) {
  const state = defaultState();
  const images = { hero: null, back: null, left: null, right: null };
  const gradedCache = new Map();

  // A photo pushed through the current grade at an exact size,
  // cached: panels repaint often while dragging, pixels do not.
  function graded(slot, w, h) {
    const img = images[slot];
    if (!img) return null;
    const key = [slot, w, h, state.grade, state.gradeStrength.toFixed(2),
      state.slots[slot].fx.toFixed(3), state.slots[slot].fy.toFixed(3), state.slots[slot].zoom.toFixed(3)].join('|');
    if (gradedCache.has(key)) return gradedCache.get(key);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    const s = state.slots[slot];
    drawFitted(g, img, 0, 0, c.width, c.height, s.fx, s.fy, s.zoom);
    const lut = LUTS[state.grade];
    const strength = state.gradeStrength;
    if (lut && strength > 0) {
      const data = g.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = Math.round(px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722);
        const li = lum * 3;
        px[i] += (lut[li] - px[i]) * strength;
        px[i + 1] += (lut[li + 1] - px[i + 1]) * strength;
        px[i + 2] += (lut[li + 2] - px[i + 2]) * strength;
      }
      g.putImageData(data, 0, 0);
    }
    if (gradedCache.size > 24) gradedCache.clear();
    gradedCache.set(key, c);
    return c;
  }

  // One photo panel with the studio's white keyline border. When a
  // slot is empty a dusk gradient and a lone sparkle stand in, so a
  // half-built cover still reads as a poster.
  function panel(x, y, w, h, slot, border) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    if (border > 0) {
      ctx.fillStyle = '#f7f3ea';
      ctx.fillRect(x - border, y - border, w + border * 2, h + border * 2);
    }
    const img = graded(slot, w, h);
    if (img) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#3b2a63');
      g.addColorStop(1, '#c94f6d');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      sparkle(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.16, '#ffffff', 0.8);
    }
    ctx.restore();
  }

  function paintPopout(ctx, W, H) {
    const m = Math.round(W * 0.03);
    const border = Math.max(3, W * 0.005);
    // Backdrop scene, graded, laid under everything and darkened a
    // touch so the panels and the portal sit proud of it.
    const bg = graded('back', W, H);
    if (bg) ctx.drawImage(bg, 0, 0, W, H);
    else panel(0, 0, W, H, 'back', 0);
    ctx.fillStyle = 'rgba(10, 6, 24, 0.20)';
    ctx.fillRect(0, 0, W, H);
    // Two stacked panels down the left side.
    const pw = W * 0.335;
    const gap = m * 0.7;
    const ph = (H * 0.62 - gap) / 2;
    panel(m, m, pw, ph, 'left', border);
    panel(m, m + ph + gap, pw, ph, 'right', border);
    // The poster frame: a clean white band round the edge. The
    // portal is painted after it, over it — that overlap is the
    // pop-out the studio is named for.
    ctx.strokeStyle = '#f7f3ea';
    ctx.lineWidth = Math.max(4, W * 0.008);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    // Hero portal: an oval of the hero photo, ringed magenta then
    // white, its crown spilling over the top frame line. A portrait
    // poster gets a wider, shorter oval, or the hero is squeezed
    // into an egg.
    const portrait = H > W * 1.1;
    const cx = W * (portrait ? 0.66 : 0.685);
    const cy = H * (portrait ? 0.395 : 0.415);
    const rx = W * (portrait ? 0.27 : 0.20);
    const ry = H * (portrait ? 0.335 : 0.375);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + border * 3.4, ry + border * 3.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2e88';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + border * 1.8, ry + border * 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f7f3ea';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    const hero = graded('hero', rx * 2, ry * 2);
    if (hero) ctx.drawImage(hero, cx - rx, cy - ry, rx * 2, ry * 2);
    else {
      const g = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
      g.addColorStop(0, '#3b2a63');
      g.addColorStop(1, '#c94f6d');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(10, 6, 24, 0.35)';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.stroke();
    // Title block along the foot, high enough that the subtitle
    // and its swoosh stay inside the poster.
    const capTop = H * 0.762;
    const size = paintHeadline(ctx, state.caption, W / 2, capTop, W * 0.9, H * 0.145 * state.titleScale, state.titleStyle);
    paintSubtitle(ctx, state.subtitle, W / 2, capTop + size * 1.14, size * 0.2, SUBTITLE_COLOURS[state.titleStyle]);
  }

  function paintPanels(ctx, W, H) {
    const m = Math.round(W * 0.03);
    const border = Math.max(3, W * 0.005);
    const bandH = H * 0.25;
    const gridH = H - bandH - m * 1.4;
    const gap = m * 0.6;
    const colW = (W - m * 2 - gap) / 2;
    const rowH = (gridH - gap) / 2;
    panel(m, m, colW, rowH, 'hero', border);
    panel(m + colW + gap, m, colW, rowH, 'back', border);
    panel(m, m + rowH + gap, colW, rowH, 'left', border);
    panel(m + colW + gap, m + rowH + gap, colW, rowH, 'right', border);
    // A dusk band carries the lettering clear of the photos.
    const bandY = m + gridH + m * 0.4;
    const g = ctx.createLinearGradient(0, bandY, 0, H);
    g.addColorStop(0, 'rgba(16, 10, 34, 0.88)');
    g.addColorStop(1, 'rgba(16, 10, 34, 0.97)');
    ctx.fillStyle = g;
    ctx.fillRect(0, bandY, W, H - bandY);
    const capTop = bandY + bandH * 0.14;
    const size = paintHeadline(ctx, state.caption, W / 2, capTop, W * 0.88, bandH * 0.52 * state.titleScale, state.titleStyle);
    paintSubtitle(ctx, state.subtitle, W / 2, capTop + size * 1.2, size * 0.22, SUBTITLE_COLOURS[state.titleStyle]);
  }

  function paintTilt(ctx, W, H) {
    // A bare gradient sky with a low sun: the one layout with no
    // backdrop photo, so tilted snapshots carry the picture.
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    if (state.grade === 'neon') {
      sky.addColorStop(0, '#0b1035');
      sky.addColorStop(0.6, '#3d1160');
      sky.addColorStop(1, '#0e2a3f');
    } else {
      sky.addColorStop(0, '#2a1450');
      sky.addColorStop(0.55, '#93356b');
      sky.addColorStop(0.8, '#ff7e47');
      sky.addColorStop(1, '#3a1c50');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.62, H * 0.30, 0, Math.PI * 2);
    ctx.fillStyle = state.grade === 'neon' ? 'rgba(1, 205, 254, 0.20)' : 'rgba(255, 190, 90, 0.35)';
    ctx.fill();
    ctx.restore();
    const border = Math.max(4, W * 0.008);
    const cards = [
      { slot: 'left', cx: W * 0.235, cy: H * 0.40, w: W * 0.335, h: H * 0.52, rot: -0.14 },
      { slot: 'right', cx: W * 0.765, cy: H * 0.40, w: W * 0.335, h: H * 0.52, rot: 0.11 },
      { slot: 'hero', cx: W * 0.5, cy: H * 0.42, w: W * 0.37, h: H * 0.58, rot: -0.03 },
    ];
    for (const card of cards) {
      ctx.save();
      ctx.translate(card.cx, card.cy);
      ctx.rotate(card.rot);
      ctx.shadowColor = 'rgba(5, 2, 14, 0.5)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.012;
      panel(-card.w / 2, -card.h / 2, card.w, card.h, card.slot, border);
      ctx.restore();
    }
    const capTop = H * 0.735;
    const size = paintHeadline(ctx, state.caption, W / 2, capTop, W * 0.9, H * 0.14 * state.titleScale, state.titleStyle);
    paintSubtitle(ctx, state.subtitle, W / 2, capTop + size * 1.16, size * 0.2, SUBTITLE_COLOURS[state.titleStyle]);
  }

  function render() {
    const { w, h } = SIZES[state.size];
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    if (state.layout === 'panels') paintPanels(ctx, w, h);
    else if (state.layout === 'tilt') paintTilt(ctx, w, h);
    else paintPopout(ctx, w, h);
    paintSparkles(ctx, w, h, state.burst);
    paintVignette(ctx, w, h);
    paintGrain(ctx, w, h);
  }

  return {
    state,
    images,
    render,
    setSlotImage(slot, img) {
      images[slot] = img;
      gradedCache.clear();
      render();
    },
    set(partial) {
      Object.assign(state, partial);
      render();
    },
    exportPNG(filename) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'sunset-cover.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, 'image/png');
    },
  };
}
