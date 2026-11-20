[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio — GTA-style cover art from any photo

**★ Signature: POP-OUT mode with a retro-chrome headline.** Load a
cut-out portrait (a photo with a transparent background) into the star
slot and the studio's headline layout does what flat cover makers
can't: your star **breaks out of the panel frame** — scaled taller
than the hero panel, feet planted on its bottom edge, head and
shoulders bursting over the top border and across the gutters,
ringed by a white keyline grown from the silhouette itself, under a
title set in **retro chrome** — a liquid-metal gradient with a mirror
horizon, bevelled edges and magenta/cyan offset shadows, straight off
a 1980s arcade marquee. Any ordinary photo can star too: it bursts
out inside a white-rimmed oval portal. A Burst slider controls how
far the star escapes.

Under that headline act, the studio is a complete cover maker: your
photos and a caption become multi-panel cover art in the style of
GTA 6's posters, exported as PNG at 1080×1080, 1080×1350, or
1920×1080. It runs offline in a desktop browser from its own static
files — photos never leave the machine.

## How it works

1. **Add photos** — pick files, drag and drop onto a slot, or start
   from the four built-in illustrated samples: three Vice City scenes
   plus a cut-out star character, ready to pop.
2. **Pick a layout** — Pop-Out (the signature), Hero, Full Bleed,
   Duo, Trio, Grid, or a Tilted snapshot stack over a painted sunset
   backdrop. Up to four photos at once.
3. **Set the pop** — in Pop-Out, choose which slot is the star and
   how far it bursts out of its frame.
4. **Crop each panel** — click a panel on the cover, then drag to
   pan, scroll to zoom, or use the zoom / pan sliders.
5. **Write the caption** — a big title in Bebas Neue and a neon-script
   subtitle, in your choice of Chrome, Sunset, or Neon lettering.
6. **Grade it** — Sunset, Neon Nights, Dusk, or Mono, with a strength
   slider, seeded film grain (identical on every export), a vignette,
   and a white poster frame.
7. **Export PNG** — one click at 1080×1080, 1080×1350, or 1920×1080,
   or all three at once.

Fast path: open the app and it boots straight into Pop-Out with the
samples loaded and the star already bursting — pick a size and hit
Export PNG.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests:
every file the app loads lives under `app/`.

## What's original here

- All lettering is Bebas Neue and Pacifico, vendored under the SIL
  Open Font License (see `app/fonts/`). No Rockstar Games logo,
  artwork, or fonts are used anywhere.
- The four samples are original flat illustrations drawn as code
  (`app/samples/src/*.svg`, rendered to PNG) — a boulevard at sunset,
  a rooftop at dusk, a neon club front, and the transparent-background
  star. No real person's photo, no game art.
- The sunset backdrop, slit-cut sun, palms, skyline, chrome
  lettering, grain, and vignette are all drawn in code on canvas.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` via
the vendored make.fun library. Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

A make.fun entry for competition
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).
