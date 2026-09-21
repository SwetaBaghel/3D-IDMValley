/**
 * Scroll-linked asset timeline for the 3D App Screen Matrix.
 *
 * One keyframe per section, index-locked to `sections` in data/siteContent.js.
 * The sampler is a pure function writing into a caller-owned object so the
 * render loop allocates nothing per frame.
 *
 * Field reference
 *   px/py/pz  world position of the device (px is later scaled to viewport)
 *   rx/ry/rz  base rotation in radians
 *   scale     uniform scale
 *   lift      0 = nodes flush with the screen | 1 = holographic nodes raised
 *   terminal  0 = application UI              | 1 = flat grid schematic
 *   bob       float amplitude multiplier
 *   spin      Y sway AMPLITUDE in radians (not a rate — see FocalModels)
 *   fade      opacity of the whole device
 *   flare     Studio Lens Reflection intensity
 *   shadow    ambient drop-shadow opacity
 */

/** Holographic data nodes — one per capability pillar. */
export const NODE_COUNT = 4

export const KEYFRAMES = [
  // 0 — Home: a premium interactive panel floating in the right third.
  {
    px: 2.5,
    py: 0.0,
    pz: 0.0,
    rx: -0.14,
    ry: -0.5,
    rz: 0.04,
    scale: 1.0,
    lift: 0.08,
    terminal: 0.0,
    bob: 1.0,
    spin: 0.1,
    fade: 1.0,
    flare: 0.7,
    shadow: 0.3,
  },
  // 1 — About Us: swings in tight and zooms to frame the statistics matrix.
  {
    px: 1.55,
    py: 0.6,
    pz: 0.85,
    rx: -0.06,
    ry: -2.05,
    rz: 0.0,
    scale: 1.18,
    lift: 0.0,
    terminal: 0.0,
    bob: 0.35,
    spin: 0.5,
    fade: 0.42,
    flare: 0.34,
    shadow: 0.14,
  },
  // 2 — Services: the screen tilts flat and the data nodes lift out of it.
  {
    px: 2.3,
    py: 0.02,
    pz: 0.35,
    rx: -0.66,
    ry: -0.34,
    rz: 0.0,
    scale: 1.0,
    lift: 1.0,
    terminal: 0.0,
    bob: 0.5,
    spin: 0.06,
    fade: 1.0,
    flare: 0.55,
    shadow: 0.44,
  },
  // 3 — Portfolio: rotates square to camera, display morphs to the grid
  //     schematic, and sets back behind the case cards.
  {
    px: 1.45,
    py: 0.5,
    pz: -2.3,
    rx: -0.04,
    ry: 0.0,
    rz: 0.0,
    scale: 1.5,
    lift: 0.18,
    terminal: 1.0,
    bob: 0.25,
    spin: 0.0,
    fade: 0.48,
    flare: 0.3,
    shadow: 0.2,
  },
  // 4 — Pricing: the same terminal, set further back behind the tier grid.
  {
    px: 0.0,
    py: 0.0,
    pz: -3.5,
    rx: -0.02,
    ry: 0.0,
    rz: 0.0,
    scale: 1.95,
    lift: 0.1,
    terminal: 1.0,
    bob: 0.12,
    spin: 0.0,
    fade: 0.38,
    flare: 0.42,
    shadow: 0.12,
  },
  // 5 — Contact Us: minimises out of focus, leaving the lead form alone.
  {
    px: 5.2,
    py: -0.35,
    pz: -2.2,
    rx: -0.18,
    ry: 1.3,
    rz: -0.08,
    scale: 0.34,
    lift: 0.0,
    terminal: 0.0,
    bob: 0.3,
    spin: 0.2,
    fade: 0.0,
    flare: 0.1,
    shadow: 0.0,
  },
]

const FIELDS = Object.keys(KEYFRAMES[0])

/** Preallocate a target object matching the keyframe shape. */
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
 * Sample the timeline at a continuous position and write into `out`.
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

/** Resting X positions of the four holographic nodes across the screen face. */
export const NODE_ANCHORS = [-0.78, -0.26, 0.26, 0.78]
