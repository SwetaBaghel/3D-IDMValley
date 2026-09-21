import { useFrame } from '@react-three/fiber'
import { use, useRef } from 'react'
import { Box3, Group, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { stage } from '../state/stageStore'

/**
 * About-section laptop.
 *
 * Staged in the shared canvas and pinned to the transparent
 * [data-about-slot] box in About.jsx, the same way the hero scenes and the
 * paper plane work. Keeping it here rather than in a second <Canvas> means
 * one WebGL context for the whole page, and three.js stays inside the lazily
 * loaded Scene chunk instead of the initial bundle.
 *
 * The model and its transforms live at module scope because they are mutated
 * every frame — react-hooks/immutability forbids doing that to hook-owned
 * values.
 */
const laptop = { root: new Group() }

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)

const ready = loader.loadAsync('/models/voxel_web_dev__DiegoG_CC-BY.glb').then((gltf) => {
  const scene = gltf.scene

  /* Transmission renders the scene to a second buffer every frame. Plain
     transparent glass reads the same at this size and costs nothing. */
  scene.traverse((o) => {
    if (!o.isMesh) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(m.transmission > 0)) continue
      m.transmission = 0
      m.transparent = true
      m.opacity = 0.18
      m.depthWrite = false
      m.roughness = Math.min(m.roughness ?? 0.1, 0.08)
    }
  })

  /* Centre on the origin and normalise the LARGEST dimension, so the model
     fits its slot whichever way round it is modelled — normalising width
     alone made a deep model render far larger than the slot. */
  const box = new Box3().setFromObject(scene)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const s = 3.0 / Math.max(size.x, size.y, size.z)
  scene.scale.setScalar(s)
  scene.position.copy(center).multiplyScalar(-s)

  laptop.root.add(scene)
  laptop.root.visible = false
})

export default function AboutLaptop() {
  use(ready)
  const slotRef = useRef(null)

  useFrame((frame) => {
    const root = laptop.root

    let slot = slotRef.current
    if (!slot || !slot.isConnected) {
      slot = document.querySelector('[data-about-slot]')
      slotRef.current = slot
    }
    const rect = slot?.getBoundingClientRect()
    const { size, viewport } = frame
    if (!rect || rect.width === 0 || rect.bottom < 0 || rect.top > size.height) {
      root.visible = false
      return
    }

    const perPx = viewport.width / size.width
    const time = stage.reducedMotion ? 0 : frame.clock.elapsedTime
    root.position.set(
      (rect.left + rect.width / 2 - size.width / 2) * perPx,
      -(rect.top + rect.height / 2 - size.height / 2) * perPx +
        Math.sin(time * 0.7) * 0.05,
      0,
    )
    /* Normalised to 3.0 across; a divisor of 4.4 lands it at ~68% of the
       slot, clear of the statistics card. */
    root.scale.setScalar((Math.min(rect.width, rect.height) * perPx) / 4.4)
    root.rotation.y = Math.sin(time * 0.4) * 0.3
    root.visible = true
  })

  return <primitive object={laptop.root} />
}
