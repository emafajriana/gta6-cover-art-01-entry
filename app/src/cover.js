// cover.js — every pixel of a Sunset Cover Studio poster is painted
// here. paintCover(ctx, W, H, state) draws one finished cover: a grid
// of photo panels under a colour grade, a lettered title band along
// the foot, and print finishes (poster frame, vignette, film grain).
// The editor's live preview and the PNG exporter both call this one
// function, so the file a user downloads is the picture they saw.
//
// The signature is POP-OUT: in the pop-out layout the hero panel's
// star is painted a second time, standing taller than its panel, so
// the subject breaks the frame — feet on the panel's bottom edge,
// head and shoulders spilling over the top border and across the
// gutter, ringed by a white keyline grown from the subject's own
// silhouette. Head it with the retro-chrome title (a hard-horizon
// metal gradient, bevel stroke, magenta/cyan offset shadows) and the
// poster reads like an eighties arcade marquee.
//
// Lettering ships NO font files. Headlines are set in a heavy
// condensed system stack and squeezed a touch further on the canvas;
// the chrome is gradient and shadow work, not a typeface. Everything
// on the poster is drawn in code from the user's own photos.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080', name: 'Square post' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350', name: 'Portrait post' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080', name: 'Wide banner' },
};

export const GRADES = {
  sunset: { name: 'Sunset', hint: 'golden-hour pinks and oranges' },
  neon: { name: 'Neon Nights', hint: 'magenta and cyan street light' },
  dusk: { name: 'Dusk', hint: 'deep purple evening haze' },
  mono: { name: 'Mono', hint: 'hard black and white contrast' },
};

export const LAYOUTS = {
  popout: { name: '★ Pop-Out', panels: 3 },
  hero: { name: 'Hero + three', panels: 4 },
  full: { name: 'Full bleed', panels: 1 },
  duo: { name: 'Duo split', panels: 2 },
  trio: { name: 'Trio strip', panels: 3 },
  grid: { name: 'Four grid', panels: 4 },
  tilt: { name: 'Tilted stack', panels: 3 },
};

export const TITLE_STYLES = {
  chrome: { name: 'Retro Chrome', hint: 'metallic 80s headline with offset shadows' },
  sunset: { name: 'Sunset', hint: 'warm gradient fill, black outline' },
  neon: { name: 'Neon Glow', hint: 'bright tube lettering on dark plum' },
};

// Heavy condensed faces every desktop already owns, in falling order;
// the canvas squeeze below narrows whichever one loads, so the
// headline keeps its tall poster proportions on any machine.
const HEADLINE_STACK =
  '"Arial Narrow", "Liberation Sans Narrow", Impact, "Franklin Gothic Medium", sans-serif';
const TAGLINE_STACK =
  '"Segoe Script", "Bradley Hand", "Comic Sans MS", cursive';
const HEADLINE_SQUEEZE = 0.84;

function headlineFont(size) {
  return `900 ${size}px ${HEADLINE_STACK}`;
}

// ---------------------------------------------------------------------
// Panel geometry. layoutPanels returns rects {x, y, w, h, rot} in
// poster pixels. The title band owns the bottom BAND_SHARE of the
// height; the panels share the rest.
// ---------------------------------------------------------------------

const BAND_SHARE = 0.19;

export function layoutPanels(layout, W, H) {
  const panelFloor = H * (1 - BAND_SHARE);
  const gap = Math.max(6, Math.round(W * 0.008));
  switch (layout) {
    case 'full':
      return [{ x: 0, y: 0, w: W, h: panelFloor, rot: 0 }];
    case 'duo':
      return [
        { x: 0, y: 0, w: (W - gap) / 2, h: panelFloor, rot: 0 },
        { x: (W + gap) / 2, y: 0, w: (W - gap) / 2, h: panelFloor, rot: 0 },
      ];
    case 'trio':
      return [0, 1, 2].map((i) => ({
        x: ((W + gap) / 3) * i,
        y: 0,
        w: (W - 2 * gap) / 3,
        h: panelFloor,
        rot: 0,
      }));
    case 'grid': {
      const cellW = (W - gap) / 2;
      const cellH = (panelFloor - gap) / 2;
      return [
        { x: 0, y: 0, w: cellW, h: cellH, rot: 0 },
        { x: cellW + gap, y: 0, w: cellW, h: cellH, rot: 0 },
        { x: 0, y: cellH + gap, w: cellW, h: cellH, rot: 0 },
        { x: cellW + gap, y: cellH + gap, w: cellW, h: cellH, rot: 0 },
      ];
    }
    case 'hero':
    case 'popout': {
      // A wide hero panel with a two-high column beside it. Pop-Out
      // drops the whole grid by a headroom strip so its star can
      // burst up over the hero's top edge and stay on the poster.
      const drop = layout === 'popout' ? Math.round(H * 0.09) : 0;
      const heroW = Math.round(W * 0.6);
      const colX = heroW + gap;
      const colW = W - colX;
      const cellH = (panelFloor - drop - gap) / 2;
      return [
        { x: 0, y: drop, w: heroW, h: panelFloor - drop, rot: 0 },
        { x: colX, y: drop, w: colW, h: cellH, rot: 0 },
        { x: colX, y: drop + cellH + gap, w: colW, h: cellH, rot: 0 },
      ];
    }
    case 'tilt': {
      const pw = W * 0.47;
      const ph = panelFloor * 0.8;
      return [
        { x: W * 0.015, y: panelFloor * 0.03, w: pw, h: ph, rot: -0.055 },
        { x: W * 0.515, y: panelFloor * 0.09, w: pw, h: ph, rot: 0.048 },
        { x: W * 0.265, y: panelFloor * 0.17, w: pw, h: ph, rot: -0.014 },
      ];
    }
    default:
      return [{ x: 0, y: 0, w: W, h: panelFloor, rot: 0 }];
  }
}

// ---------------------------------------------------------------------
// Photos and grades.
// ---------------------------------------------------------------------

// Cover-fit img into rect (fill it, crop the overflow), honouring the
// user's zoom (1 = plain cover-fit) and pan (fractions of the rect,
// -0.5..0.5). The caller clips to the rect first.
export function drawPhotoIn(ctx, img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (zoom > 0 ? zoom : 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (oy || 0) * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// The CSS filter a grade lays on the photo itself; the tinted washes
// in washPanel do the rest of the colour work.
function filterForGrade(grade) {
  switch (grade) {
    case 'neon': return 'saturate(1.5) contrast(1.07) brightness(1.02)';
    case 'dusk': return 'saturate(0.9) contrast(1.05)';
    case 'mono': return 'grayscale(1) contrast(1.15) brightness(1.03)';
    default: return 'saturate(1.14) contrast(1.04)';
  }
}

// Tinted light over one panel; the caller clips to the panel first.
function washPanel(ctx, rect, grade, strength) {
  const { x, y, w, h } = rect;
  if (grade === 'sunset') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255,120,60,0)');
    wash.addColorStop(0.6, `rgba(255,105,80,${0.20 * strength})`);
    wash.addColorStop(1, `rgba(230,35,125,${0.48 * strength})`);
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const diag = ctx.createLinearGradient(x, y, x + w, y + h);
    diag.addColorStop(0, `rgba(255,180,70,${0.16 * strength})`);
    diag.addColorStop(1, `rgba(255,60,150,${0.16 * strength})`);
    ctx.fillStyle = diag;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  } else if (grade === 'neon') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const pools = [
      [x + w * 0.12, y + h * 0.1, `rgba(255,45,175,${0.45 * strength})`],
      [x + w * 0.88, y + h * 0.92, `rgba(0,225,255,${0.45 * strength})`],
    ];
    for (const [cx, cy, colour] of pools) {
      const pool = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.95);
      pool.addColorStop(0, colour);
      pool.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  } else if (grade === 'dusk') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, `rgba(96,64,168,${0.16 * strength})`);
    wash.addColorStop(1, `rgba(24,16,64,${0.44 * strength})`);
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
  }
  // Mono takes no wash: its filter already drained the colour.
}

// ---------------------------------------------------------------------
// The painted backdrop behind the tilted stack: graded sky, a sun
// with the banded retro cut, a blocky skyline, two palm silhouettes.
// ---------------------------------------------------------------------

function paintBackdrop(ctx, W, H, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (grade === 'neon') {
    sky.addColorStop(0, '#150826');
    sky.addColorStop(0.55, '#40135c');
    sky.addColorStop(1, '#0d2c40');
  } else if (grade === 'dusk') {
    sky.addColorStop(0, '#2a2150');
    sky.addColorStop(0.6, '#5d3a7d');
    sky.addColorStop(1, '#191233');
  } else if (grade === 'mono') {
    sky.addColorStop(0, '#3d3d3d');
    sky.addColorStop(1, '#0b0b0b');
  } else {
    sky.addColorStop(0, '#ff8a5c');
    sky.addColorStop(0.5, '#ffb37c');
    sky.addColorStop(1, '#83308e');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun, slit-cut near its base in the sky's own colour.
  const sunX = W * 0.7;
  const sunY = H * 0.3;
  const sunR = W * 0.105;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.1);
  glow.addColorStop(0, grade === 'mono' ? 'rgba(255,255,255,0.5)' : 'rgba(255,222,130,0.7)');
  glow.addColorStop(1, 'rgba(255,222,130,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 3.1, sunY - sunR * 3.1, sunR * 6.2, sunR * 6.2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grade === 'mono' ? '#f4f4f4' : '#ffecb0';
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = sky;
  for (let i = 0; i < 4; i++) {
    const sy = sunY + sunR * (0.18 + i * 0.19);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, sunR * (0.035 + i * 0.016));
  }
  ctx.restore();

  // Skyline: a deterministic walk of blocks along the horizon.
  ctx.fillStyle = 'rgba(22,9,34,0.6)';
  const horizon = H * 0.79;
  let bx = -W * 0.02;
  let step = 13;
  while (bx < W) {
    step = (step * 37 + 11) % 89;
    const bw = W * (0.045 + (step % 9) / 150);
    const bh = H * (0.07 + (step % 21) / 120);
    ctx.fillRect(bx, horizon - bh, bw, bh + H * 0.02);
    bx += bw + W * 0.014;
  }
  paintPalm(ctx, W * 0.09, H * 0.81, H * 0.21, -0.22);
  paintPalm(ctx, W * 0.93, H * 0.83, H * 0.17, 0.18);
}

function paintPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = 'rgba(22,9,34,0.85)';
  ctx.fillStyle = 'rgba(22,9,34,0.85)';
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.05, -s * 0.5, s * 0.15, -s * 0.92);
  ctx.stroke();
  const crownX = s * 0.15;
  const crownY = -s * 0.92;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.82 + (i * Math.PI) / 5.2;
    const len = s * (0.46 + (i % 2) * 0.13);
    const tipX = crownX + Math.cos(a) * len;
    const tipY = crownY + Math.sin(a) * len * 0.55 + s * 0.2;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + Math.cos(a) * len * 0.55, crownY - s * 0.12, tipX, tipY);
    ctx.quadraticCurveTo(crownX + Math.cos(a) * len * 0.5, crownY + s * 0.05, crownX, crownY);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------
// POP-OUT, the signature. The star is painted again over the finished
// grid, standing taller than its panel. A photo with real
// transparency bursts out as itself, ringed by a white keyline grown
// from its own alpha silhouette; an ordinary photo bursts out inside
// a white-rimmed oval portal blown up past the frame.
// ---------------------------------------------------------------------

const outlineCache = new WeakMap();

// A white cut-out of the image at natural size, built once and reused
// at any draw size: paint the image, then keep only its alpha.
function outlineOf(img) {
  let outline = outlineCache.get(img);
  if (outline) return outline;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  outline = document.createElement('canvas');
  outline.width = w;
  outline.height = h;
  const oc = outline.getContext('2d');
  oc.drawImage(img, 0, 0);
  oc.globalCompositeOperation = 'source-in';
  oc.fillStyle = '#ffffff';
  oc.fillRect(0, 0, w, h);
  outlineCache.set(img, outline);
  return outline;
}

// burst runs 0..1 — how far past the frame the subject reaches. The
// star's feet stay on the panel's bottom edge and its height is
// capped, so the burst spills over the panel but never off the
// poster. Painted after every panel, before the title band.
export function drawPopOut(ctx, photo, panel, burst, W, H) {
  if (!photo || !photo.img) return;
  const img = photo.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const reach = 0.18 + 0.5 * (burst == null ? 0.6 : burst);
  const cx = panel.x + panel.w / 2 + (photo.ox || 0) * panel.w * 0.4;
  const floor = panel.y + panel.h;
  const heightCap = floor - H * 0.012;

  ctx.save();
  ctx.shadowColor = 'rgba(16,2,26,0.5)';
  ctx.shadowBlur = Math.max(10, W * 0.018);
  ctx.shadowOffsetY = Math.max(4, H * 0.008);

  if (photo.cutout) {
    const h = Math.min(panel.h * (1 + reach) * (photo.zoom || 1), heightCap);
    const w = (h * iw) / ih;
    const grow = 1.045;
    ctx.drawImage(outlineOf(img), cx - (w * grow) / 2, floor - h * grow, w * grow, h * grow);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(img, cx - w / 2, floor - h, w, h);
  } else {
    const h = Math.min(panel.h * (1 + reach * 0.8) * (photo.zoom || 1), heightCap);
    const w = Math.min(panel.w * 0.94, h * 0.78);
    const cy = floor - h / 2;
    const rim = Math.max(4, W * 0.006);
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2 - rim, h / 2 - rim, 0, 0, Math.PI * 2);
    ctx.clip();
    drawPhotoIn(ctx, img, { x: cx - w / 2, y: cy - h / 2, w, h }, 1, photo.ox, photo.oy);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------
// Lettering: three headline treatments over the band — retro chrome,
// sunset gradient, neon tube — plus a tilted script tagline. All set
// in system stacks; the metal, glow and warmth are paint, not fonts.
// ---------------------------------------------------------------------

// Largest headline size whose squeezed width fits maxWidth.
function fitHeadline(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = headlineFont(size);
  while (size > 12 && ctx.measureText(text).width * HEADLINE_SQUEEZE > maxWidth) {
    size -= 2;
    ctx.font = headlineFont(size);
  }
  return size;
}

// The chrome: a hard horizon a little above the middle — deep navy
// and sky above, a white mirror line, then steel falling to a
// magenta reflection at the foot, like lettering on a game cabinet.
function metalGradient(ctx, height) {
  const g = ctx.createLinearGradient(0, -height * 0.8, 0, height * 0.14);
  g.addColorStop(0.0, '#0a1c46');
  g.addColorStop(0.3, '#2f6bc4');
  g.addColorStop(0.46, '#bfe3ff');
  g.addColorStop(0.52, '#ffffff');
  g.addColorStop(0.57, '#7fa8dd');
  g.addColorStop(0.78, '#233f7d');
  g.addColorStop(0.92, '#4b2670');
  g.addColorStop(1.0, '#c94b9e');
  return g;
}

function paintHeadline(ctx, title, x, baseline, size, state, W) {
  const style = state.titleStyle || 'chrome';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';

  if (style === 'chrome') {
    // Squeezed and leaning a breath forward; magenta and cyan offset
    // shadows first, then the bevelled metal face and a top sheen.
    ctx.save();
    ctx.translate(x, baseline);
    ctx.transform(HEADLINE_SQUEEZE, 0, -0.055, 1, 0, 0);
    ctx.font = headlineFont(size);
    ctx.fillStyle = '#ff2e88';
    ctx.fillText(title, size * 0.05, size * 0.055);
    ctx.fillStyle = '#17c3e6';
    ctx.fillText(title, -size * 0.04, -size * 0.04);
    ctx.strokeStyle = '#070d2b';
    ctx.lineWidth = Math.max(2, size * 0.085);
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = metalGradient(ctx, size);
    ctx.fillText(title, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-size * 0.1, -size * 0.84, W, size * 0.3);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText(title, 0, 0);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (style === 'neon') {
    ctx.save();
    ctx.translate(x, baseline);
    ctx.transform(HEADLINE_SQUEEZE, 0, 0, 1, 0, 0);
    ctx.font = headlineFont(size);
    ctx.shadowColor = '#ff2fd6';
    ctx.shadowBlur = size * 0.32;
    ctx.strokeStyle = '#ff5df2';
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.strokeText(title, 0, 0);
    ctx.shadowColor = '#19d3ff';
    ctx.fillStyle = '#eafcff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
    return;
  }

  // Sunset: a warm gradient running along the word, heavy dark edge.
  ctx.save();
  ctx.translate(x, baseline);
  ctx.transform(HEADLINE_SQUEEZE, 0, 0, 1, 0, 0);
  ctx.font = headlineFont(size);
  const grad = ctx.createLinearGradient(0, 0, Math.max(1, ctx.measureText(title).width), 0);
  if (state.grade === 'mono') {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#cfcfcf');
  } else {
    grad.addColorStop(0, '#ffe259');
    grad.addColorStop(0.5, '#ffa751');
    grad.addColorStop(1, '#ff5e8a');
  }
  ctx.strokeStyle = '#12060f';
  ctx.lineWidth = Math.max(2, size * 0.075);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();
}

function paintTitleBand(ctx, W, H, state) {
  const bandH = H * BAND_SHARE;
  const bandY = H - bandH;
  const style = state.titleStyle || 'chrome';
  ctx.fillStyle = state.grade === 'mono' ? '#101010' : '#1d0b27';
  ctx.fillRect(0, bandY, W, bandH);

  // The band's top rule dresses like the lettering: a chrome bar, a
  // neon tube, or the warm three-stop rule.
  if (style === 'chrome') {
    const bar = ctx.createLinearGradient(0, bandY, 0, bandY + Math.max(4, H * 0.009));
    bar.addColorStop(0, '#bfe3ff');
    bar.addColorStop(0.5, '#ffffff');
    bar.addColorStop(1, '#233f7d');
    ctx.fillStyle = bar;
    ctx.fillRect(0, bandY, W, Math.max(4, H * 0.009));
  } else if (style === 'neon') {
    ctx.save();
    ctx.shadowColor = '#ff2fd6';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff5df2';
    ctx.fillRect(0, bandY, W, Math.max(3, H * 0.005));
    ctx.restore();
  } else {
    const rule = ctx.createLinearGradient(0, 0, W, 0);
    rule.addColorStop(0, '#ff5e62');
    rule.addColorStop(0.5, '#ffb347');
    rule.addColorStop(1, '#00e5ff');
    ctx.fillStyle = rule;
    ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));
  }

  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  if (!title && !sub) return;
  const pad = W * 0.045;
  const availW = W - pad * 2;
  if (title) {
    const start = bandH * (sub ? 0.54 : 0.7) * (state.titleSize || 1);
    const size = fitHeadline(ctx, title, availW, start);
    paintHeadline(ctx, title, pad, bandY + bandH * (sub ? 0.6 : 0.74), size, state, W);
  }
  if (sub) {
    // The tagline: a script stack, tilted a breath, glowing softly —
    // a hand-written tag under the headline.
    let size = bandH * 0.175;
    ctx.font = `italic 700 ${size}px ${TAGLINE_STACK}`;
    while (size > 9 && ctx.measureText(sub).width > availW) {
      size -= 1;
      ctx.font = `italic 700 ${size}px ${TAGLINE_STACK}`;
    }
    ctx.save();
    ctx.translate(pad, bandY + bandH * 0.815);
    ctx.rotate(-0.022);
    ctx.fillStyle = style === 'neon' ? '#ff5df2' : '#ffd9ec';
    ctx.shadowColor = style === 'neon' ? '#ff2fd6' : 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = size * 0.35;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------
// Finishes: the poster frame, a vignette, and seeded film grain —
// the same noise on every run, so an export is byte-for-byte the
// picture the preview showed.
// ---------------------------------------------------------------------

let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tc = tile.getContext('2d');
  const img = tc.createImageData(140, 140);
  let seed = 20261120;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 20;
  }
  tc.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

function paintFinishes(ctx, W, H, state) {
  if (state.frame !== false) {
    const fw = Math.max(8, Math.round(Math.min(W, H) * 0.022));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = fw;
    ctx.strokeRect(fw / 2, fw / 2, W - fw, H - fw);
    ctx.strokeStyle = '#12060f';
    ctx.lineWidth = Math.max(2, fw * 0.12);
    ctx.strokeRect(fw * 1.6, fw * 1.6, W - fw * 3.2, H - fw * 3.2);
  }
  if (state.vignette !== false) {
    const v = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.76,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,0,20,0.32)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain !== false) {
    const pat = grainPattern(ctx);
    if (pat) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------------
// The whole cover.
// ---------------------------------------------------------------------

export function drawCover(ctx, W, H, state) {
  ctx.clearRect(0, 0, W, H);
  const grade = state.grade || 'sunset';
  const strength = state.gradeIntensity == null ? 0.85 : state.gradeIntensity;
  const layout = state.layout || 'popout';

  if (layout === 'tilt') {
    paintBackdrop(ctx, W, H, grade);
  } else {
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, W, H);
  }

  const panels = layoutPanels(layout, W, H);
  const filter = filterForGrade(grade);
  panels.forEach((rect, i) => {
    const slot = (state.panelPhoto && state.panelPhoto[i]) ?? i % 4;
    const photo = state.photos && state.photos[slot];
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    if (rect.rot) ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    if (photo && photo.img) {
      ctx.filter = filter;
      drawPhotoIn(ctx, photo.img, local, photo.zoom, photo.ox, photo.oy);
      ctx.filter = 'none';
    } else {
      const ph = ctx.createLinearGradient(0, 0, 0, rect.h);
      ph.addColorStop(0, '#ff9a76');
      ph.addColorStop(1, '#7b2d8b');
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = `700 ${Math.max(14, rect.w * 0.05)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.w / 2, rect.h / 2);
    }
    washPanel(ctx, local, grade, strength);
    ctx.restore();

    // Edges: a fat white photo border on the tilted stack, a hairline
    // keyline on the flat layouts, nothing on full bleed.
    if (layout === 'tilt' || layout !== 'full') {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot || 0);
      if (layout === 'tilt') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(4, W * 0.008);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(2, W * 0.002);
      }
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    }
  });

  // The signature moment: the hero panel's star breaks its frame.
  if (layout === 'popout') {
    const starSlot = state.starSlot == null ? 3 : state.starSlot;
    drawPopOut(ctx, state.photos && state.photos[starSlot], panels[0], state.burst, W, H);
  }

  paintTitleBand(ctx, W, H, state);
  paintFinishes(ctx, W, H, state);
}
