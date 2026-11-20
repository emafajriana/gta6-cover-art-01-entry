// shots.js — staged scenes for the entry's screenshots, driven by
// the query string:
//   ?shot=cover&photo=boulevard&layout=popout&grade=sunset&titlestyle=chrome&caption=Sunset%20Heist&size=wide
//   ?shot=editor&photo=rooftop&layout=popout&grade=neon&caption=Neon%20Nights&size=wide
// `cover` hides the control rail and shows the poster edge to edge
// (the app's own drawing of an exported cover); `editor` shows the
// studio with its cast loaded. Once the staged cover has painted,
// window.__shotReady flips true so the screenshot can wait on it.

const LAYOUT_ORDER = ['popout', 'hero', 'full', 'duo', 'trio', 'grid', 'tilt'];
const GRADE_ORDER = ['sunset', 'neon', 'dusk', 'mono'];
const SIZE_ORDER = ['square', 'portrait', 'wide'];
const STYLE_ORDER = ['chrome', 'sunset', 'neon'];
const SCENES = ['boulevard', 'rooftop', 'neon'];
const SIZE_LABELS = { square: '1080 × 1080', portrait: '1080 × 1350', wide: '1920 × 1080' };

function pick(order, value, fallback) {
  return order.includes(value) ? value : fallback;
}

function pressSeg(id, order, key) {
  document.querySelectorAll(`#${id} button`).forEach((b, i) => {
    b.setAttribute('aria-pressed', String(order[i] === key));
  });
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

  // The visible controls tell the same story as the staged state.
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  pressSeg('layouts', LAYOUT_ORDER, state.layout);
  pressSeg('grades', GRADE_ORDER, state.grade);
  pressSeg('sizes', SIZE_ORDER, state.size);
  pressSeg('titleStyles', STYLE_ORDER, state.titleStyle);
  document.getElementById('popoutControls').style.display =
    state.layout === 'popout' ? '' : 'none';
  document.getElementById('exportSize').textContent = SIZE_LABELS[state.size];

  // Cast the cover: the chosen scene takes the hero slot, the other
  // two scenes fill the column, and the cut-out star takes the star
  // slot, so a Pop-Out scene always has someone to burst out.
  const cast = [photo, ...SCENES.filter((s) => s !== photo)];
  for (let i = 0; i < cast.length; i++) {
    await loadSample(i, cast[i]);
  }
  await loadSample(state.starSlot, samples.includes('star') ? 'star' : cast[0]);
  state.panelPhoto = [0, 1, 2, 0];

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (setStatus) setStatus('');

  // No font files to wait for — the lettering is system stacks — so
  // paint, let two frames settle, and declare the scene ready.
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  redraw();
  window.__shotReady = true;
}
