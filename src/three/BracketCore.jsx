import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  IcosahedronGeometry,
  LineBasicMaterial,
  MathUtils,
  MeshPhysicalMaterial,
  Object3D,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { serviceGroups } from '../data/siteContent'
import { stage } from '../state/stageStore'
import {
  NODE_COUNT,
  SERVICE_LAYOUT,
  SERVICE_NODES,
  STAR_LAYOUT,
  createSample,
  sampleTimeline,
} from './bracketSequence'

/* ------------------------------------------------------------------ *
 * Palette — mirrors index.css.
 * ------------------------------------------------------------------ */
const DENIM = new Color('#0D47C7')
const NEON = new Color('#06B6D4')
const SNOW = new Color('#FBFBFB')
const STAR = new Color('#9FB6E8')

/** Clamp a delta so a backgrounded tab does not fire a huge catch-up step. */
const MAX_STEP = 1 / 30

const CORE_RADIUS = 0.3

/* ------------------------------------------------------------------ *
 * The bracket — one `<` chevron, extruded with a deep bevel so every edge
 * catches a highlight. `>` is the same geometry turned half a revolution.
 *
 * Built as a true offset polygon (square-cut arm ends, mitred inner tip)
 * rather than two boxes, so the tip is one continuous surface with no seam.
 * ------------------------------------------------------------------ */
function makeBracketGeometry() {
  const w = 0.62 // tip -> arm end, horizontally
  const h = 0.78 // arm end height above the tip
  const t = 0.2 // arm thickness, measured square to the arm
  const len = Math.hypot(w, h)
  const nx = (t * h) / len
  const ny = (t * w) / len
  const innerTip = (t * len) / h

  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.lineTo(w, h)
  shape.lineTo(w + nx, h - ny)
  shape.lineTo(innerTip, 0)
  shape.lineTo(w + nx, -h + ny)
  shape.lineTo(w, -h)
  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.16,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 6,
  })
  geometry.center()

  /* Vertical gradient baked into vertex colours — neon at the top, denim at
     the bottom — echoing the gradient brackets in the original logo. */
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox
  const position = geometry.getAttribute('position')
  const colors = new Float32Array(position.count * 3)
  const tint = new Color()
  for (let i = 0; i < position.count; i += 1) {
    const f = (position.getY(i) - min.y) / (max.y - min.y)
    tint.lerpColors(DENIM, NEON, f)
    colors[i * 3] = tint.r
    colors[i * 3 + 1] = tint.g
    colors[i * 3 + 2] = tint.b
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

/* ------------------------------------------------------------------ *
 * Module-scope scratch.
 *
 * The emblem is a singleton for the life of the app, and everything below
 * is mutated every frame — so it lives here rather than in useMemo, which
 * is also what keeps react-hooks/immutability satisfied.
 * ------------------------------------------------------------------ */
const sample = createSample()
const dummy = new Object3D()
const nodeTint = new Color()
const lineTint = new Color()

const geometry = {
  bracket: makeBracketGeometry(),
  core: new SphereGeometry(CORE_RADIUS, 64, 48),
  ring: new TorusGeometry(0.44, 0.012, 16, 128),
  node: new IcosahedronGeometry(0.11, 3),
  lines: new BufferGeometry(),
}
geometry.lines.setAttribute(
  'position',
  new BufferAttribute(new Float32Array(NODE_COUNT * 6), 3),
)
geometry.lines.setAttribute(
  'color',
  new BufferAttribute(new Float32Array(NODE_COUNT * 6), 3),
)

/* Glossy, not glowing. Emission is invisible against #fbfbfb; what reads on
   a light page is clearcoat highlights, colour saturation and a soft shadow.
   None of these are transmissive — a transmission pass renders the scene to
   a second buffer every frame and is the one thing that would cost the
   mobile frame budget. */
const materials = {
  bracket: new MeshPhysicalMaterial({
    color: '#ffffff',
    vertexColors: true,
    metalness: 0.1,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    iridescence: 0.25,
    iridescenceIOR: 1.3,
    envMapIntensity: 1.25,
    transparent: true,
  }),
  core: new MeshPhysicalMaterial({
    color: '#F2F6FF',
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    iridescence: 1,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [180, 680],
    envMapIntensity: 1.35,
    transparent: true,
  }),
  ringNeon: new MeshPhysicalMaterial({
    color: NEON,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1,
    transparent: true,
  }),
  ringDenim: new MeshPhysicalMaterial({
    color: DENIM,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1,
    transparent: true,
  }),
  node: new MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0.1,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
    transparent: true,
  }),
  /* Faded lines are mixed toward the page colour rather than made
     transparent: on a light page that reads identically, and it avoids
     per-vertex alpha entirely. */
  lines: new LineBasicMaterial({ vertexColors: true, transparent: true }),
}

/** Base colour per node: the four pillars take their accents, the rest are
 *  soft denim "client" stars. */
const NODE_BASE = Array.from({ length: NODE_COUNT }, (_, i) =>
  i < SERVICE_NODES ? new Color(serviceGroups[i].accent) : STAR,
)
const LINE_FAINT = new Color().lerpColors(DENIM, SNOW, 0.7)

/**
 * The Code Bracket Core — `< • >`.
 *
 * Two glossy chevrons from the IDM Valley logo, an iridescent core with two
 * gyroscope rings, and eleven nodes wired back to the core. All motion is
 * written straight onto transforms, instance matrices and attribute buffers
 * inside useFrame; the component itself never re-renders. The hovered
 * service is read from the hot-path store directly, so even a card hover
 * costs no React work here.
 */
export default function BracketCore() {
  const rootRef = useRef(null)
  const tiltRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const coreRef = useRef(null)
  const ringARef = useRef(null)
  const ringBRef = useRef(null)
  const nodesRef = useRef(null)
  const timelineRef = useRef(0)

  /* instanceColor must exist before the node material first compiles, or
     three builds the shader without it. A layout effect runs at commit,
     ahead of the first frame. */
  useLayoutEffect(() => {
    const nodes = nodesRef.current
    if (!nodes) return
    for (let i = 0; i < NODE_COUNT; i += 1) nodes.setColorAt(i, NODE_BASE[i])
    nodes.instanceColor.needsUpdate = true
  }, [])

  useFrame((state, delta) => {
    const root = rootRef.current
    const tilt = tiltRef.current
    const nodes = nodesRef.current
    if (!root || !tilt || !nodes) return

    const d = delta > MAX_STEP ? MAX_STEP : delta
    const reduced = stage.reducedMotion
    const time = reduced ? 0 : state.clock.elapsedTime

    timelineRef.current = reduced
      ? stage.timeline
      : MathUtils.damp(timelineRef.current, stage.timeline, 5.5, d)
    sampleTimeline(timelineRef.current, sample)

    /* Viewport fitting — same rules as the previous asset: keyframe X is
       authored for a ~9.8-unit desktop stage, and on a phone the emblem pulls
       to centre, shrinks and fades behind the copy. */
    const widthScale = MathUtils.clamp(state.viewport.width / 9.8, 0.4, 1.15)
    const narrow = MathUtils.clamp((6.5 - state.viewport.width) / 3, 0, 1)
    const fade = sample.fade * (1 - narrow * 0.68)

    const bob = Math.sin(time * 0.85) * 0.08 * sample.bob
    const sway = Math.sin(time * 0.4) * sample.spin

    root.position.set(
      sample.px * widthScale * (1 - narrow * 0.8),
      sample.py + bob,
      sample.pz,
    )
    root.scale.setScalar(sample.scale * (1 - narrow * 0.32))
    root.visible = fade > 0.015

    tilt.rotation.set(sample.rx, sample.ry + sway, sample.rz)

    for (const key in materials) materials[key].opacity = fade

    /* ---- Brackets ------------------------------------------------------ */
    const spread = 0.81 + sample.open * 0.78
    const lean = sample.open * 0.18
    const left = leftRef.current
    const right = rightRef.current
    if (left) {
      left.position.x = -spread
      left.rotation.y = -lean + sway * 0.3
    }
    if (right) {
      right.position.x = spread
      right.rotation.y = Math.PI + lean - sway * 0.3
    }

    /* ---- Core + gyroscope rings --------------------------------------- */
    const core = coreRef.current
    if (core) core.rotation.y = time * 0.5
    const ringA = ringARef.current
    if (ringA) {
      ringA.rotation.set(1.1 + Math.sin(time * 0.3) * 0.2, time * 0.9, 0)
    }
    const ringB = ringBRef.current
    if (ringB) {
      ringB.rotation.set(-0.5, -time * 0.6, 0.9 + Math.cos(time * 0.25) * 0.2)
    }

    /* ---- Nodes + wires -------------------------------------------------- */
    const ringAngle = time * 0.35
    const ringRadius = 1.08 * sample.orbit
    const hovered = stage.serviceIndex
    const positions = geometry.lines.getAttribute('position')
    const colors = geometry.lines.getAttribute('color')

    for (let i = 0; i < NODE_COUNT; i += 1) {
      const isService = i < SERVICE_NODES
      const active = isService && i === hovered ? sample.focus : 0

      /* Rest pose: service nodes on a tilted ring; client stars parked in the
         core until the constellation calls for them. */
      let x = 0
      let y = 0
      let z = 0
      if (isService) {
        const a = (i * Math.PI) / 2 + ringAngle
        x = Math.cos(a) * ringRadius
        y = Math.sin(a) * ringRadius * 0.3
        z = Math.sin(a) * ringRadius * 0.6
        const s = SERVICE_LAYOUT[i]
        x = MathUtils.lerp(x, s[0] - active * 0.25, sample.focus)
        y = MathUtils.lerp(y, s[1], sample.focus)
        z = MathUtils.lerp(z, s[2] + active * 0.45, sample.focus)
      }
      const star = STAR_LAYOUT[i]
      x = MathUtils.lerp(x, star[0], sample.stars)
      y = MathUtils.lerp(y, star[1], sample.stars)
      z = MathUtils.lerp(z, star[2], sample.stars)

      const visible = isService ? sample.nodes : sample.nodes * sample.stars
      const scale = visible * (isService ? 1 + active * 0.55 : 0.7)

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, time * 0.6 + i, 0)
      dummy.scale.setScalar(Math.max(scale, 0.0001))
      dummy.updateMatrix()
      nodes.setMatrixAt(i, dummy.matrix)

      nodeTint.lerpColors(NODE_BASE[i], NEON, active * 0.35)
      nodes.setColorAt(i, nodeTint)

      /* Wire from the core's surface out to the node. */
      const dist = Math.hypot(x, y, z)
      const k = dist > CORE_RADIUS ? CORE_RADIUS / dist : 1
      positions.setXYZ(i * 2, x * k, y * k, z * k)
      positions.setXYZ(i * 2 + 1, x, y, z)

      lineTint.lerpColors(SNOW, LINE_FAINT, Math.min(1, visible))
      lineTint.lerp(NEON, active)
      colors.setXYZ(i * 2, lineTint.r, lineTint.g, lineTint.b)
      colors.setXYZ(i * 2 + 1, lineTint.r, lineTint.g, lineTint.b)
    }

    nodes.instanceMatrix.needsUpdate = true
    nodes.instanceColor.needsUpdate = true
    positions.needsUpdate = true
    colors.needsUpdate = true
  })

  return (
    <group ref={rootRef} dispose={null}>
      <group ref={tiltRef}>
        <mesh ref={leftRef} geometry={geometry.bracket} material={materials.bracket} />
        <mesh ref={rightRef} geometry={geometry.bracket} material={materials.bracket} />

        <mesh ref={coreRef} geometry={geometry.core} material={materials.core} />
        <mesh ref={ringARef} geometry={geometry.ring} material={materials.ringNeon} />
        <mesh
          ref={ringBRef}
          geometry={geometry.ring}
          material={materials.ringDenim}
          scale={1.18}
        />

        <lineSegments
          geometry={geometry.lines}
          material={materials.lines}
          frustumCulled={false}
        />
        <instancedMesh
          ref={nodesRef}
          args={[geometry.node, materials.node, NODE_COUNT]}
          frustumCulled={false}
        />
      </group>
    </group>
  )
}
