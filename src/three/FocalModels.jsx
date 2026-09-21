import { Edges, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useSyncExternalStore } from 'react'
import {
  Color,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from 'three'
import { serviceGroups } from '../data/siteContent'
import {
  getStageServerSnapshot,
  getStageSnapshot,
  stage,
  subscribeStage,
} from '../state/stageStore'
import { NODE_ANCHORS, NODE_COUNT, createSample, sampleTimeline } from './sequence'

/* ------------------------------------------------------------------ *
 * Palette — mirrors the CSS tokens in index.css so the canvas and the
 * document cannot drift apart.
 * ------------------------------------------------------------------ */
const DENIM = '#0D47C7'
const NEON = '#22D3EE'
const STEEL = '#2B3A52'
const EDGE = '#3C4A5E'

/** Screen face, in local units. The bezel is drawn slightly larger. */
const SCREEN_W = 2.28
const SCREEN_H = 1.42
/**
 * Local Z stack, front to back. These must stay ordered or the display sinks
 * into the chassis and the steel front face becomes the "screen":
 *   chassis   depth 0.07, so its front face is at +0.035
 *   display   0.042
 *   UI cells  FACE_Z 0.048
 *   glass     0.062
 */
const CHASSIS_D = 0.07
/** Per-cell Z separation that keeps stacked UI planes out of each other. */
const CELL_STEP = 0.0006
const DISPLAY_Z = 0.042
const FACE_Z = 0.048
const GLASS_Z = 0.062

/** Clamp a delta so a backgrounded tab does not fire a huge catch-up step. */
const MAX_STEP = 1 / 30

/* ------------------------------------------------------------------ *
 * Application UI, described as data.
 *
 * These are unlit planes, not shaded geometry: they are meant to read as
 * emitted screen pixels, so MeshBasicMaterial with toneMapped off keeps the
 * denim and cyan at their exact brand values regardless of the studio rig.
 * `tone` indexes into the shared tone materials. Cells are listed strictly
 * back-to-front: each one is drawn a hair in front of the last (see
 * CELL_STEP), because coplanar planes z-fight and the chart bars would
 * flicker against their own backing plate.
 * ------------------------------------------------------------------ */
const APP_UI = [
  // Title bar + window controls
  { x: 0, y: 0.58, w: 2.06, h: 0.14, tone: 'denim' },
  { x: -0.94, y: 0.58, w: 0.05, h: 0.05, tone: 'screen' },
  { x: -0.85, y: 0.58, w: 0.05, h: 0.05, tone: 'screen' },
  // Sidebar
  { x: -0.81, y: -0.11, w: 0.42, h: 1.0, tone: 'panel' },
  { x: -0.86, y: 0.25, w: 0.26, h: 0.045, tone: 'denim' },
  { x: -0.88, y: 0.14, w: 0.22, h: 0.035, tone: 'faint' },
  { x: -0.88, y: 0.05, w: 0.22, h: 0.035, tone: 'faint' },
  { x: -0.89, y: -0.04, w: 0.2, h: 0.035, tone: 'faint' },
  // Stat cards
  { x: -0.15, y: 0.3, w: 0.62, h: 0.3, tone: 'panel' },
  { x: -0.3, y: 0.36, w: 0.24, h: 0.05, tone: 'denim' },
  { x: -0.33, y: 0.25, w: 0.18, h: 0.035, tone: 'faint' },
  { x: 0.58, y: 0.3, w: 0.62, h: 0.3, tone: 'panel' },
  { x: 0.43, y: 0.36, w: 0.24, h: 0.05, tone: 'neon' },
  { x: 0.4, y: 0.25, w: 0.18, h: 0.035, tone: 'faint' },
  // Chart plate + bars
  { x: 0.22, y: -0.33, w: 1.34, h: 0.52, tone: 'panel' },
  { x: -0.28, y: -0.44, w: 0.1, h: 0.16, tone: 'denim' },
  { x: -0.12, y: -0.4, w: 0.1, h: 0.24, tone: 'denim' },
  { x: 0.04, y: -0.35, w: 0.1, h: 0.34, tone: 'neon' },
  { x: 0.2, y: -0.42, w: 0.1, h: 0.2, tone: 'denim' },
  { x: 0.36, y: -0.37, w: 0.1, h: 0.3, tone: 'neon' },
  { x: 0.52, y: -0.45, w: 0.1, h: 0.14, tone: 'denim' },
]

/* Grid schematic shown in the Portfolio / Pricing terminal pose. */
const GRID_UI = [{ x: 0, y: 0.58, w: 2.06, h: 0.1, tone: 'denim' }]
for (let row = 0; row < 3; row += 1) {
  for (let col = 0; col < 4; col += 1) {
    GRID_UI.push({
      x: -0.78 + col * 0.52,
      y: 0.26 - row * 0.38,
      w: 0.46,
      h: 0.3,
      tone: (row * 4 + col) % 5 === 0 ? 'neon' : 'panel',
    })
  }
}

/* ------------------------------------------------------------------ *
 * Module-scope scratch.
 *
 * FocalModels is a singleton stage asset — there is exactly one device for
 * the life of the app — so its materials and per-frame sample live here
 * rather than in useMemo. That is also what keeps the strict
 * react-hooks/immutability rule satisfied: a value handed to a hook must not
 * be mutated afterwards, and these are mutated every frame by design.
 * ------------------------------------------------------------------ */
const sample = createSample()

const screenTone = (color) =>
  new MeshBasicMaterial({ color, transparent: true, toneMapped: false })

function makeUiTones() {
  return {
    denim: screenTone(DENIM),
    neon: screenTone(NEON),
    panel: screenTone('#DCE6FA'),
    faint: screenTone('#B4C4E4'),
    screen: screenTone('#FFFFFF'),
  }
}

const materials = {
  /* Deep steel chassis. */
  steel: new MeshStandardMaterial({
    color: STEEL,
    metalness: 0.82,
    roughness: 0.34,
    envMapIntensity: 1.1,
    transparent: true,
  }),
  /* Glass cover. Physical, but deliberately NOT transmissive: a transmission
     pass renders the scene to a second buffer every frame, which is the one
     thing that would actually threaten the mobile frame budget. Clearcoat
     plus low roughness reads as glass on a light ground for free. */
  glass: new MeshPhysicalMaterial({
    color: '#EAF1FF',
    metalness: 0.0,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    ior: 1.45,
    reflectivity: 0.6,
    transparent: true,
    opacity: 0.34,
  }),
  display: new MeshBasicMaterial({
    color: '#F7FAFF',
    transparent: true,
    toneMapped: false,
  }),
  app: makeUiTones(),
  grid: makeUiTones(),
  /* One emissive per pillar, colour-coded from siteContent. */
  nodes: serviceGroups.map(
    (group) =>
      new MeshStandardMaterial({
        color: group.accent,
        emissive: group.accent,
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.25,
        transparent: true,
      }),
  ),
  wires: serviceGroups.map(
    (group) =>
      new MeshBasicMaterial({
        color: group.accent,
        transparent: true,
        toneMapped: false,
      }),
  ),
}

/* Node emissive lerps toward neon cyan as it lifts, so a raised node reads
   as energised rather than merely translated. */
const NODE_BASE = serviceGroups.map((group) => new Color(group.accent))
const NODE_HOT = new Color(NEON)

/**
 * The 3D App Screen Matrix.
 *
 * A single device — deep-steel chassis, glass cover, emitted UI — sequenced
 * across all seven sections by `sequence.js`. Every per-frame value is
 * written straight onto object3D transforms and shared materials; React
 * never re-renders on scroll. The only re-render trigger is the discrete
 * stage snapshot (section / hovered pillar).
 */
export default function FocalModels() {
  const snap = useSyncExternalStore(
    subscribeStage,
    getStageSnapshot,
    getStageServerSnapshot,
  )

  const rootRef = useRef(null)
  const tiltRef = useRef(null)
  const appRef = useRef(null)
  const gridRef = useRef(null)
  const nodeRefs = useRef([])
  const wireRefs = useRef([])
  const bezelEdgeRef = useRef(null)
  const timelineRef = useRef(0)

  /* Stable per-node callback refs — created once, so React never detaches
     and re-attaches the meshes between renders. */
  const setNodeRef = useMemo(
    () =>
      serviceGroups.map((_, i) => (el) => {
        nodeRefs.current[i] = el
      }),
    [],
  )
  const setWireRef = useMemo(
    () =>
      serviceGroups.map((_, i) => (el) => {
        wireRefs.current[i] = el
      }),
    [],
  )

  useFrame((state, delta) => {
    const root = rootRef.current
    const tilt = tiltRef.current
    if (!root || !tilt) return

    const d = delta > MAX_STEP ? MAX_STEP : delta
    const reduced = stage.reducedMotion
    const time = state.clock.elapsedTime

    /* Damp the timeline itself rather than every derived property: one
       filter, and every downstream value inherits the same smoothing. */
    timelineRef.current = reduced
      ? stage.timeline
      : MathUtils.damp(timelineRef.current, stage.timeline, 5.5, d)
    const tl = timelineRef.current
    sampleTimeline(tl, sample)

    /* Keep the device inside the frame on narrow viewports: the keyframe X is
       authored against a ~9.8 world-unit wide desktop stage. */
    const widthScale = MathUtils.clamp(state.viewport.width / 9.8, 0.4, 1.15)

    /* 0 on desktop, 1 on a phone. Below roughly tablet width there is no
       "right third" to place the device in, so it pulls back to centre,
       shrinks and drops opacity to sit behind the copy rather than beside it. */
    const narrow = MathUtils.clamp((6.5 - state.viewport.width) / 3, 0, 1)
    const fade = sample.fade * (1 - narrow * 0.68)

    const bob = reduced ? 0 : Math.sin(time * 0.85) * 0.08 * sample.bob
    const sway = reduced ? 0 : Math.sin(time * 0.53) * 0.028 * sample.bob

    root.position.set(
      sample.px * widthScale * (1 - narrow * 0.8),
      sample.py + bob,
      sample.pz,
    )
    root.scale.setScalar(sample.scale * (1 - narrow * 0.32))
    root.visible = fade > 0.015

    tilt.rotation.x = sample.rx + sway * 0.4
    /* `spin` is a sway AMPLITUDE, not a rate. Integrating it against absolute
       elapsed time (as an abstract hub could) would slowly tumble the device
       away from the camera and leave the visitor looking at the back of a
       screen — so it oscillates around the keyframed heading instead. */
    tilt.rotation.y = sample.ry + (reduced ? 0 : Math.sin(time * 0.4) * sample.spin * 2)
    tilt.rotation.z = sample.rz + sway

    /* How strongly the Services pose is in effect, 0 -> 1. Gates the node
       response so a card hover only moves nodes while Services is on screen. */
    const servicesWeight = MathUtils.clamp(1 - Math.abs(tl - 2), 0, 1)
    const terminal = sample.terminal

    materials.steel.opacity = fade
    materials.glass.opacity = fade * 0.34
    materials.display.opacity = fade

    /* Cross-fade the two display states on shared materials — one opacity
       write per tone rather than per mesh. */
    const appAlpha = fade * (1 - terminal)
    const gridAlpha = fade * terminal
    for (const key in materials.app) materials.app[key].opacity = appAlpha
    for (const key in materials.grid) materials.grid[key].opacity = gridAlpha

    const app = appRef.current
    if (app) app.visible = appAlpha > 0.02
    const grid = gridRef.current
    if (grid) grid.visible = gridAlpha > 0.02

    if (bezelEdgeRef.current) bezelEdgeRef.current.material.opacity = fade

    for (let i = 0; i < NODE_COUNT; i += 1) {
      const node = nodeRefs.current[i]
      const wire = wireRefs.current[i]
      if (!node) continue

      /* Base lift for every node while Services is up, plus a much larger
         lift for the pillar the visitor is actually pointing at. */
      const selected = i === snap.serviceIndex ? servicesWeight : 0
      const base = sample.lift * 0.16
      const height = base + servicesWeight * selected * 0.38

      node.position.set(NODE_ANCHORS[i], 0.1 + selected * 0.06, FACE_Z + 0.03 + height)
      node.rotation.z = reduced ? 0 : Math.sin(time * 0.7 + i * 1.4) * 0.12 * sample.lift
      node.scale.setScalar(0.85 + selected * 0.4)
      node.visible = fade > 0.02

      const material = materials.nodes[i]
      material.opacity = fade
      material.emissiveIntensity = 0.3 + selected * 0.75
      material.color.lerpColors(NODE_BASE[i], NODE_HOT, selected * 0.3)

      /* The code wire is a unit-length bar scaled to span screen -> node, so
         it tracks the lift without any geometry rebuild. */
      if (wire) {
        wire.scale.set(1, 1, Math.max(0.001, height + 0.03))
        wire.position.set(NODE_ANCHORS[i], 0.1, FACE_Z + (height + 0.03) / 2)
        wire.visible = height > 0.02 && fade > 0.02
        materials.wires[i].opacity = fade * MathUtils.clamp(height * 3, 0, 0.8)
      }
    }
  })

  return (
    <group ref={rootRef} dispose={null}>
      <group ref={tiltRef}>
        {/* ---- Deep steel chassis ------------------------------------- */}
        <RoundedBox
          args={[SCREEN_W + 0.1, SCREEN_H + 0.1, CHASSIS_D]}
          radius={0.04}
          smoothness={4}
          material={materials.steel}
        >
          <Edges ref={bezelEdgeRef} threshold={30} color={EDGE} />
        </RoundedBox>

        {/* ---- Display surface ---------------------------------------- */}
        <mesh position={[0, 0, DISPLAY_Z]} material={materials.display}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        </mesh>

        {/* ---- Application UI ----------------------------------------- */}
        <group ref={appRef}>
          {APP_UI.map((cell, i) => (
            <mesh
              key={`app${i}`}
              position={[cell.x, cell.y, FACE_Z + i * CELL_STEP]}
              material={materials.app[cell.tone]}
            >
              <planeGeometry args={[cell.w, cell.h]} />
            </mesh>
          ))}
        </group>

        {/* ---- Grid schematic (Portfolio / Pricing terminal) ----------- */}
        <group ref={gridRef}>
          {GRID_UI.map((cell, i) => (
            <mesh
              key={`grid${i}`}
              position={[cell.x, cell.y, FACE_Z + i * CELL_STEP]}
              material={materials.grid[cell.tone]}
            >
              <planeGeometry args={[cell.w, cell.h]} />
            </mesh>
          ))}
        </group>

        {/* ---- Glass cover -------------------------------------------- */}
        <RoundedBox
          args={[SCREEN_W, SCREEN_H, 0.02]}
          radius={0.02}
          smoothness={3}
          position={[0, 0, GLASS_Z]}
          material={materials.glass}
        />

        {/* ---- Holographic data nodes + code wires -------------------- */}
        {serviceGroups.map((group, i) => (
          <group key={group.id}>
            <mesh ref={setWireRef[i]} material={materials.wires[i]}>
              <boxGeometry args={[0.014, 0.014, 1]} />
            </mesh>
            <RoundedBox
              ref={setNodeRef[i]}
              args={[0.24, 0.24, 0.06]}
              radius={0.025}
              smoothness={3}
              material={materials.nodes[i]}
            />
          </group>
        ))}
      </group>
    </group>
  )
}
