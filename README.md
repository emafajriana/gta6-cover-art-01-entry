[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/emafajriana/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio — GTA-style cover art from any photo

**★ Signature: hand-drawn vector lettering — every glyph is code.**
This studio's headlines are not set in a font. Its poster alphabet
was authored by hand as polygon data (`app/src/glyphs.js`): 44
chunky glyphs — A–Z, 0–9 and punctuation — each one a set of outlines
on a 90-unit cap grid, counters and all. At draw time the outlines
become canvas paths and are filled like metal: a liquid-chrome
gradient with a hard mirror horizon, bevelled strokes and
magenta/cyan offset shadows, or molten sunset, or neon. The tagline
uses the same glyphs leaned into a script hand with a swoosh
underline. There are **no font files anywhere in this entry** — the
lettering *is* source code, so it renders identically on every
machine, offline, forever. Round 4 re-cut eight of the glyphs (see
"The lettering, up close") for a chunkier poster hand.

That lettering crowns the studio's other signature, **POP-OUT
mode**: give the star slot a cut-out portrait (a photo with a
transparent background) and your star **breaks out of the panel
frame** — standing taller than the hero panel, feet planted on its
bottom edge, head and shoulders bursting over the top border and
across the gutters, ringed by a white keyline grown from the
silhouette itself. Any ordinary photo can star too: it bursts out
inside a white-rimmed oval portal, which now wears a magenta
pinstripe of its own. A Burst slider decides how far the star
escapes.

Under the headline act sits a complete cover maker: your photos and
a caption become multi-panel cover art in the style of GTA 6's
posters, exported as PNG at 1080×1080, 1080×1350 or 1920×1080. It
runs offline in a desktop browser from its own static files — photos
never leave the machine.

## How it works

1. **Add photos** — pick files, drag and drop onto a slot, or start
   from the four built-in illustrated samples: three Vice City scenes
   plus a cut-out star character, ready to pop.
2. **Pick a layout** — Pop-Out (the signature), Hero, Full Bleed,
   Duo, Trio, Grid, or a tilted snapshot stack over a painted sunset
   backdrop. Up to four photos at once.
3. **Set the pop** — in Pop-Out, choose which slot is the star and
   how far she bursts out of her frame.
4. **Crop each panel** — click a panel on the cover, then drag to
   pan, scroll to zoom, use the zoom / pan sliders, or step between
   panels with the ← and → keys.
5. **Write the caption** — a big headline in the hand-drawn vector
   alphabet and a script-leaned tagline from the same glyphs, in
   your choice of Chrome, Sunset or Neon paint.
6. **Grade it** — Sunset, Neon Nights, Dusk or Mono, with a strength
   slider, seeded film grain (identical on every export), a vignette
   and a white poster frame.
7. **Export PNG** — one click at 1080×1080, 1080×1350 or
   1920×1080, or all three at once.

Fast path: open the app and it boots straight into Pop-Out with the
samples loaded and the star already bursting — pick a size and hit
Export PNG.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests:
every file the app loads lives under `app/`. The server itself was
rewritten for round 4 — an async responder with the port flag, the
path jail and the content types as separate small functions — under
exactly the same contract as before: same flags, same jail, same
status lines.

## What's original here

- The lettering is an alphabet drawn as data: 44 glyph outlines
  stored as polygon coordinates in `app/src/glyphs.js` and painted
  on canvas by `app/src/cover.js`. No font files, no font loading,
  and no Rockstar Games logo, artwork or fonts anywhere.
- The four samples are original flat illustrations drawn as code
  (`app/samples/src/*.svg`, rendered to PNG) — a boulevard at
  sunset with a teal convertible, a rooftop at dusk under string
  lights, a neon club front with a queue outside, and the
  transparent-background star. No real person's photo, no game art.
  Round 4 detailed them further: rain over the neon street, a
  pigeon on the rooftop railing, the sun's streak on the boulevard
  tarmac, and jewellery on the star.
- The sunset backdrop, slit-cut sun, palms, skyline, chrome
  lettering, grain and vignette are all drawn in code on canvas.

## The lettering, up close

Each glyph lives on a grid 90 units tall. An outline is a list of
`[x, y]` points; a letter with a counter (A, B, D, O, P, Q, R, 0, 4,
6, 8, 9) carries a second, inner outline that the canvas fills with
the even-odd rule, punching the hole. Letters advance by their own
measured widths, so a headline is fitted to its band by arithmetic,
not by eye: the studio adds up the glyph widths, scales the whole
line to the band, and centres it. Because the shapes are plain data,
the same alphabet takes any paint the canvas can make — this entry
ships three (liquid chrome, molten sunset, neon) — and the tagline
is the same outlines again, sheared into a lean and underlined with
a tapering swoosh. If a caption uses a character outside the 44,
the alphabet politely falls back to a blank space rather than
reaching for a system font.

Round 4 re-cut eight glyphs in place: A's flat top became a pointed
apex, M's centre vertex drops deeper, S's lower bowl rounds out,
G's spur thickened, R's leg kicks further out, Q's tail swings
below the baseline, 4's crossbar rose, and 7 grew a crossbar of its
own. No glyph's advance width moved, so every fitted headline keeps
the measure it had — only the shapes inside the measure changed.
The chrome's mirror band widened too, and headline and tagline
fitting now solves the size in one step of arithmetic instead of
shrinking pixel by pixel.

## Round 4 polish pass

- `serve.ts` rewritten end to end (async responder, jail and port
  parsing as separate functions) under its original contract.
- Eight glyphs re-cut (above); chrome mirror band widened; the
  sunset wash deepened at mid-panel; seeded stars join the night
  grades of the tilted-stack backdrop.
- The oval pop-out portal gained a magenta pinstripe ring.
- The editor learned the ← / → keys for stepping between panels,
  recycles blob URLs when a slot's photo is replaced, and its
  staged screenshot scenes now set the sliders and finish switches
  to match the staged state.
- The four sample illustrations were detailed and re-rendered, and
  the entry's screenshots were re-shot from the polished app.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` via
the vendored make.fun library. Its flow was restructured in round 4
(a single `main()` and a stack-walk file counter); the hand-in it
produces is unchanged. Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

A make.fun entry for competition
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).
