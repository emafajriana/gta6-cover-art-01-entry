// shots.js — fixed scenes for screenshots, driven by the query string:
//   ?shot=cover&photo=boulevard&layout=hero&grade=sunset&caption=Sunset%20Heist&size=square
//   ?shot=editor&photo=rooftop&layout=grid&grade=neon&caption=Neon%20Nights&size=wide
// `cover` hides the controls and shows the cover edge to edge; `editor`
// shows the app with a photo loaded. window.__shotReady is set once the
// cover has painted with its fonts, so a screenshot can wait on it.
import { SAMPLES } from './main.js';

const LAYOUT_ORDER = ['full', 'duo', 'trio', 'hero', 'grid', 'tilt'];
const GRADE_ORDER = ['sunset', 'neon', 'dusk', 'mono'];
const SIZE_ORDER = ['square', 'portrait', 'wide'];

function pressSeg(id, order, key) {
  const buttons = document.querySelectorAll(`#${id} button`);
  buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(order[i] === key)));
}

export async function runShot(shot, query, state, redraw, loadSample, setStatus) {
  const photo = query.get('photo') || 'boulevard';
  const layout = query.get('layout') || 'hero';
  const grade = query.get('grade') || 'sunset';
  const caption = query.get('caption') || 'Sunset Heist';
  const subtitle = query.get('subtitle') || 'a vice city story';
  const size = query.get('size') || 'square';

  state.layout = LAYOUT_ORDER.includes(layout) ? layout : 'hero';
  state.grade = GRADE_ORDER.includes(grade) ? grade : 'sunset';
  state.title = caption;
  state.subtitle = subtitle;
  state.size = SIZE_ORDER.includes(size) ? size : 'square';
  if (query.get('titleSize')) state.titleSize = Number(query.get('titleSize'));
  if (query.get('gradeIntensity')) state.gradeIntensity = Number(query.get('gradeIntensity'));

  // Keep the visible controls in sync with the scene.
  document.getElementById('title').value = caption;
  document.getElementById('subtitle').value = subtitle;
  pressSeg('layouts', LAYOUT_ORDER, state.layout);
  pressSeg('grades', GRADE_ORDER, state.grade);
  pressSeg('sizes', SIZE_ORDER, state.size);
  document.getElementById('exportSize').textContent =
    { square: '1080 × 1080', portrait: '1080 × 1350', wide: '1920 × 1080' }[state.size];

  // Fill every panel: the chosen sample first, the other two samples in
  // the remaining slots, so no panel shows a placeholder.
  const order = [photo, ...SAMPLES.filter((s) => s !== photo)];
  for (let i = 0; i < order.length; i++) {
    await loadSample(i, order[i]);
  }
  state.panelPhoto = [0, 1, 2, 0];

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (setStatus) setStatus('');

  // Wait for the display fonts, then paint twice so the canvas is final.
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('16px "Bebas Neue"'),
        document.fonts.load('16px "Pacifico"'),
      ]);
    } catch (err) { /* fall back to the system stack */ }
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
