/**
 * Scroll-linked timeline for the Code Bracket Core — `< • >`.
 *
 * One keyframe per section, index-locked to `sections` in data/siteContent.js
 * (Home, About, Services, Pricing, Contact, Portfolio). Same sampler contract
 * as sequence.js: pure, writes into a caller-owned object, allocates nothing.
 *
 * Shared fields (read by Scene.jsx for the shadow and the flare too)
 *   px/py/pz  world position (px is scaled to viewport width at runtime)
 *   rx/ry/rz  base rotation in radians
 *   scale     uniform scale
 *   bob       float amplitude multiplier
 *   spin      Y sway AMPLITUDE in radians (not a rate)
 *   fade      opacity of the whole emblem
 *   flare     Studio Lens Reflection intensity
 *   shadow    ambient drop-shadow opacity
 *
 * Emblem fields
 *   open      bracket separation: 0 = `<•>` hugging the core, 1 = wide open
 *   orbit     radius multiplier of the resting node ring (0 = inside the core)
 *   focus     0 -> 1 blend of the four nodes into the Services column
 *   stars     0 -> 1 blend of all eleven nodes into the client constellation
 *   nodes     node visibility, 0 -> 1
 */

export const KEYFRAMES = [
  // 0 — Home: hidden — the hero carousel owns this section. The pose is
  //     kept so the emblem swings in from the right third as About nears.
  {
    px: 2.45,
    py: 0.05,
    pz: 0,
    rx: -0.08,
    ry: -0.42,
    rz: 0,
    scale: 1,
    bob: 1,
    spin: 0.22,
    fade: 0,
    flare: 0.2,
    shadow: 0,
    open: 0.32,
    orbit: 1,
    focus: 0,
    stars: 0,
    nodes: 1,
  },
  // 1 — About Us: brackets swing wide and the four nodes fly out to a wide
  //     orbit, one per statistic.
  {
    px: 2.55,
    py: 0.35,
    pz: 0.5,
    rx: -0.04,
    ry: 0.32,
    rz: 0,
    scale: 0.9,
    bob: 0.4,
    spin: 0.3,
    fade: 0.5,
    flare: 0.35,
    shadow: 0.12,
    open: 0.7,
    orbit: 1.5,
    focus: 0,
    stars: 0,
    nodes: 1,
  },
  // 2 — Services: nodes line up in a column facing the service cards; the
  //     hovered pillar's node pushes forward and its wire lights up.
  {
    px: 2.55,
    py: 0,
    pz: 0.3,
    rx: 0,
    ry: -0.22,
    rz: 0,
    scale: 1,
    bob: 0.35,
    spin: 0.06,
    fade: 1,
    flare: 0.55,
    shadow: 0.34,
    open: 0.2,
    orbit: 1,
    focus: 1,
    stars: 0,
    nodes: 1,
  },
  // 3 — Pricing: fades out while stepping up and back. The calculator fills
  //     the viewport and leaves no clear ground, so Pricing and Contact are
  //     treated as focus sections — no 3D competing with a conversion task.
  {
    px: 3.2,
    py: 1.25,
    pz: -2.4,
    rx: -0.05,
    ry: 0.2,
    rz: 0,
    scale: 0.85,
    bob: 0.2,
    spin: 0.12,
    fade: 0,
    flare: 0.1,
    shadow: 0,
    open: 0.4,
    orbit: 1.1,
    focus: 0,
    stars: 0,
    nodes: 1,
  },
  // 4 — Contact Us: brackets close round the core `<•>` and the emblem
  //     shrinks out of frame, leaving the form alone.
  {
    px: 4.8,
    py: -0.3,
    pz: -2,
    rx: 0,
    ry: 0.9,
    rz: 0,
    scale: 0.35,
    bob: 0.2,
    spin: 0.1,
    fade: 0,
    flare: 0.1,
    shadow: 0,
    open: 0,
    orbit: 0,
    focus: 0,
    stars: 0,
    nodes: 0,
  },
]

const FIELDS = Object.keys(KEYFRAMES[0])

export function createSample() {
  const out = {}
  for (const key of FIELDS) out[key] = KEYFRAMES[0][key]
  return out
}

/** Ken Perlin's smootherstep — C2 continuous, so no velocity pops at joins. */
function smootherstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * @param {number} timeline 0 -> KEYFRAMES.length - 1
 * @param {object} out preallocated object from createSample()
 */
export function sampleTimeline(timeline, out) {
  const last = KEYFRAMES.length - 1
  const t = timeline < 0 ? 0 : timeline > last ? last : timeline
  const i = Math.min(last - 1, Math.floor(t))
  const f = smootherstep(t - i)
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[i + 1]
  for (const key of FIELDS) {
    const av = a[key]
    out[key] = av + (b[key] - av) * f
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Node layouts, in the emblem's local space.
 * ------------------------------------------------------------------ */

/** Total nodes: one per client on the roster. The first four double as the
 *  four service pillars (Branding, Tech, Digital Marketing, CloudOps). */
export const NODE_COUNT = 11
export const SERVICE_NODES = 4

/**
 * Services column: to the LEFT of the core, stacked top to bottom in the same
 * order as the service cards, so each card's wire points back at its card.
 */
export const SERVICE_LAYOUT = [
  [-1.8, 0.84, 0.2],
  [-1.97, 0.28, 0.32],
  [-1.97, -0.28, 0.32],
  [-1.8, -0.84, 0.2],
]

/**
 * Client constellation: a Fibonacci sphere, flattened in depth so every node
 * stays readable from the front. Precomputed once.
 */
export const STAR_LAYOUT = Array.from({ length: NODE_COUNT }, (_, i) => {
  const y = 1 - ((i + 0.5) / NODE_COUNT) * 2
  const r = Math.sqrt(1 - y * y)
  const theta = i * Math.PI * (3 - Math.sqrt(5))
  const radius = 1.6
  return [
    Math.cos(theta) * r * radius,
    y * radius * 0.9,
    Math.sin(theta) * r * radius * 0.5,
  ]
})
