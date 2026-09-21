import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Box3,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  MONITOR_SCREEN,
  labelTexture,
  phoneScreenTexture,
  platformTexture,
  websiteTexture,
} from './heroScreens'

/* ------------------------------------------------------------------ *
 * Hero stage — models, scene graph and per-frame logic for the hero
 * carousel. HeroScenes.jsx is only the React/R3F glue around this.
 *
 * The hero carousel in 3D — the same four scenes as idmvalley.com's hero,
 * built from real models:
 *
 *   0  Mobile Applications   iPhone + Android / iOS badges
 *   1  Website Designing     iMac showing a "www.yourwebsite.com" site
 *   2  Digital Marketing     hub + six orbiting channel cards (SEO etc.)
 *   3  CloudOps              cloud + DEPLOY / SCALE / MONITOR / SECURE
 *
 * The whole graph is built imperatively once the models load and lives at
 * module scope, like the other stage assets: it is mutated every frame, and
 * react-hooks/immutability rightly forbids mutating hook-owned values.
 * ------------------------------------------------------------------ */

const DENIM = new Color('#0D47C7')
const NEON = new Color('#22D3EE')
const SNOW = new Color('#FBFBFB')
const MAX_STEP = 1 / 30

const MODELS = {
  phone: '/models/phone.glb',
  monitor: '/models/monitor.glb',
  cloud: '/models/cloud.glb',
  magnifier: '/models/magnifier.glb',
}

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)

/** Centre a loaded scene on the origin and scale its `axis` extent to `target`. */
function normalise(object, axis, target) {
  const box = new Box3().setFromObject(object)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const s = target / size[axis]
  object.scale.setScalar(s)
  object.position.copy(center).multiplyScalar(-s)
  const wrap = new Group()
  wrap.add(object)
  return wrap
}

/** Transmission renders the scene twice per frame. Swap it for plain
 *  transparent glass, which reads the same at hero size on a light page. */
function cheapenGlass(root, opacity) {
  root.traverse((o) => {
    if (!o.isMesh) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(m.transmission > 0)) continue
      m.transmission = 0
      m.transparent = true
      m.opacity = opacity
      m.depthWrite = false
      m.roughness = Math.min(m.roughness ?? 0.1, 0.08)
    }
  })
}

function labelPlane({ texture, aspect }, height) {
  const mesh = new Mesh(
    new PlaneGeometry(height * aspect, height),
    new MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }),
  )
  mesh.renderOrder = 2
  return mesh
}

function radialShadowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(13,30,72,0.45)')
  grad.addColorStop(0.5, 'rgba(13,40,110,0.14)')
  grad.addColorStop(1, 'rgba(13,71,199,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

const glassCard = new MeshPhysicalMaterial({
  color: '#ffffff',
  roughness: 0.12,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  transparent: true,
  opacity: 0.72,
})
const hubMaterial = new MeshPhysicalMaterial({
  color: '#F2F6FF',
  roughness: 0.08,
  metalness: 0.05,
  clearcoat: 1,
  iridescence: 1,
  iridescenceIOR: 1.35,
  iridescenceThicknessRange: [180, 680],
})
const ringDenim = new MeshPhysicalMaterial({ color: DENIM, roughness: 0.2, clearcoat: 1 })
const ringNeon = new MeshPhysicalMaterial({ color: NEON, roughness: 0.2, clearcoat: 1 })
const packetMaterial = new MeshBasicMaterial({ color: NEON, toneMapped: false })

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

/** Filled in once the models load; read by the component and useFrame. */
export const hero = {
  root: new Group(),
  shadow: null,
  slides: [],
  mobile: null,
  web: null,
  marketing: null,
  cloud: null,
}

function buildMobile(phoneScene) {
  cheapenGlass(phoneScene, 0.1)
  const screen = phoneScreenTexture()
  phoneScene.traverse((o) => {
    if (!o.isMesh) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m.name !== 'screen.001') continue
      /* Keep the model's own KHR_texture_transform, or the UI lands skewed. */
      if (m.map) {
        screen.offset.copy(m.map.offset)
        screen.repeat.copy(m.map.repeat)
        screen.center.copy(m.map.center)
        screen.rotation = m.map.rotation
        screen.channel = m.map.channel
      }
      /* A screen emits; it does not reflect the studio. Black base colour
         and a full-strength emissive map show the UI at its exact colours —
         lit colour plus emission was clipping everything to white. */
      m.map = null
      m.emissiveMap = screen
      m.emissive?.set('#ffffff')
      m.emissiveIntensity = 1
      m.color?.set('#000000')
      m.metalness = 0
      m.roughness = 0.25
      m.envMapIntensity = 0.15
      m.toneMapped = false
      m.needsUpdate = true
    }
  })
  const phone = normalise(phoneScene, 'y', 3.1)
  /* The model's screen faces -X; turn it to the camera. */
  phone.rotation.y = Math.PI / 2
  const holder = new Group()
  holder.add(phone)

  const android = labelPlane(platformTexture('android'), 0.42)
  android.position.set(-1.45, 0.85, 0.5)
  const ios = labelPlane(platformTexture('ios'), 0.42)
  ios.position.set(1.4, -0.75, 0.5)

  const group = new Group()
  group.add(holder, android, ios)
  hero.mobile = { group, holder, badges: [android, ios] }
  return group
}

function buildWeb(monitorScene) {
  /* Website on a plane fitted to the iMac's (tilted, -Z facing) screen,
     positioned in the model's own units before normalising. */
  const s = MONITOR_SCREEN
  const pivot = new Group()
  pivot.position.set(s.x, s.y, s.z - 0.0012)
  pivot.rotation.x = s.tilt
  const plane = new Mesh(
    new PlaneGeometry(s.w, s.h),
    new MeshBasicMaterial({ map: websiteTexture(), toneMapped: false }),
  )
  plane.rotation.y = Math.PI
  pivot.add(plane)
  monitorScene.add(pivot)

  const monitor = normalise(monitorScene, 'x', 3.7)
  monitor.rotation.y = Math.PI
  const holder = new Group()
  holder.add(monitor)
  const group = new Group()
  group.add(holder)
  hero.web = { group, holder }
  return group
}

const CHANNELS = [
  ['SEO', 'seo'],
  ['Content', 'content'],
  ['Email', 'email'],
  ['Analytics', 'analytics'],
  ['Video', 'video'],
  ['Ads', 'ads'],
]

function buildMarketing(magnifierScene) {
  const group = new Group()

  const hub = new Group()
  hub.add(new Mesh(new SphereGeometry(0.42, 48, 32), hubMaterial))
  const ringA = new Mesh(new TorusGeometry(0.62, 0.016, 12, 96), ringNeon)
  const ringB = new Mesh(new TorusGeometry(0.74, 0.016, 12, 96), ringDenim)
  hub.add(ringA, ringB)
  group.add(hub)

  const cardGeometry = new RoundedBoxGeometry(1.05, 0.46, 0.08, 4, 0.08)
  const cards = CHANNELS.map(([label, icon]) => {
    const card = new Group()
    card.add(new Mesh(cardGeometry, glassCard))
    const tag = labelPlane(labelTexture(label, { icon }), 0.34)
    tag.position.z = 0.05
    /* Fit the pill inside the card whatever the label length. */
    const maxW = 0.95
    const w = tag.geometry.parameters.width
    if (w > maxW) tag.scale.setScalar(maxW / w)
    card.add(tag)
    group.add(card)
    return card
  })

  cheapenGlass(magnifierScene, 0.2)
  const magnifier = normalise(magnifierScene, 'y', 1.25)
  /* Tipped back and turned so the rim and handle read as 3D, not a disc. */
  magnifier.rotation.set(0.35, 0.7, -0.55)
  group.add(magnifier)

  const lineGeometry = new BufferGeometry()
  lineGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(CHANNELS.length * 6), 3),
  )
  const lines = new LineSegments(
    lineGeometry,
    new LineBasicMaterial({ color: new Color().lerpColors(DENIM, SNOW, 0.55) }),
  )
  lines.frustumCulled = false
  group.add(lines)

  hero.marketing = { group, hub, ringA, ringB, cards, magnifier, lines }
  return group
}

const CLOUD_NODES = [
  ['DEPLOY', 'deploy', [-1.5, 0.95]],
  ['SCALE', 'scale', [1.5, 0.95]],
  ['MONITOR', 'monitor', [-1.5, -1.0]],
  ['SECURE', 'secure', [1.5, -1.0]],
]

function buildCloud(cloudScene) {
  const group = new Group()
  const cloud = normalise(cloudScene, 'x', 2.5)
  const holder = new Group()
  holder.add(cloud)
  group.add(holder)

  const nodes = CLOUD_NODES.map(([label, icon, [x, y]]) => {
    const tag = labelPlane(labelTexture(label, { icon }), 0.4)
    tag.position.set(x, y, 0.3)
    group.add(tag)
    return tag
  })

  /* Dashed wires from the cloud's rim to each node, plus a data packet
     travelling each wire. */
  const positions = new Float32Array(CLOUD_NODES.length * 6)
  const distances = new Float32Array(CLOUD_NODES.length * 2)
  CLOUD_NODES.forEach(([, , [x, y]], i) => {
    const sx = x * 0.42
    const sy = y * 0.34
    positions.set([sx, sy, 0.15, x, y, 0.3], i * 6)
    distances[i * 2] = 0
    distances[i * 2 + 1] = Math.hypot(x - sx, y - sy)
  })
  const wireGeometry = new BufferGeometry()
  wireGeometry.setAttribute('position', new BufferAttribute(positions, 3))
  wireGeometry.setAttribute('lineDistance', new BufferAttribute(distances, 1))
  const wires = new LineSegments(
    wireGeometry,
    new LineDashedMaterial({
      color: DENIM,
      dashSize: 0.08,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.55,
    }),
  )
  group.add(wires)

  const packetGeometry = new SphereGeometry(0.045, 12, 8)
  const packets = CLOUD_NODES.map(() => {
    const p = new Mesh(packetGeometry, packetMaterial)
    group.add(p)
    return p
  })

  hero.cloud = { group, holder, nodes, packets, positions }
  return group
}

export const ready = Promise.all(
  Object.entries(MODELS).map(([key, url]) =>
    loader.loadAsync(url).then((gltf) => [key, gltf.scene]),
  ),
).then((entries) => {
  const models = Object.fromEntries(entries)
  hero.slides = [
    buildMobile(models.phone),
    buildWeb(models.monitor),
    buildMarketing(models.magnifier),
    buildCloud(models.cloud),
  ]
  for (const slide of hero.slides) {
    slide.visible = false
    hero.root.add(slide)
  }
  hero.shadow = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      map: radialShadowTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  hero.shadow.rotation.x = -Math.PI / 2
  hero.shadow.position.y = -1.85
  hero.root.add(hero.shadow)
  hero.root.visible = false
})

/* ------------------------------------------------------------------ *
 * Transitions
 * ------------------------------------------------------------------ */

const easeOutBack = (t) => {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}
const smooth = (a, b, x) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/* ------------------------------------------------------------------ *
 * Per-frame update
 * ------------------------------------------------------------------ */

/** Fresh transition state for one hero instance. */
export function createHeroState() {
  return {
    presence: [1, 0, 0, 0],
    mode: ['enter', 'enter', 'enter', 'enter'],
    active: 0,
  }
}

/**
 * Advance the hero one frame. Pure of React and R3F, so the same code runs
 * in the live canvas and in off-screen dev renders.
 *
 * @param {object} ctx
 * @param {number} ctx.slide     active slide index
 * @param {number} ctx.elapsed   seconds since start
 * @param {number} ctx.delta     seconds since the previous frame
 * @param {boolean} ctx.reduced  prefers-reduced-motion
 * @param {DOMRect|null} ctx.rect  the hero slot's screen rect
 * @param {{width:number,height:number}} ctx.size      canvas size in px
 * @param {{width:number,height:number}} ctx.viewport  world units at z=0
 * @param {ReturnType<typeof createHeroState>} s  transition state (mutated)
 */
export function stepHero({ slide, elapsed, delta, reduced, rect, size, viewport }, s) {
  const root = hero.root
  const d = delta > MAX_STEP ? MAX_STEP : delta
  const time = reduced ? 0 : elapsed

  /* ---- Pin to the slot's screen rect; skip all work off screen ------- */
  if (!rect || rect.width === 0 || rect.bottom < 0 || rect.top > size.height) {
    root.visible = false
    return
  }
  const perPx = viewport.width / size.width
  root.position.set(
    (rect.left + rect.width / 2 - size.width / 2) * perPx,
    -(rect.top + rect.height / 2 - size.height / 2) * perPx,
    0,
  )
  root.scale.setScalar((Math.min(rect.width, rect.height * 1.05) * perPx) / 4.4)
  root.visible = true

  /* ---- Slide presence ------------------------------------------------ */
  if (slide !== s.active) {
    s.mode[s.active] = 'exit'
    s.mode[slide] = 'enter'
    s.active = slide
  }

  let shadow = 0
  hero.slides.forEach((group, i) => {
    const target = i === s.active ? 1 : 0
    s.presence[i] = reduced ? target : MathUtils.damp(s.presence[i], target, 6.5, d)
    const k = s.presence[i]
    group.visible = k > 0.004
    if (!group.visible) return
    shadow = Math.max(shadow, k)

    const back = 1 - k
    if (s.mode[i] === 'enter') {
      group.scale.setScalar(Math.max(0.0001, easeOutBack(k)))
      group.rotation.set(0, -1.1 * back, 0.08 * back)
      group.position.set(-0.7 * back, -0.2 * back, -1.2 * back)
    } else {
      group.scale.setScalar(Math.max(0.0001, k ** 0.8))
      group.rotation.set(0.1 * back, 1.2 * back, -0.08 * back)
      group.position.set(0.8 * back, 0.35 * back, -1.2 * back)
    }
    group.position.y += Math.sin(time * 0.9 + i) * 0.06
  })

  hero.shadow.visible = shadow > 0.01
  hero.shadow.material.opacity = shadow * 0.55
  hero.shadow.scale.set(3.4, 1.3, 1)

  /* ---- Per-scene idle motion + staggered supporting pieces ---------- */
  const pm = s.presence

  const mobile = hero.mobile
  if (mobile.group.visible) {
    mobile.holder.rotation.y = -0.32 + Math.sin(time * 0.5) * 0.28
    mobile.holder.rotation.x = Math.sin(time * 0.4) * 0.05
    mobile.badges.forEach((badge, i) => {
      badge.scale.setScalar(
        Math.max(0.0001, smooth(0.35 + i * 0.12, 0.8 + i * 0.12, pm[0])),
      )
      badge.position.z = 0.5 + Math.sin(time * 1.2 + i * 2) * 0.05
    })
  }

  const web = hero.web
  if (web.group.visible) {
    web.holder.rotation.y = -0.22 + Math.sin(time * 0.45) * 0.2
    web.holder.rotation.x = Math.sin(time * 0.35) * 0.03
  }

  const mk = hero.marketing
  if (mk.group.visible) {
    mk.ringA.rotation.set(1.1 + Math.sin(time * 0.3) * 0.2, time * 0.9, 0)
    mk.ringB.rotation.set(-0.5, -time * 0.6, 0.9)
    const lines = mk.lines.geometry.getAttribute('position')
    mk.cards.forEach((card, i) => {
      const a = (i / mk.cards.length) * Math.PI * 2 + time * 0.22
      const x = Math.cos(a) * 1.55
      const y = Math.sin(a) * 1.05
      const z = Math.sin(a) * 0.35
      const pop = Math.max(0.0001, smooth(0.25 + i * 0.07, 0.7 + i * 0.07, pm[2]))
      card.position.set(x, y, z)
      card.scale.setScalar(pop)
      lines.setXYZ(i * 2, x * 0.3, y * 0.3, z * 0.3)
      lines.setXYZ(i * 2 + 1, x * pop, y * pop, z * pop)
      if (i === 0) {
        /* The magnifier rides on the SEO card. */
        mk.magnifier.position.set(x + 0.42, y + 0.2, z + 0.28)
        mk.magnifier.scale.setScalar(pop)
        mk.magnifier.rotation.y = 0.7 + Math.sin(time * 0.8) * 0.3
      }
    })
    lines.needsUpdate = true
  }

  const cl = hero.cloud
  if (cl.group.visible) {
    cl.holder.rotation.y = Math.sin(time * 0.4) * 0.3
    cl.holder.position.y = Math.sin(time * 0.8) * 0.05
    cl.nodes.forEach((node, i) => {
      const pop = Math.max(0.0001, smooth(0.3 + i * 0.1, 0.75 + i * 0.1, pm[3]))
      node.scale.setScalar(pop)
    })
    cl.packets.forEach((packet, i) => {
      const t = (time * 0.55 + i * 0.25) % 1
      const p = cl.positions
      const o = i * 6
      packet.position.set(
        MathUtils.lerp(p[o], p[o + 3], t),
        MathUtils.lerp(p[o + 1], p[o + 4], t),
        MathUtils.lerp(p[o + 2], p[o + 5], t),
      )
      packet.visible = pm[3] > 0.6
    })
  }
}
