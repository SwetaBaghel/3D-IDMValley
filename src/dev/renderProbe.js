/**
 * DEV ONLY — never imported by the app, so it is not bundled.
 *
 * Renders a GLB (or a whole three.js scene) off-screen and returns PNG data
 * URLs plus a mesh inventory. Used from the browser console to inspect
 * assets when the preview pane is not visible:
 *
 *   const p = await import('/src/dev/renderProbe.js')
 *   await p.probeModel('/models/phone.glb')
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)

export async function probeModel(
  url,
  { views = ['front', 'three-quarter', 'side'], width = 640, height = 480 } = {},
) {
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene

  const inventory = []
  root.updateMatrixWorld(true)
  root.traverse((o) => {
    if (!o.isMesh) return
    const box = new Box3().setFromObject(o)
    const size = box.getSize(new Vector3())
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    inventory.push({
      name: o.name,
      material: mats.map((m) => m.name).join(','),
      type: mats.map((m) => m.type).join(','),
      transmission: mats.some((m) => m.transmission > 0),
      size: size.toArray().map((v) => +v.toFixed(3)),
      center: box
        .getCenter(new Vector3())
        .toArray()
        .map((v) => +v.toFixed(3)),
    })
  })

  const box = new Box3().setFromObject(root)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())

  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(width, height, false)
  renderer.toneMapping = ACESFilmicToneMapping
  const scene = new Scene()
  scene.background = new Color('#fbfbfb')
  scene.environment = new PMREMGenerator(renderer).fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture
  scene.add(new AmbientLight('#ffffff', 0.6))
  const key = new DirectionalLight('#ffffff', 1.4)
  key.position.set(3, 5, 6)
  scene.add(key)
  scene.add(root)

  const radius = size.length() / 2
  const dist = radius / Math.sin((15 * Math.PI) / 180)
  /* Clip planes scale with the asset: Sketchfab exports range from a few
     centimetres to hundreds of units across. */
  const camera = new PerspectiveCamera(30, width / height, dist / 100, dist * 4)
  const dirs = {
    front: [0, 0, 1],
    back: [0, 0, -1],
    'three-quarter': [0.7, 0.35, 0.7],
    side: [1, 0, 0],
    top: [0, 1, 0.001],
  }
  const images = {}
  for (const view of views) {
    const d = new Vector3(...dirs[view]).normalize()
    camera.position.copy(center).addScaledVector(d, dist)
    camera.lookAt(center)
    renderer.render(scene, camera)
    images[view] = renderer.domElement.toDataURL('image/png')
  }
  renderer.dispose()
  return {
    size: size.toArray().map((v) => +v.toFixed(3)),
    center: center.toArray().map((v) => +v.toFixed(3)),
    inventory,
    images,
  }
}

/** POST a data URL to the scratchpad render sink (localhost:8765). */
export async function save(name, dataUrl) {
  await fetch(`http://127.0.0.1:8765/?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    body: dataUrl,
  })
}

/**
 * Cast rays along +Z from in front of a model (which faces -Z) and report
 * where they hit — used to find the exact depth of a screen surface.
 */
export async function raycastModel(url, points, { fromZ = -10 } = {}) {
  const { Raycaster } = await import('three')
  const gltf = await loader.loadAsync(url)
  gltf.scene.updateMatrixWorld(true)
  const ray = new Raycaster()
  return points.map(([x, y]) => {
    ray.set(new Vector3(x, y, fromZ), new Vector3(0, 0, 1))
    const hit = ray.intersectObject(gltf.scene, true)[0]
    return hit
      ? {
          x,
          y,
          z: +hit.point.z.toFixed(4),
          uv: hit.uv && hit.uv.toArray().map((v) => +v.toFixed(3)),
        }
      : { x, y, z: null }
  })
}

/**
 * Render a model with an extra overlay plane (to check a screen fit) from a
 * given direction, and return a PNG data URL.
 */
export async function renderWithOverlay(
  url,
  overlay,
  { view = 'back', width = 1000, height = 800 } = {},
) {
  const { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide } = await import('three')
  const gltf = await loader.loadAsync(url)
  const plane = new Mesh(
    new PlaneGeometry(overlay.w, overlay.h),
    new MeshBasicMaterial({
      color: overlay.color ?? '#ff00ff',
      side: DoubleSide,
      transparent: true,
      opacity: 0.85,
    }),
  )
  /* The screen faces -Z and leans back by `rx`: tilt a pivot, then turn the
     plane around inside it so its front faces the viewer. */
  const { Group } = await import('three')
  const pivot = new Group()
  pivot.position.set(overlay.x, overlay.y, overlay.z)
  pivot.rotation.x = overlay.rx ?? 0
  plane.rotation.y = Math.PI
  pivot.add(plane)
  gltf.scene.add(pivot)
  const box = new Box3().setFromObject(gltf.scene)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(width, height, false)
  const scene = new Scene()
  scene.background = new Color('#fbfbfb')
  scene.environment = new PMREMGenerator(renderer).fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture
  scene.add(new AmbientLight('#ffffff', 0.6), gltf.scene)
  const radius = size.length() / 2
  const dist = radius / Math.sin((15 * Math.PI) / 180)
  const camera = new PerspectiveCamera(30, width / height, dist / 100, dist * 4)
  const dirs = { back: [0, 0, -1], 'back-quarter': [-0.6, 0.25, -0.75] }
  camera.position
    .copy(center)
    .addScaledVector(new Vector3(...dirs[view]).normalize(), dist)
  camera.lookAt(center)
  renderer.render(scene, camera)
  const url2 = renderer.domElement.toDataURL('image/png')
  renderer.dispose()
  return url2
}

/** A labelled orientation card: TOP band, a red top-left and blue top-right
 *  corner, so a render shows exactly how a screen's UVs are oriented. */
export function orientationCanvas(w = 512, h = 1024) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#0d47c7'
  g.fillRect(0, 0, w, h * 0.12)
  g.fillStyle = '#ffffff'
  g.font = `bold ${Math.round(w * 0.14)}px sans-serif`
  g.textAlign = 'center'
  g.fillText('TOP', w / 2, h * 0.09)
  g.fillStyle = '#e11d48'
  g.fillRect(0, h * 0.12, w * 0.3, w * 0.3)
  g.fillStyle = '#06b6d4'
  g.fillRect(w * 0.7, h * 0.12, w * 0.3, w * 0.3)
  g.fillStyle = '#111111'
  g.fillText('R', w * 0.85, h * 0.12 + w * 0.2)
  return c
}

/** Render a model with one material's map swapped for a canvas. */
export async function renderScreenTest(
  url,
  materialName,
  canvas,
  { dir = [-1, 0, 0], width = 800, height = 900 } = {},
) {
  const { CanvasTexture, SRGBColorSpace } = await import('three')
  const gltf = await loader.loadAsync(url)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.flipY = false
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      if (m.name !== materialName) continue
      /* Carry over the original map's KHR_texture_transform (offset, repeat,
         rotation) and flip, or a replacement lands skewed on atlas UVs. */
      const old = m.map
      if (old) {
        tex.offset.copy(old.offset)
        tex.repeat.copy(old.repeat)
        tex.center.copy(old.center)
        tex.rotation = old.rotation
        tex.flipY = old.flipY
        tex.channel = old.channel
        tex.wrapS = old.wrapS
        tex.wrapT = old.wrapT
        console.info('[probe] original map transform', {
          offset: old.offset.toArray(),
          repeat: old.repeat.toArray(),
          rotation: old.rotation,
          center: old.center.toArray(),
          flipY: old.flipY,
          size: [old.image?.width, old.image?.height],
        })
      }
      m.map = tex
      m.color?.set('#ffffff')
      if (m.emissive) {
        m.emissive.set('#ffffff')
        m.emissiveMap = tex
        m.emissiveIntensity = 1
      }
      m.needsUpdate = true
    }
  })
  const box = new Box3().setFromObject(gltf.scene)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(width, height, false)
  const scene = new Scene()
  scene.background = new Color('#fbfbfb')
  scene.environment = new PMREMGenerator(renderer).fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture
  scene.add(new AmbientLight('#ffffff', 0.6), gltf.scene)
  const radius = size.length() / 2
  const dist = radius / Math.sin((17 * Math.PI) / 180)
  const camera = new PerspectiveCamera(30, width / height, dist / 100, dist * 4)
  camera.position.copy(center).addScaledVector(new Vector3(...dir).normalize(), dist)
  camera.lookAt(center)
  renderer.render(scene, camera)
  const out = renderer.domElement.toDataURL('image/png')
  renderer.dispose()
  return out
}
