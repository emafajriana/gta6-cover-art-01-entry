// shots.js — fixed scenes for the entry's screenshots, driven by the
// query string:
//   ?shot=cover&photo=boulevard&layout=popout&grade=sunset&titlestyle=chrome&caption=Sunset%20Heist&size=wide
//   ?shot=editor&photo=rooftop&layout=popout&grade=neon&caption=Neon%20Nights&size=wide
// `cover` hides the controls and shows the cover edge to edge (the
// app's own drawing of an exported cover); `editor` shows the studio
// with its cast loaded. window.__shotReady is set once the cover has
// painted with its fonts, so the screenshot can wait on it.

const LAYOUT_ORDER = ['popout', 'hero', 'full', 'duo', 'trio', 'grid', 'tilt'];
const GRADE_ORDER = ['sunset', 'neon', 'dusk', 'mono'];
const SIZE_ORDER = ['square', 'portrait', 'wide'];
const STYLE_ORDER = ['chrome', 'sunset', 'neon'];
const SCENES = ['boulevard', 'rooftop', 'neon'];

function pressSeg(id, order, key) {
  const buttons = document.querySelectorAll(`#${id} button`);
  buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(order[i] === key)));
}

function pick(order, value, fallback) {
  return order.includes(value) ? value : fallback;
}

export async function runShot(shot, query, api) {
  const { state, redraw, loadSample, setStatus, samples } = api;
  const photo = query.get('photo') || 'boulevard';

  state.layout = pick(LAYOUT_ORDER, query.get('layout'), 'popout');
  state.grade = pick(GRADE_ORDER, query.get('grade'), 'sunset');
  state.titleStyle = pick(STYLE_ORDER, query.get('titlestyle'), 'chrome');
  state.title = query.get('caption') || 'Sunset Heist';
  state.subtitle = query.get('subtitle') || 'a vice city story';
  state.size = pick(SIZE_ORDER, query.get('size'), 'square');
  if (query.get('titleSize')) state.titleSize = Number(query.get('titleSize'));
  if (query.get('gradeIntensity')) state.gradeIntensity = Number(query.get('gradeIntensity'));
  if (query.get('burst')) state.burst = Number(query.get('burst'));

  // Keep the visible controls in sync with the scene.
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('titleStyles').style.display = '';
  pressSeg('layouts', LAYOUT_ORDER, state.layout);
  pressSeg('grades', GRADE_ORDER, state.grade);
  pressSeg('sizes', SIZE_ORDER, state.size);
  pressSeg('titleStyles', STYLE_ORDER, state.titleStyle);
  document.getElementById('popoutControls').style.display = state.layout === 'popout' ? '' : 'none';
  document.getElementById('exportSize').textContent =
    { square: '1080 × 1080', portrait: '1080 × 1350', wide: '1920 × 1080' }[state.size];

  // Cast the cover: the chosen scene in the hero slot, the other two
  // scenes beside it, and the cut-out star in the star slot, so a
  // Pop-Out scene has someone to burst out of the frame.
  const scenes = [photo, ...SCENES.filter((s) => s !== photo)];
  for (let i = 0; i < scenes.length; i++) {
    await loadSample(i, scenes[i]);
  }
  await loadSample(state.starSlot, samples.includes('star') ? 'star' : scenes[0]);
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
