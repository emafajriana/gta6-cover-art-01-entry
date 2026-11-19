[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio — GTA-style cover art from any photo

Turn a photo and a caption into multi-panel cover art in the style of
GTA 6's posters — bold condensed lettering, a Vice City sunset or neon
colour grade — and export it as a PNG to share. It runs offline in a
desktop browser from its own static files: photos never leave the
machine.

## How it works

1. **Add photos** — pick files, drag and drop onto a slot, or try one
   of the three built-in illustrated samples.
2. **Pick a layout** — full bleed, duo split, trio strip, hero + three,
   four-grid, or a tilted snapshot stack. Up to four photos at once.
3. **Crop each panel** — click a panel, then drag it, scroll to zoom,
   or use the zoom / pan sliders.
4. **Write the caption** — a big title in Bebas Neue with a sunset
   gradient fill and black outline, plus a neon-script subtitle.
5. **Grade it** — Sunset, Neon Nights, Dusk, or Mono, with a strength
   slider, film grain, vignette, and a white poster frame.
6. **Export PNG** — one click at 1080×1080, 1080×1350, or 1920×1080,
   or all three at once.

Fast path: open the app and a sample photo is already loaded — pick a
size and hit Export PNG.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests:
every file the app loads lives under `app/`.

## What's original here

- All lettering is Bebas Neue and Pacifico, vendored under the SIL Open
  Font License (see `app/fonts/`). No Rockstar Games logo, artwork, or
  fonts are used anywhere.
- The three sample portraits are original flat illustrations drawn in
  code (`app/samples/src/*.svg`, rendered to PNG) — no real person's
  photo, no game art.
- The sunset backdrop, palms, skyline, grain, and vignette are all
  drawn in code on canvas.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` via
the vendored make.fun library. Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

A make.fun entry for competition
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).
