// app/src/main.js — the editor floor of Sunset Cover Studio.
//
// cover.js paints the poster; this file owns everything a person
// touches: the four photo slots (bundled samples or their own
// photos, read locally and never uploaded), the layout / grade /
// lettering / size pickers, the caption fields, the finish sliders,
// drag-to-position and scroll-to-zoom on the preview, and the PNG
// export. It also answers shots.js when a screenshot scene is being
// staged, pushing the staged state into these same controls.

import { createStudio, SLOT_LABELS, SLOT_NAMES } from './cover.js';
import { stageFromQuery } from './shots.js';

// The bundled sample scenes, drawn for this studio: a cut-out star
// with a transparent background, a palm boulevard, a neon street
// and a rooftop at dusk.
export const SAMPLES = [
  ['star', 'Cut-out star'],
  ['boulevard', 'Boulevard'],
  ['neon', 'Neon street'],
  ['rooftop', 'Rooftop'],
];

const canvas = document.getElementById('coverCanvas');
const studio = createStudio(canvas);
const { state } = studio;

let selectedSlot = 'hero';
let uploadSlot = null;

const sampleCache = new Map();

// Loads one bundled sample into a slot; resolves once the image is
// decoded and the studio has repainted with it.
export function loadSample(slot, name) {
  if (!SAMPLES.some(([key]) => key === name)) return Promise.resolve();
  if (!sampleCache.has(name)) {
    sampleCache.set(name, new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `samples/${name}.png`;
    }));
  }
  return sampleCache.get(name).then((img) => {
    if (img) studio.setSlotImage(slot, img);
  });
}

// --- Photo slots --------------------------------------------------

const slotList = document.getElementById('slotList');
const fileInput = document.getElementById('fileInput');

function buildSlotList() {
  for (const slot of SLOT_NAMES) {
    const row = document.createElement('div');
    row.className = 'slotRow';
    row.dataset.slot = slot;

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'slotHead';
    head.textContent = SLOT_LABELS[slot];
    head.addEventListener('click', () => selectSlot(slot));
    row.appendChild(head);

    const picks = document.createElement('div');
    picks.className = 'slotPicks';
    for (const [key, label] of SAMPLES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => {
        selectSlot(slot);
        loadSample(slot, key);
      });
      picks.appendChild(b);
    }
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'uploadBtn';
    up.textContent = 'Upload…';
    up.addEventListener('click', () => {
      uploadSlot = slot;
      selectSlot(slot);
      fileInput.click();
    });
    picks.appendChild(up);
    row.appendChild(picks);
    slotList.appendChild(row);
  }
}

function selectSlot(slot) {
  selectedSlot = slot;
  document.querySelectorAll('.slotRow').forEach((row) => {
    row.classList.toggle('selected', row.dataset.slot === slot);
  });
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  if (!file || !uploadSlot) return;
  const slot = uploadSlot;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    studio.setSlotImage(slot, img);
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

// --- Pickers, words and sliders -----------------------------------

function setPressed(containerId, value) {
  document.querySelectorAll(`#${containerId} button`).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.value === value));
  });
}

function wireSeg(containerId, apply) {
  document.querySelectorAll(`#${containerId} button`).forEach((b) => {
    b.addEventListener('click', () => {
      apply(b.dataset.value);
      setPressed(containerId, b.dataset.value);
      studio.render();
    });
  });
}

const captionInput = document.getElementById('captionInput');
const subtitleInput = document.getElementById('subtitleInput');
const titleSizeRange = document.getElementById('titleSizeRange');
const gradeRange = document.getElementById('gradeRange');
const burstRange = document.getElementById('burstRange');

function wireControls() {
  wireSeg('layoutSeg', (v) => { state.layout = v; });
  wireSeg('gradeSeg', (v) => { state.grade = v; });
  wireSeg('styleSeg', (v) => { state.titleStyle = v; });
  wireSeg('sizeSeg', (v) => { state.size = v; });
  captionInput.addEventListener('input', () => { state.caption = captionInput.value; studio.render(); });
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; studio.render(); });
  titleSizeRange.addEventListener('input', () => { state.titleScale = titleSizeRange.value / 100; studio.render(); });
  gradeRange.addEventListener('input', () => { state.gradeStrength = gradeRange.value / 100; studio.render(); });
  burstRange.addEventListener('input', () => { state.burst = burstRange.value / 100; studio.render(); });
  document.getElementById('exportBtn').addEventListener('click', () => {
    studio.exportPNG(`sunset-cover-${state.size}.png`);
  });
}

// Pushes the studio state into every control, so the rail always
// shows the cover that is actually on the canvas — including when
// shots.js has just staged a scene.
function syncUI() {
  setPressed('layoutSeg', state.layout);
  setPressed('gradeSeg', state.grade);
  setPressed('styleSeg', state.titleStyle);
  setPressed('sizeSeg', state.size);
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  titleSizeRange.value = Math.round(state.titleScale * 100);
  gradeRange.value = Math.round(state.gradeStrength * 100);
  burstRange.value = Math.round(state.burst * 100);
}

// --- Positioning the selected photo -------------------------------

let dragLast = null;

canvas.addEventListener('pointerdown', (e) => {
  dragLast = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragLast) return;
  const rect = canvas.getBoundingClientRect();
  const slot = state.slots[selectedSlot];
  slot.fx = Math.min(1, Math.max(0, slot.fx - (e.clientX - dragLast.x) / rect.width));
  slot.fy = Math.min(1, Math.max(0, slot.fy - (e.clientY - dragLast.y) / rect.height));
  dragLast = { x: e.clientX, y: e.clientY };
  studio.render();
});
canvas.addEventListener('pointerup', () => { dragLast = null; });
canvas.addEventListener('pointercancel', () => { dragLast = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.slots[selectedSlot];
  slot.zoom = Math.min(4, Math.max(1, slot.zoom * Math.exp(-e.deltaY * 0.0012)));
  studio.render();
}, { passive: false });

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const i = SLOT_NAMES.indexOf(selectedSlot);
  const step = e.key === 'ArrowRight' ? 1 : -1;
  selectSlot(SLOT_NAMES[(i + step + SLOT_NAMES.length) % SLOT_NAMES.length]);
});

// --- Boot -----------------------------------------------------------

buildSlotList();
selectSlot('hero');
wireControls();
syncUI();
studio.render();

// The opening cast, the same one shots.js defaults to: the star in
// front, the boulevard behind, neon and rooftop in the panels.
await Promise.all([
  loadSample('hero', 'star'),
  loadSample('back', 'boulevard'),
  loadSample('left', 'neon'),
  loadSample('right', 'rooftop'),
]);
studio.render();

// A ?shot= scene, when the URL carries one, restages the studio for
// its screenshot and raises window.__shotReady when it has settled.
await stageFromQuery(studio, { loadSample, syncUI });
