// main.js — the studio floor of Sunset Cover Studio. cover.js paints
// the poster; this file owns the state it paints from and every
// control that changes it: four photo slots with drag-and-drop, the
// layout / grade / size / lettering pickers, the pop-out controls,
// per-panel crop (click a panel, drag to pan, scroll to zoom), and
// the PNG export buttons. The lettering the poster wears is the
// hand-drawn vector alphabet of glyphs.js — this file never waits on
// a font, because the app ships none.
import { drawCover, layoutPanels, SIZES, GRADES, LAYOUTS, TITLE_STYLES } from './cover.js';
import { runShot } from './shots.js';

export const SAMPLES = ['boulevard', 'rooftop', 'neon', 'star'];
const SLOT_NAMES = ['A', 'B', 'C', 'D'];

export const state = {
  layout: 'popout',
  grade: 'sunset',
  gradeIntensity: 0.85,
  title: 'SUNSET HEIST',
  subtitle: 'a vice city story',
  titleSize: 1,
  titleStyle: 'chrome',
  burst: 0.6,
  frame: true,
  grain: true,
  vignette: true,
  size: 'square',
  photos: SLOT_NAMES.map(() => ({ img: null, name: '', zoom: 1, ox: 0, oy: 0, cutout: false })),
  panelPhoto: [0, 1, 2, 0],
  starSlot: 3,
  selectedPanel: 0,
};

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const $ = (id) => document.getElementById(id);

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

// Does this picture carry real transparency? A cut-out star needs
// alpha to burst out of its panel as itself; an opaque photo bursts
// out inside an oval portal instead. Probe a coarse grid once, at
// load time, and remember the answer on the slot.
function looksCutOut(img) {
  try {
    const probe = document.createElement('canvas');
    probe.width = 48;
    probe.height = 48;
    const pc = probe.getContext('2d', { willReadFrequently: true });
    pc.drawImage(img, 0, 0, 48, 48);
    const data = pc.getImageData(0, 0, 48, 48).data;
    let clear = 0;
    let solid = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 200) clear++;
      else solid++;
    }
    return clear > 8 && solid > 8;
  } catch (err) {
    return false;
  }
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  canvas.classList.toggle('wide', state.size === 'wide');
  canvas.classList.toggle('portrait', state.size === 'portrait');
  drawCover(canvas.getContext('2d'), size.w, size.h, state);
  syncPanelControls();
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---- photo slots ----------------------------------------------------

const slotEls = [];

function buildSlots() {
  SLOT_NAMES.forEach((name, i) => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML = `
      <span class="slot-name">Photo ${name}${i === 3 ? ' · pop-out star' : ''}</span>
      <label>Choose file <input type="file" accept="image/*" data-slot="${i}"></label>
      <span class="file-name"></span>
      <span class="hint">or drop an image here</span>`;
    div.querySelector('input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) await setPhotoFromFile(i, file);
    });
    div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('dragover'); });
    div.addEventListener('dragleave', () => div.classList.remove('dragover'));
    div.addEventListener('drop', async (e) => {
      e.preventDefault();
      div.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) await setPhotoFromFile(i, file);
    });
    $('slots').appendChild(div);
    slotEls.push(div);
  });
}

async function setPhotoFromFile(i, file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  setPhoto(i, img, file.name, url);
}

function setPhoto(i, img, name, objectUrl) {
  const slot = state.photos[i];
  // A replaced file photo hands its blob URL back to the browser;
  // sample photos ride on plain paths and have nothing to hand back.
  if (slot.objectUrl) URL.revokeObjectURL(slot.objectUrl);
  slot.objectUrl = objectUrl || null;
  slot.img = img;
  slot.name = name || `photo ${SLOT_NAMES[i]}`;
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  slot.cutout = looksCutOut(img);
  const div = slotEls[i];
  div.classList.add('filled');
  div.querySelector('.file-name').textContent = slot.name + (slot.cutout ? ' (cut-out)' : '');
  let thumb = div.querySelector('.thumb');
  if (!thumb) {
    thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.alt = '';
    div.insertBefore(thumb, div.querySelector('.file-name'));
  }
  thumb.src = img.src;
  redraw();
}

async function loadSample(i, sample) {
  try {
    const img = await loadImage(`./samples/${sample}.png`);
    setPhoto(i, img, `${sample} (sample)`);
  } catch (err) {
    setStatus(`Sample ${sample} failed to load.`);
  }
}

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sample = btn.dataset.sample;
    // The star sample belongs in the star slot; a scene fills the
    // first empty slot, or slot A when the cast is already full.
    let i;
    if (sample === 'star') {
      i = state.starSlot;
    } else {
      const firstEmpty = state.photos.findIndex((p) => !p.img);
      i = firstEmpty === -1 ? 0 : firstEmpty;
    }
    loadSample(i, sample);
  });
});

// ---- segmented pickers ----------------------------------------------

function buildSeg(el, entries, current, onPick) {
  Object.entries(entries).forEach(([key, value]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = value.name || value.label || key;
    b.title = value.hint || '';
    b.setAttribute('aria-pressed', String(key === current));
    b.addEventListener('click', () => {
      el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      onPick(key);
    });
    el.appendChild(b);
  });
}

buildSeg($('layouts'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  state.selectedPanel = 0;
  $('popoutControls').style.display = key === 'popout' ? '' : 'none';
  redraw();
});
buildSeg($('grades'), GRADES, state.grade, (key) => {
  state.grade = key;
  redraw();
});
buildSeg($('sizes'), SIZES, state.size, (key) => {
  state.size = key;
  $('exportSize').textContent = SIZES[key].label.replace(' x ', ' × ');
  redraw();
});
buildSeg($('titleStyles'), TITLE_STYLES, state.titleStyle, (key) => {
  state.titleStyle = key;
  redraw();
});

// ---- caption, grade and pop-out controls ----------------------------

$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('titleSize').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); redraw(); });
$('gradeIntensity').addEventListener('input', (e) => { state.gradeIntensity = Number(e.target.value); redraw(); });
$('burst').addEventListener('input', (e) => { state.burst = Number(e.target.value); redraw(); });
$('frame').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); });
$('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });

const starSel = $('starPhoto');
SLOT_NAMES.forEach((name, i) => {
  const o = document.createElement('option');
  o.value = i;
  o.textContent = `Photo ${name}`;
  starSel.appendChild(o);
});
starSel.value = String(state.starSlot);
starSel.addEventListener('change', (e) => { state.starSlot = Number(e.target.value); redraw(); });

// ---- per-panel crop controls -----------------------------------------

const panelPhotoSel = $('panelPhoto');
SLOT_NAMES.forEach((name, i) => {
  const o = document.createElement('option');
  o.value = i;
  o.textContent = `Photo ${name}`;
  panelPhotoSel.appendChild(o);
});

function currentPhoto() {
  const slot = state.panelPhoto[state.selectedPanel] ?? 0;
  return state.photos[slot];
}

function syncPanelControls() {
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  if (state.selectedPanel >= panels.length) state.selectedPanel = 0;
  $('panelLabel').textContent = `${state.selectedPanel + 1} of ${panels.length}`;
  panelPhotoSel.value = String(state.panelPhoto[state.selectedPanel] ?? 0);
  const photo = currentPhoto();
  $('zoom').value = photo ? photo.zoom : 1;
  $('panX').value = photo ? photo.ox : 0;
  $('panY').value = photo ? photo.oy : 0;
}

panelPhotoSel.addEventListener('change', (e) => {
  state.panelPhoto[state.selectedPanel] = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('input', (e) => { const p = currentPhoto(); if (p) { p.zoom = Number(e.target.value); redraw(); } });
$('panX').addEventListener('input', (e) => { const p = currentPhoto(); if (p) { p.ox = Number(e.target.value); redraw(); } });
$('panY').addEventListener('input', (e) => { const p = currentPhoto(); if (p) { p.oy = Number(e.target.value); redraw(); } });

// ---- drag to pan, scroll to zoom, on the preview itself ---------------

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    let px = x - (p.x + p.w / 2);
    let py = y - (p.y + p.h / 2);
    if (p.rot) {
      const c = Math.cos(-p.rot);
      const s = Math.sin(-p.rot);
      const rx = px * c - py * s;
      const ry = px * s + py * c;
      px = rx;
      py = ry;
    }
    if (Math.abs(px) <= p.w / 2 && Math.abs(py) <= p.h / 2) return { index: i, x, y };
  }
  return null;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  state.selectedPanel = hit.index;
  drag = {
    lastX: e.clientX,
    lastY: e.clientY,
    photo: currentPhoto(),
    panel: layoutPanels(state.layout, canvas.width, canvas.height)[hit.index],
  };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || !drag.photo) return;
  const rect = canvas.getBoundingClientRect();
  drag.photo.ox += ((e.clientX - drag.lastX) * (canvas.width / rect.width)) / drag.panel.w;
  drag.photo.oy += ((e.clientY - drag.lastY) * (canvas.height / rect.height)) / drag.panel.h;
  drag.photo.ox = Math.max(-0.5, Math.min(0.5, drag.photo.ox));
  drag.photo.oy = Math.max(-0.5, Math.min(0.5, drag.photo.oy));
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  state.selectedPanel = hit.index;
  const photo = currentPhoto();
  if (!photo || !photo.img) return;
  photo.zoom = Math.max(1, Math.min(3, photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// ---- keyboard: step through the panels --------------------------------

document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const count = layoutPanels(state.layout, canvas.width, canvas.height).length;
  const step = e.key === 'ArrowRight' ? 1 : -1;
  state.selectedPanel = (state.selectedPanel + step + count) % count;
  redraw();
});

// ---- export ------------------------------------------------------------

function renderOffscreen(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state);
  return off;
}

function downloadCanvas(off, sizeKey) {
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const size = SIZES[sizeKey];
      a.download = `sunset-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

$('export').addEventListener('click', async () => {
  setStatus('Exporting…');
  await downloadCanvas(renderOffscreen(state.size), state.size);
  const size = SIZES[state.size];
  setStatus(`Saved sunset-cover-${size.w}x${size.h}.png — share it anywhere.`);
});

$('exportAll').addEventListener('click', async () => {
  setStatus('Exporting all three sizes…');
  for (const key of Object.keys(SIZES)) {
    await downloadCanvas(renderOffscreen(key), key);
    await new Promise((r) => setTimeout(r, 350));
  }
  setStatus('Saved all three: 1080×1080, 1080×1350 and 1920×1080.');
});

// ---- boot ---------------------------------------------------------------

buildSlots();
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshot scenes (?shot=cover / ?shot=editor) stage a fixed cast
  // and caption so the entry's screenshots are reproducible.
  runShot(shot, params, { state, redraw, loadSample, setStatus, samples: SAMPLES });
} else {
  // The fast path: the whole cast is already on stage — a scene in
  // every panel and the star in her slot, already bursting out of
  // the frame — so the first export is two clicks away.
  loadSample(0, 'boulevard')
    .then(() => loadSample(1, 'rooftop'))
    .then(() => loadSample(2, 'neon'))
    .then(() => loadSample(3, 'star'));
}
// The lettering is vector paths, so there is nothing to wait on:
// paint at once.
redraw();
