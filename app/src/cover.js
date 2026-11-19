// cover.js — the cover renderer for Sunset Cover Studio.
//
// One function, drawCover(ctx, W, H, state), paints the whole poster:
// a multi-panel photo grid in a GTA-poster style (bold condensed title,
// Vice City sunset / neon colour grades), drawn entirely in code — no
// Rockstar artwork, no external images. The live preview and the PNG
// export call the same function, so what you see is what you download.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const GRADES = {
  sunset: { name: 'Sunset', hint: 'pink-orange Vice City golden hour' },
  neon: { name: 'Neon Nights', hint: 'magenta + cyan night street' },
  dusk: { name: 'Dusk', hint: 'purple-blue evening haze' },
  mono: { name: 'Mono', hint: 'high-contrast black and white' },
};

export const LAYOUTS = {
  full: { name: 'Full bleed', panels: 1 },
  duo: { name: 'Duo split', panels: 2 },
  trio: { name: 'Trio strip', panels: 3 },
  hero: { name: 'Hero + three', panels: 4 },
  grid: { name: 'Four grid', panels: 4 },
  tilt: { name: 'Tilted stack', panels: 3 },
};

// Panel rectangles for a layout, as fractions of the cover (x, y, w, h)
// plus an optional rotation in radians. The title band sits at the foot
// and the panels fill the space above it.
export function layoutPanels(layout, W, H) {
  const band = layout === 'full' ? 0.20 : 0.19; // title band height, fraction
  const top = H * (1 - band);
  const g = Math.max(6, Math.round(W * 0.008)); // white gutter
  switch (layout) {
    case 'full':
      return [{ x: 0, y: 0, w: W, h: top, rot: 0 }];
    case 'duo':
      return [
        { x: 0, y: 0, w: W / 2 - g / 2, h: top, rot: 0 },
        { x: W / 2 + g / 2, y: 0, w: W / 2 - g / 2, h: top, rot: 0 },
      ];
    case 'trio':
      return [0, 1, 2].map((i) => ({
        x: (i * W) / 3 + (i === 0 ? 0 : g / 2),
        y: 0,
        w: W / 3 - (i === 1 ? g : g / 2),
        h: top,
        rot: 0,
      }));
    case 'grid': {
      const cw = (W - g) / 2;
      const ch = (top - g) / 2;
      return [
        { x: 0, y: 0, w: cw, h: ch, rot: 0 },
        { x: cw + g, y: 0, w: cw, h: ch, rot: 0 },
        { x: 0, y: ch + g, w: cw, h: ch, rot: 0 },
        { x: cw + g, y: ch + g, w: cw, h: ch, rot: 0 },
      ];
    }
    case 'hero': {
      const heroW = W * 0.62;
      const colW = W - heroW - g;
      const ch = (top - 2 * g) / 3;
      return [
        { x: 0, y: 0, w: heroW, h: top, rot: 0 },
        { x: heroW + g, y: 0, w: colW, h: ch, rot: 0 },
        { x: heroW + g, y: ch + g, w: colW, h: ch, rot: 0 },
        { x: heroW + g, y: 2 * (ch + g), w: colW, h: ch, rot: 0 },
      ];
    }
    case 'tilt': {
      // Three overlapping snapshots, tilted like photos taped to a wall.
      const pw = W * 0.46;
      const ph = top * 0.78;
      return [
        { x: W * 0.02, y: top * 0.04, w: pw, h: ph, rot: -0.06 },
        { x: W * 0.50, y: top * 0.10, w: pw, h: ph, rot: 0.05 },
        { x: W * 0.26, y: top * 0.16, w: pw, h: ph, rot: -0.015 },
      ];
    }
    default:
      return [{ x: 0, y: 0, w: W, h: top, rot: 0 }];
  }
}

// Draw one photo into a panel rect, cover-fit, with the user's zoom and
// pan (ox, oy are fractions of the panel size, -0.5..0.5).
export function drawPhotoIn(ctx, img, rect, zoom, ox, oy) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const pw = iw * scale;
  const ph = ih * scale;
  const dx = rect.x + (rect.w - pw) / 2 + (ox || 0) * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + (oy || 0) * rect.h;
  ctx.drawImage(img, dx, dy, pw, ph);
}

// Colour grade over a panel rect. `intensity` 0..1 scales the overlays.
function gradePanel(ctx, rect, grade, intensity) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255, 90, 60, 0)');
    g.addColorStop(0.55, `rgba(255, 110, 70, ${0.22 * intensity})`);
    g.addColorStop(1, `rgba(235, 40, 130, ${0.5 * intensity})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    const warm = ctx.createLinearGradient(x, y, x + w, y + h);
    warm.addColorStop(0, `rgba(255, 170, 60, ${0.18 * intensity})`);
    warm.addColorStop(1, `rgba(255, 60, 140, ${0.18 * intensity})`);
    ctx.fillStyle = warm;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade === 'neon') {
    ctx.globalCompositeOperation = 'overlay';
    const m = ctx.createRadialGradient(x + w * 0.15, y + h * 0.15, 0, x + w * 0.15, y + h * 0.15, w * 0.9);
    m.addColorStop(0, `rgba(255, 40, 170, ${0.42 * intensity})`);
    m.addColorStop(1, 'rgba(255, 40, 170, 0)');
    ctx.fillStyle = m;
    ctx.fillRect(x, y, w, h);
    const c = ctx.createRadialGradient(x + w * 0.85, y + h * 0.9, 0, x + w * 0.85, y + h * 0.9, w * 0.9);
    c.addColorStop(0, `rgba(0, 220, 255, ${0.42 * intensity})`);
    c.addColorStop(1, 'rgba(0, 220, 255, 0)');
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade === 'dusk') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(90, 60, 160, ${0.18 * intensity})`);
    g.addColorStop(1, `rgba(30, 20, 70, ${0.42 * intensity})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

// Sunset backdrop for the tilted-stack layout: gradient sky, sun disc,
// skyline and palm silhouettes, all drawn in code.
function drawBackdrop(ctx, W, H, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (grade === 'neon') {
    sky.addColorStop(0, '#160a2e');
    sky.addColorStop(0.55, '#3d1157');
    sky.addColorStop(1, '#0e2a3d');
  } else if (grade === 'dusk') {
    sky.addColorStop(0, '#2c2350');
    sky.addColorStop(0.6, '#5b3a7a');
    sky.addColorStop(1, '#1a1433');
  } else if (grade === 'mono') {
    sky.addColorStop(0, '#3a3a3a');
    sky.addColorStop(1, '#0c0c0c');
  } else {
    sky.addColorStop(0, '#ff7e5f');
    sky.addColorStop(0.5, '#feb47b');
    sky.addColorStop(1, '#7b2d8b');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Sun.
  const sunR = W * 0.11;
  const sunX = W * 0.72;
  const sunY = H * 0.30;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3);
  glow.addColorStop(0, grade === 'mono' ? 'rgba(255,255,255,0.55)' : 'rgba(255, 220, 130, 0.75)');
  glow.addColorStop(1, 'rgba(255, 220, 130, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 3, sunY - sunR * 3, sunR * 6, sunR * 6);
  ctx.fillStyle = grade === 'mono' ? '#f2f2f2' : '#ffe9a8';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Skyline blocks.
  ctx.fillStyle = 'rgba(20, 8, 32, 0.55)';
  const base = H * 0.78;
  let bx = 0;
  let seed = 7;
  while (bx < W) {
    seed = (seed * 31 + 17) % 97;
    const bw = W * (0.05 + (seed % 10) / 160);
    const bh = H * (0.08 + (seed % 23) / 130);
    ctx.fillRect(bx, base - bh, bw, bh);
    bx += bw + W * 0.012;
  }
  // Two palm silhouettes.
  drawPalm(ctx, W * 0.08, H * 0.80, H * 0.22, -0.25);
  drawPalm(ctx, W * 0.94, H * 0.82, H * 0.18, 0.2);
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = 'rgba(20, 8, 32, 0.8)';
  ctx.lineWidth = s * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.06, -s * 0.55, s * 0.16, -s * 0.95);
  ctx.stroke();
  ctx.fillStyle = 'rgba(20, 8, 32, 0.8)';
  const topX = s * 0.16;
  const topY = -s * 0.95;
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI / 6) + (i * Math.PI) / 5.4 - Math.PI / 2 + 0.5;
    const len = s * (0.5 + (i % 2) * 0.14);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6,
      topY + Math.sin(a) * len * 0.4 - s * 0.1,
      topX + Math.cos(a) * len,
      topY + Math.sin(a) * len + s * 0.22,
    );
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.55,
      topY + Math.sin(a) * len * 0.55 + s * 0.14,
      topX,
      topY,
    );
    ctx.fill();
  }
  ctx.restore();
}

// Film grain: a small random-noise tile, drawn as a repeating pattern.
let grainTile = null;
function getGrain(ctx) {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 128;
  t.height = 128;
  const tc = t.getContext('2d');
  const img = tc.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  tc.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(t, 'repeat');
  return grainTile;
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

// The title band: big condensed capitals with a black outline and a
// sunset gradient fill, plus a neon-script subtitle.
function drawTitleBand(ctx, W, H, state) {
  const bandH = H * 0.19;
  const bandY = H - bandH;
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  // Band background: deep plum, so the title reads on any photo.
  ctx.fillStyle = state.grade === 'mono' ? '#111111' : '#1c0b26';
  ctx.fillRect(0, bandY, W, bandH);
  const rule = ctx.createLinearGradient(0, 0, W, 0);
  rule.addColorStop(0, '#ff5e62');
  rule.addColorStop(0.5, '#ffb347');
  rule.addColorStop(1, '#00e5ff');
  ctx.fillStyle = rule;
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));
  if (!title && !sub) return;
  const pad = W * 0.045;
  const availW = W - pad * 2;
  ctx.textBaseline = 'alphabetic';
  if (title) {
    const size = fitFont(ctx, title, availW, bandH * (sub ? 0.52 : 0.68) * (state.titleSize || 1), '"Bebas Neue", "Arial Narrow", sans-serif');
    ctx.font = `${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
    const ty = bandY + bandH * (sub ? 0.58 : 0.72);
    const grad = ctx.createLinearGradient(pad, 0, W - pad, 0);
    if (state.grade === 'mono') {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#d8d8d8');
    } else if (state.grade === 'neon') {
      grad.addColorStop(0, '#ff9de2');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#7df9ff');
    } else {
      grad.addColorStop(0, '#ffe259');
      grad.addColorStop(0.5, '#ffa751');
      grad.addColorStop(1, '#ff5e8a');
    }
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12060f';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, pad, ty);
  }
  if (sub) {
    const size = fitFont(ctx, sub, availW, bandH * 0.18, '"Pacifico", cursive');
    ctx.font = `${size}px "Pacifico", cursive`;
    ctx.textAlign = 'left';
    ctx.fillStyle = state.grade === 'neon' ? '#ff5df2' : '#ffd9ec';
    ctx.shadowColor = state.grade === 'neon' ? '#ff2fd6' : 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.35;
    ctx.fillText(sub, pad, bandY + bandH * 0.80);
    ctx.shadowBlur = 0;
  }
}

// Draw the full cover. `state` carries layout, grade, photos, title,
// subtitle, frame/grain/vignette toggles and per-panel crop settings.
// Photos are {img, zoom, ox, oy}; panels map to photo slots.
export function drawCover(ctx, W, H, state) {
  ctx.clearRect(0, 0, W, H);
  const grade = state.grade || 'sunset';
  const intensity = state.gradeIntensity == null ? 0.85 : state.gradeIntensity;
  // Backdrop: white poster board, or the sunset scene for tilted stack.
  if (state.layout === 'tilt') {
    drawBackdrop(ctx, W, H, grade);
  } else {
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, W, H);
  }
  const panels = layoutPanels(state.layout || 'hero', W, H);
  const photoFilter = grade === 'mono'
    ? 'grayscale(1) contrast(1.12) brightness(1.02)'
    : grade === 'neon'
      ? 'saturate(1.45) contrast(1.06)'
      : grade === 'dusk'
        ? 'saturate(0.92) contrast(1.04)'
        : 'saturate(1.12) contrast(1.03)';
  panels.forEach((rect, i) => {
    const slot = (state.panelPhoto && state.panelPhoto[i]) ?? (i % 4);
    const photo = state.photos && state.photos[slot];
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    const r0 = { x: 0, y: 0, w: rect.w, h: rect.h };
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    if (photo && photo.img) {
      ctx.filter = photoFilter;
      drawPhotoIn(ctx, photo.img, r0, photo.zoom, photo.ox, photo.oy);
      ctx.filter = 'none';
    } else {
      // Empty panel: a flat sunset placeholder so the grid still reads.
      const ph = ctx.createLinearGradient(0, 0, 0, rect.h);
      ph.addColorStop(0, '#ff9a76');
      ph.addColorStop(1, '#7b2d8b');
      ctx.fillStyle = ph;
      ctx.fillRect(0, 0, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `bold ${Math.max(14, rect.w * 0.05)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.w / 2, rect.h / 2);
    }
    gradePanel(ctx, r0, grade, intensity);
    ctx.restore();
    // White photo border on tilted snapshots, thin keyline elsewhere.
    if (state.layout === 'tilt') {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(4, W * 0.008);
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    } else if (state.layout !== 'full') {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, W * 0.002);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  });
  // Title band.
  drawTitleBand(ctx, W, H, state);
  // Outer frame.
  if (state.frame !== false) {
    const fw = Math.max(8, Math.round(Math.min(W, H) * 0.022));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = fw;
    ctx.strokeRect(fw / 2, fw / 2, W - fw, H - fw);
    ctx.strokeStyle = '#12060f';
    ctx.lineWidth = Math.max(2, fw * 0.12);
    ctx.strokeRect(fw * 1.6, fw * 1.6, W - fw * 3.2, H - fw * 3.2);
  }
  // Vignette + grain over everything.
  if (state.vignette !== false) {
    const v = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,0,20,0.32)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain !== false) {
    const pat = getGrain(ctx);
    if (pat) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}
