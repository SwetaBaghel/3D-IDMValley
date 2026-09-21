/**
 * DEV ONLY — renders the hero stage off-screen with the same camera as the
 * live canvas, stepping stepHero() with a synthetic slot rect. Works with
 * the preview pane hidden (no rAF, no ResizeObserver needed).
 *
 *   const h = await import('/src/dev/renderHero.js')
 *   await h.renderHeroSlide(2)            // settled
 *   await h.renderHeroSlide(1, { frames: 6, from: 0 })  // mid-transition
 */
import {
  Color,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createHeroState, hero, ready, stepHero } from '../three/heroStage'

const W = 1440
const H = 900
const FOV = 34
/** Where the hero slot sits in a 1440x900 layout (two-column hero). */
const SLOT = { left: 790, top: 150, width: 560, height: 560 }

export async function renderHeroSlide(slide, { frames = 60, from = null, elapsed = 2 } = {}) {
  await ready
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false })
  renderer.setSize(W, H, false)
  renderer.toneMapping = NeutralToneMapping
  const scene = new Scene()
  scene.background = new Color('#fbfbfb')
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  scene.add(new AmbientLight('#ffffff', 0.45))
  const key = new DirectionalLight('#ffffff', 1.1)
  key.position.set(-3, 4, 5)
  scene.add(key, hero.root)

  const camera = new PerspectiveCamera(FOV, W / H, 0.1, 60)
  camera.position.set(0, 0, 9)
  const vh = 2 * 9 * Math.tan(((FOV / 2) * Math.PI) / 180)
  const ctx = {
    elapsed,
    delta: 1 / 30,
    reduced: false,
    rect: { ...SLOT, right: SLOT.left + SLOT.width, bottom: SLOT.top + SLOT.height },
    size: { width: W, height: H },
    viewport: { width: vh * (W / H), height: vh },
  }

  const s = createHeroState()
  if (from !== null) {
    /* Settle on `from` first, then switch, to catch a transition mid-way. */
    s.presence = [0, 0, 0, 0]
    s.presence[from] = 1
    s.active = from
    for (let i = 0; i < 40; i += 1) stepHero({ ...ctx, slide: from }, s)
  }
  for (let i = 0; i < frames; i += 1) {
    ctx.elapsed += 1 / 30
    stepHero({ ...ctx, slide }, s)
  }
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  scene.remove(hero.root)
  renderer.dispose()
  return url
}
