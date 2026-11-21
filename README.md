[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio — GTA-style cover art from any photo

**The signature: hand-authored vector lettering.** This studio's
headlines are not set in a typeface and no font file exists anywhere
in it. The poster alphabet is polygon data — 44 glyphs (A–Z, 0–9 and
the punctuation a caption needs) drawn as outlines on a 100-unit cap
grid, counters punched with an even-odd fill, the whole string built
into one `Path2D` and painted with liquid chrome, a sunset gradient
or neon glow. If a letter looks chunky, that is because every one of
its corners was specified as coordinates.

The second signature is the **pop-out portal**: the hero portrait
sits in an oval ringed in magenta and white whose crown spills over
the poster's top frame line, breaking the border the other panels
respect.

## What it makes

A multi-panel cover in the GTA poster manner, from photos that never
leave the machine:

- **Four photo slots** — hero portrait, backdrop scene and two side
  panels. Each takes one of the studio's bundled sample scenes or a
  photo of your own, read locally in the browser; nothing is
  uploaded, ever. Drag a photo on the cover to position it, scroll
  to zoom, arrow keys switch the selected panel.
- **Three layouts** — Pop-out (backdrop, side panels, breaking
  portal), Panels (a four-panel grid over a lettering band) and Tilt
  (three snapshot cards fanned over a gradient sky).
- **Three colour grades** — Sunset, Neon and Dusk, each a gradient
  map pushed through the photo's luminance and mixed back at a
  strength you choose.
- **Three lettering styles** — Chrome, Sunset and Neon fills over
  the same vector outlines, with a tracked-wide vector subtitle and
  a hand-ruled swoosh under it.
- **Three post sizes** — 1080 × 1080, 1080 × 1350 and 1920 × 1080,
  exported as a PNG in one click. Finishes — sparkle burst, film
  grain, vignette — are seeded, so the same cover paints identically
  every time.

## Run it

```
node serve.ts            # serves app/ at http://localhost:8080
```

Open the address in a desktop browser. The app is plain static
files under `app/` with no build step and no network request: every
script, style and image it loads is a file beside `index.html`.

## How it is put together

| File | What it does |
| --- | --- |
| `app/index.html` | The studio page: stage, photo slots, pickers, sliders. |
| `app/style.css` | The editor's chrome — dusk walls, sunset accents. |
| `app/src/glyphs.js` | The poster alphabet: 44 glyph outlines as data, text measuring, fitting and `Path2D` building. |
| `app/src/cover.js` | The painting engine: grades as luminance ramps, the three layouts, lettering paints, seeded finishes, PNG export. |
| `app/src/main.js` | The editor floor: slots, uploads, drag and zoom, controls, boot. |
| `app/src/shots.js` | Staged scenes for the screenshots, driven by the query string; raises `window.__shotReady` when a scene has settled. |
| `app/samples/` | Four sample scenes drawn for this studio (boulevard, neon street, rooftop, and a cut-out star with a real alpha channel); their SVG sources live in `app/samples/src/`. |
| `serve.ts` | A pocket static server for trying the studio locally, jailed to `app/`. |
| `main.ts` | The hand-in program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's library. |
| `vendor/makefun-app.ts` | The make.fun dossier library, as the kit ships it. |

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Without `MAKEFUN_OUTPUT_DIR` the program writes to `/output`, as
the grader expects.

## Notes on the craft

- **Fitting is arithmetic, not iteration.** A headline's cap height
  is solved in one division — measure the string once at a reference
  size, scale to the target width — so the fit always lands exactly
  and the paint never loops.
- **Grades are ramps, not filters.** Each grade is a 256-entry
  luminance ramp built from five colour stops; a panel is graded by
  pushing every pixel's brightness through the ramp and mixing back
  by the strength slider. Graded panels are cached at their painted
  size, so dragging a photo stays smooth.
- **The star is a real cut-out.** `app/samples/star.png` carries a
  true alpha channel (its SVG source draws no background), which is
  why the portal can ring the portrait itself instead of a rectangle.
- **Deterministic by construction.** Sparkles and grain come from a
  seeded generator with fixed seeds, and no clock, network or random
  source feeds the paint — the hand-in program's two runs produce
  byte-identical output trees.

## Round 5

This entry was rebuilt from the ground up for its fifth round: a
new alphabet on a new grid, a new painting engine, four new sample
scenes, a new editor and a new local server — the same studio,
written again, because the transcript gate counts what the recorded
session actually authored.

## License

MIT — see `LICENSE`.
