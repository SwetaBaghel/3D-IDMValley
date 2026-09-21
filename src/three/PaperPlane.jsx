import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  LineBasicMaterial,
  LineDashedMaterial,
  MathUtils,
  MeshPhysicalMaterial,
} from 'three'
import { stage } from '../state/stageStore'

/* ------------------------------------------------------------------ *
 * Plane colourways. Switch PLANE_THEME to try another.
 *
 * `valley` is the default: the orange of "VALLEY" in the original logo. It
 * is the complement of the site's denim, so it is the one colour guaranteed
 * to stand off a white-and-blue page — and it matches the amber-orange
 * uplink bar that runs while the form submits, so plane and progress read as
 * one "transmission" colour.
 * ------------------------------------------------------------------ */
const PLANE_THEMES = {
  valley: { wing: '#FF8A3D', keel: '#E4572E', edge: '#B8431F', trail: '#F97316' },
  denim: { wing: '#2F6BF0', keel: '#0D47C7', edge: '#072F8A', trail: '#0D47C7' },
  neon: { wing: '#22D3EE', keel: '#0891B2', edge: '#0E7490', trail: '#06B6D4' },
}
const PLANE_THEME = 'valley'
const THEME = PLANE_THEMES[PLANE_THEME]

/** Contact is at section index 4 (Home, About, Services, Pricing, Contact, Portfolio). */
const CONTACT_INDEX = 4
const FLIGHT_SECONDS = 1.3
const FLY_IN_SECONDS = 0.8
const SHAKE_SECONDS = 0.6
/** Matches UPLINK_MS in Contact.jsx — the "charging" pose fills this window. */
const UPLINK_SECONDS = 2

/* ------------------------------------------------------------------ *
 * Geometry — a classic dart, nose along +X, length 2.
 *
 *   two wings with a slight dihedral, and a keel folded down the centre.
 * Non-indexed, so computeVertexNormals gives crisp flat facets like folded
 * paper. Wings and keel take two shades of the theme via vertex colours, so
 * the centre fold reads even before the light does.
 * ------------------------------------------------------------------ */
const NOSE = [1.05, 0, 0]
const TAIL = [-1, 0.04, 0]
const WING_L = [-1, 0.16, 0.72]
const WING_R = [-1, 0.16, -0.72]
const KEEL_L = [-0.9, -0.32, 0.03]
const KEEL_R = [-0.9, -0.32, -0.03]

const FACES = [
  { tri: [NOSE, TAIL, WING_L], color: THEME.wing },
  { tri: [NOSE, WING_R, TAIL], color: THEME.wing },
  { tri: [NOSE, KEEL_L, TAIL], color: THEME.keel },
  { tri: [NOSE, TAIL, KEEL_R], color: THEME.keel },
]

function makePlaneGeometry() {
  const positions = []
  const colors = []
  const tint = new Color()
  for (const face of FACES) {
    tint.set(face.color)
    for (const vertex of face.tri) {
      positions.push(...vertex)
      colors.push(tint.r, tint.g, tint.b)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geometry.computeVertexNormals()
  return geometry
}

/* ------------------------------------------------------------------ *
 * Flight path, in the anchor's local units (the plane is 2 long).
 *
 * A small dip, then a steep climb out of the top of the viewport. The climb
 * is deliberately steep and only drifts a little right: the plane is drawn
 * BEHIND the page, so a flatter path would pass behind the contact form.
 * ------------------------------------------------------------------ */
const PATH_SAMPLES = 90
function pathAt(u, out) {
  out[0] = 1.6 * u + 1.2 * u * u
  out[1] = 12 * u * u - 3 * u
  out[2] = 1.2 * u
  return out
}

function makeTrailGeometry() {
  const positions = new Float32Array(PATH_SAMPLES * 3)
  const distances = new Float32Array(PATH_SAMPLES)
  const point = [0, 0, 0]
  let travelled = 0
  for (let i = 0; i < PATH_SAMPLES; i += 1) {
    pathAt(i / (PATH_SAMPLES - 1), point)
    if (i > 0) {
      travelled += Math.hypot(
        point[0] - positions[i * 3 - 3],
        point[1] - positions[i * 3 - 2],
        point[2] - positions[i * 3 - 1],
      )
    }
    positions.set(point, i * 3)
    distances[i] = travelled
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  /* LineDashedMaterial reads this; computed here once rather than calling
     Line.computeLineDistances() on a live object. */
  geometry.setAttribute('lineDistance', new BufferAttribute(distances, 1))
  return geometry
}

/* ------------------------------------------------------------------ *
 * Module-scope scratch — singleton, mutated every frame.
 * ------------------------------------------------------------------ */
const planeGeometry = makePlaneGeometry()
const outlineGeometry = new EdgesGeometry(planeGeometry, 1)
const trailGeometry = makeTrailGeometry()

/* Glossy card stock rather than matte paper: the same clearcoat language as
   the bracket emblem, so the two read as one family. */
const materials = {
  paper: new MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    side: DoubleSide,
    transparent: true,
  }),
  /* A darker shade of the theme, so folds stay crisp at small sizes. */
  outline: new LineBasicMaterial({ color: THEME.edge, transparent: true }),
  trail: new LineDashedMaterial({
    color: THEME.trail,
    dashSize: 0.22,
    gapSize: 0.16,
    transparent: true,
  }),
}

const here = [0, 0, 0]
const ahead = [0, 0, 0]
const easeOut = (t) => 1 - (1 - t) ** 3
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Paper plane for the Contact section.
 *
 * Lives in the shared WebGL canvas and pins itself to the transparent
 * [data-plane-slot] box in Contact.jsx by projecting that box's screen rect
 * into world space every frame, so the DOM owns the layout at every
 * breakpoint. Behaviour follows `stage.contactStatus`, written by the form:
 *
 *   idle        hovers in the slot
 *   invalid     a short "no" wobble
 *   submitting  pulls back and nose-up, dashed flight path fades in
 *   sent        swoops up and out of the viewport, drawing its trail
 *   sent->idle  (a new quote request) flies back in from the left
 *
 * Nothing here causes a React render.
 */
export default function PaperPlane() {
  const anchorRef = useRef(null)
  const planeRef = useRef(null)
  const trailRef = useRef(null)
  const slotRef = useRef(null)
  const phaseRef = useRef({ status: 'idle', since: 0, previous: 'idle' })

  useFrame((state) => {
    const anchor = anchorRef.current
    const plane = planeRef.current
    const trail = trailRef.current
    if (!anchor || !plane || !trail) return

    const time = state.clock.elapsedTime
    const reduced = stage.reducedMotion

    /* ---- Arrive with the Contact section ----------------------------- */
    const appear = MathUtils.clamp((stage.timeline - (CONTACT_INDEX - 0.65)) / 0.5, 0, 1)
    if (appear <= 0) {
      anchor.visible = false
      return
    }

    /* ---- Pin to the DOM slot ----------------------------------------- */
    let slot = slotRef.current
    if (!slot || !slot.isConnected) {
      slot = document.querySelector('[data-plane-slot]')
      slotRef.current = slot
    }
    const rect = slot?.getBoundingClientRect()
    if (!rect || rect.width === 0) {
      anchor.visible = false
      return
    }
    const { size, viewport } = state
    const perPx = viewport.width / size.width
    anchor.position.set(
      (rect.left + rect.width / 2 - size.width / 2) * perPx,
      -(rect.top + rect.height / 2 - size.height / 2) * perPx,
      0,
    )
    anchor.scale.setScalar(rect.width * perPx * 0.26)
    anchor.visible = true

    /* ---- Status transitions ------------------------------------------ */
    const phase = phaseRef.current
    if (stage.contactStatus !== phase.status) {
      phase.previous = phase.status
      phase.status = stage.contactStatus
      phase.since = time
    }
    const age = time - phase.since

    /* Resting pose: a three-quarter view, nose up and to the right. */
    let x = 0
    let y = reduced ? 0 : Math.sin(time * 1.6) * 0.08
    let z = 0
    let rx = 0.28 + (reduced ? 0 : Math.sin(time * 1.1) * 0.06)
    let ry = -0.55
    let rz = 0.32
    let opacity = appear
    let trailOpacity = 0
    let trailCount = 0

    if (phase.status === 'invalid' && age < SHAKE_SECONDS && !reduced) {
      ry += Math.sin(age * 40) * 0.18 * (1 - age / SHAKE_SECONDS)
    } else if (phase.status === 'submitting') {
      const k = reduced ? 1 : easeInOut(Math.min(age / UPLINK_SECONDS, 1))
      x -= 0.35 * k
      y += 0.1 * k
      rz += 0.25 * k
      if (!reduced) rx += Math.sin(time * 38) * 0.02 * k
      trailOpacity = 0.35 * k
      trailCount = PATH_SAMPLES
    } else if (phase.status === 'sent') {
      const u = reduced ? 2 : age / FLIGHT_SECONDS
      if (u >= 1.05) {
        opacity = 0
        trailOpacity = Math.max(0, 0.55 - (u - 1.05) * 1.5)
        trailCount = PATH_SAMPLES
      } else {
        pathAt(u, here)
        pathAt(u + 0.01, ahead)
        const tx = ahead[0] - here[0]
        const ty = ahead[1] - here[1]
        const tz = ahead[2] - here[2]
        /* Ease out of the resting attitude into the tangent of the path. */
        const blend = Math.min(u * 4, 1)
        x = here[0] - 0.35 * (1 - blend)
        y = here[1] + 0.1 * (1 - blend)
        z = here[2]
        rz = MathUtils.lerp(rz + 0.25, Math.atan2(ty, tx), blend)
        ry = MathUtils.lerp(ry, -Math.atan2(tz, Math.hypot(tx, ty)), blend)
        rx = 0.28 + Math.sin(u * 9) * 0.25
        trailOpacity = 0.55
        trailCount = Math.max(2, Math.round(u * PATH_SAMPLES))
      }
    } else if (phase.previous === 'sent' && age < FLY_IN_SECONDS && !reduced) {
      /* Back in for the next request, from off the left. */
      const k = easeOut(age / FLY_IN_SECONDS)
      x = MathUtils.lerp(-7, x, k)
      y = MathUtils.lerp(2.5, y, k)
    }

    plane.position.set(x, y, z)
    plane.rotation.set(rx, ry, rz)
    plane.visible = opacity > 0.01
    materials.paper.opacity = opacity
    materials.outline.opacity = opacity

    trail.visible = trailOpacity > 0.01 && trailCount > 1
    trailGeometry.setDrawRange(0, trailCount)
    materials.trail.opacity = trailOpacity * appear
  })

  return (
    <group ref={anchorRef} visible={false}>
      <line ref={trailRef} geometry={trailGeometry} material={materials.trail} />
      <group ref={planeRef}>
        <mesh geometry={planeGeometry} material={materials.paper} />
        <lineSegments geometry={outlineGeometry} material={materials.outline} />
      </group>
    </group>
  )
}
