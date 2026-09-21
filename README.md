# IDM Valley — Corporate Light Theme (WebGL)

Single-page site for IDM Valley, built on React 19 + Vite 8, with a
scroll-linked three.js stage rendered behind the document.

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint     # eslint, incl. the strict react-hooks purity rules
npm run build
```

## Architecture

```
src/
  data/siteContent.js     all copy and metrics — one source of truth
  data/quoteCatalog.js    Project Quote Calculator prices, from the live site
  state/stageStore.js     DOM scroll <-> WebGL bridge (see note below)
  hooks/
    useActivePage.js      owns the active section + navbar highlight
    useScrollTimeline.js  maps scroll position onto the 3D timeline
  three/
    Scene.jsx             Canvas, studio lighting rig, lens-flare pass
    FocalModels.jsx       the 3D App Screen Matrix
    sequence.js           per-section keyframes + pure sampler
  components/
    Navbar.jsx, Footer.jsx, sections/*.jsx, ui/*.jsx
```

### The scroll bridge

`stageStore` deliberately exposes two read paths:

- `stage` — a mutable singleton read **directly inside `useFrame`**. Scroll
  never re-renders React, and the render loop allocates nothing per frame.
- `subscribe` / `getSnapshot` — a `useSyncExternalStore` source for the few
  components that must re-render (navbar highlight, service selection,
  quote calculator). The snapshot is only rebuilt when a _discrete_ value
  changes, so referential equality holds.

Because the hot path mutates three.js objects every frame, the timeline
sample and the materials live at module scope in `FocalModels.jsx` rather
than in `useMemo` — `react-hooks/immutability` (correctly) forbids mutating
a value that was handed to a hook.

### The timeline

`sequence.js` holds one keyframe per section, index-locked to `sections` in
`siteContent.js`. **Reordering sections requires reordering the keyframes.**
The sampler is pure and writes into a caller-owned object.

`useScrollTimeline` measures each section's own centre line rather than using
`scrollY / scrollHeight`, so section N's pose lands when section N is centred
regardless of relative section heights.

## Theme

All colour lives in the `@theme` block of `src/index.css`: Electric Denim
Blue `#0D47C7` as the accent, a Neon Cyan utility spectrum, deep steel for
the 3D chassis. The canvas is transparent (`alpha: true`) so the CSS
`grid-matrix` and `ambient-mesh` layers show through underneath.

Two colour rules worth keeping:

- `--color-neon` (#22D3EE) is ~2.9:1 on snow — large text, 3D emissives and
  fills only. Use `--color-neon-ink` for anything at body size.
- `GradientText` splits its tones on text SIZE, not meaning: `display`
  carries the cyan midpoint (large text only), `label` drops it so the 11px
  eyebrows stay legible. `index.css` carries a `forced-colors` / `print`
  fallback keyed off `.bg-clip-text` — without it, clipped gradient text is
  invisible in Windows High Contrast.

## Compositor budget

`gpu-layer` is permanent promotion and is reserved for the few elements that
composite continuously (canvas wrapper, fixed header, active underline, the
crossfading contact panels). Everything else uses `gpu-hover`, which takes a
layer on hover/focus and hands it straight back. `will-change` is a standing
GPU-texture reservation, not a free hint — keep the permanent count in single
digits, and check it with:

```js
;[...document.querySelectorAll('*')].filter(
  (e) => getComputedStyle(e).willChange !== 'auto',
).length
```

The 3D glass material is deliberately NOT transmissive: a transmission pass
renders the scene to a second buffer every frame, which is the one thing that
would genuinely threaten the mobile frame budget.

## Before launch

- Portfolio shows the client roster only, and there is no Blogs section.
  Both are intentional: the live site has client logos but no case-study or
  blog material, and outcome copy attached to real client names must come
  from the real engagements. See the note at the top of `siteContent.js`.

- `quoteCatalog.js` is a hand transcription of the live calculator
  (captured 2026-09-18). When prices change on idmvalley.com, change them
  here too — INR and USD are set independently per item, so update both.
- The contact form validates and shows a success state but does not POST
  anywhere yet. See the `TODO` in `components/sections/Contact.jsx`.
