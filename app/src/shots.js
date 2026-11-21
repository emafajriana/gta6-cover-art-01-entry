// app/src/shots.js — staged scenes for the entry's screenshots.
//
// The screenshot driver opens the studio with a query string that
// casts and dresses a cover, for example:
//   ?shot=cover&hero=star&back=boulevard&layout=popout&grade=sunset
//     &titlestyle=chrome&caption=Sunset%20Heist&size=wide
//   ?shot=editor&hero=rooftop&grade=neon&caption=Neon%20Nights
// `cover` hides the editor chrome and shows the poster edge to edge
// (the app's own drawing of an exported cover); `editor` shows the
// whole studio with the staged state in its controls. When the
// staged paint has settled, window.__shotReady flips true — that is
// the signal the screenshot waits on, so no capture is ever taken
// of a half-loaded scene.

const LAYOUTS = ['popout', 'panels', 'tilt'];
const GRADES = ['sunset', 'neon', 'dusk'];
const TITLE_STYLES = ['chrome', 'sunset', 'neon'];
const SIZES = ['square', 'portrait', 'wide'];

// The default cast: the cut-out star in the hero slot (someone has
// to burst out of the portal), the boulevard behind, neon and
// rooftop in the side panels.
const DEFAULT_CAST = { hero: 'star', back: 'boulevard', left: 'neon', right: 'rooftop' };

function pick(list, value, fallback) {
  return list.includes(value) ? value : fallback;
}

function numberParam(query, name, target, min, max) {
  const raw = query.get(name);
  if (raw === null) return;
  const n = Number(raw);
  if (Number.isFinite(n)) target[name] = Math.min(max, Math.max(min, n));
}

// Applies a query string to the studio. env.loadSample(slot, name)
// loads one bundled sample into a slot and resolves when it is
// painted-ready; env.syncUI() pushes the state into the editor's
// controls so an editor screenshot shows the staged numbers, not
// the boot defaults. Returns true when a shot was staged.
export async function stageFromQuery(studio, env) {
  const query = new URLSearchParams(window.location.search);
  const shot = query.get('shot');
  if (shot !== 'cover' && shot !== 'editor') return false;

  const { state } = studio;
  state.layout = pick(LAYOUTS, query.get('layout'), state.layout);
  state.grade = pick(GRADES, query.get('grade'), state.grade);
  state.titleStyle = pick(TITLE_STYLES, query.get('titlestyle'), state.titleStyle);
  state.size = pick(SIZES, query.get('size'), state.size);
  if (query.get('caption') !== null) state.caption = query.get('caption');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  numberParam(query, 'burst', state, 0, 1);
  numberParam(query, 'gradeStrength', state, 0, 1);
  // titleSize in the query is the state's titleScale under its
  // screenshot name.
  const titleSize = Number(query.get('titleSize'));
  if (query.get('titleSize') !== null && Number.isFinite(titleSize)) {
    state.titleScale = Math.min(1.6, Math.max(0.5, titleSize));
  }

  const cast = { ...DEFAULT_CAST };
  for (const slot of Object.keys(DEFAULT_CAST)) {
    if (query.get(slot)) cast[slot] = query.get(slot);
  }
  if (query.get('photo')) cast.back = query.get('photo');
  for (const slot of Object.keys(cast)) {
    await env.loadSample(slot, cast[slot]);
  }

  if (shot === 'cover') document.body.classList.add('shot-cover');
  env.syncUI();
  studio.render();
  // Two frames settle the paint before the capture is allowed.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  studio.render();
  window.__shotReady = true;
  return true;
}
