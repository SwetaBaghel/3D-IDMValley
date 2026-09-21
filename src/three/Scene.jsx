import {
  AdaptiveDpr,
  Environment,
  Lightformer,
  PerformanceMonitor,
  Preload,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, LensFlare, SMAA } from '@react-three/postprocessing'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CanvasTexture,
  Color,
  MathUtils,
  NeutralToneMapping,
  SRGBColorSpace,
  Vector3,
} from 'three'
import * as stageStore from '../state/stageStore'
import { stage } from '../state/stageStore'
import BracketCore from './BracketCore'
import * as bracketSequence from './bracketSequence'
import FocalModels from './FocalModels'
import HeroScenes from './HeroScenes'
import PaperPlane from './PaperPlane'
import * as screenSequence from './sequence'

/**
 * Selectable stage assets. Each brings its own timeline; the shadow and the
 * flare sample whichever one is live, so they always track the right model.
 * `bracket` is the current production asset. `screen` is available as an alternative.
 * `Extras` are supporting assets staged alongside the main model; each is
 * wrapped in its own Suspense so a loading GLB never blanks the canvas.
 */
const MODELS = {
  screen: { Model: FocalModels, sampleTimeline: screenSequence.sampleTimeline },
  bracket: {
    Model: BracketCore,
    Extras: [HeroScenes, PaperPlane],
    sampleTimeline: bracketSequence.sampleTimeline,
  },
}

/** Fixed world anchor for the studio flare. */
const LENS_POSITION = new Vector3(-2.6, 2.4, -3.2)

/* Flare tint. Neutral cool-white at rest; pulls toward cyan across the
   Services window so the reflection picks up the same hue as the active
   slab's edge lines and the Services card hover state. Module scope, and
   mutated in useFrame — see the note in FocalModels. */
const FLARE_BASE = new Color('#cddcff')
const FLARE_ACTIVE = new Color('#93e9f7')
const flareGain = new Color().copy(FLARE_BASE)

/* Per-frame timeline scratch, one per consumer. Plain bags: the sampler
   writes every field of whichever timeline is live into them. */
const shadowSample = {}
const flareSample = {}

/**
 * DEV ONLY: exposes the live renderer and the app's own store instance on
 * `window.__stage3d`, so frames can be advanced and captured from the console
 * even when the preview pane is hidden (a hidden tab runs no rAF). The whole
 * body is dead code in production and is stripped by the bundler.
 */
function DevHandle() {
  const { gl, scene, camera, advance } = useThree()
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    window.__stage3d = { gl, scene, camera, advance, store: stageStore }
    return () => {
      delete window.__stage3d
    }
  }, [gl, scene, camera, advance])
  return null
}

/**
 * Soft ambient drop shadow.
 *
 * A radial-gradient sprite rather than drei's ContactShadows: the shadow is
 * the only thing that needs to move when a service card is selected, and a
 * textured plane costs one draw call instead of a render-to-texture pass
 * every frame — which matters against the 120 FPS budget.
 */
function AmbientDropShadow({ sampleTimeline }) {
  const meshRef = useRef(null)

  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    /* Tinted toward denim rather than neutral black: a pure grey pool under
       a blue-lit device reads as dirt on a snow-white page. */
    gradient.addColorStop(0, 'rgba(13,30,72,0.5)')
    gradient.addColorStop(0.45, 'rgba(13,40,110,0.18)')
    gradient.addColorStop(1, 'rgba(13,71,199,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const d = delta > 1 / 30 ? 1 / 30 : delta
    sampleTimeline(stage.timeline, shadowSample)

    const widthScale = MathUtils.clamp(state.viewport.width / 9.8, 0.4, 1.15)
    /* The selected card slides the pool sideways, so the "light" reads as
       following the active status layer. */
    const bias = (stage.serviceIndex - 1.5) * 0.22 * (shadowSample.lift ?? 0)

    mesh.position.x = MathUtils.damp(
      mesh.position.x,
      shadowSample.px * widthScale + bias,
      4,
      d,
    )
    mesh.position.y = -1.55
    mesh.position.z = shadowSample.pz - 0.1
    mesh.scale.setScalar(
      MathUtils.lerp(2.8, 3.8, shadowSample.terminal ?? 0) * shadowSample.scale,
    )
    mesh.material.opacity = shadowSample.shadow
    mesh.visible = shadowSample.shadow > 0.01
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Studio Lens Reflection pass.
 *
 * Bloom is deliberately absent: on a #fbfbfb ground a luminance bloom just
 * hazes the whole frame. A flare keyed to a fixed studio light gives the
 * specular event without lifting the black point.
 */
function StudioFlare({ quality, sampleTimeline }) {
  const flareRef = useRef(null)

  useFrame(() => {
    const flare = flareRef.current
    if (!flare) return
    sampleTimeline(stage.timeline, flareSample)
    flare.opacity = flareSample.flare * 0.32

    /* Same 0 -> 1 Services weight FocalModels uses, so the flare tint and the
       slab edge tint rise and fall together. */
    const servicesWeight = MathUtils.clamp(1 - Math.abs(stage.timeline - 2), 0, 1)
    flareGain.lerpColors(FLARE_BASE, FLARE_ACTIVE, servicesWeight)
    flare.colorGain = flareGain
  })

  return (
    <EffectComposer multisampling={0} enableNormalPass={false} stencilBuffer={false}>
      <LensFlare
        ref={flareRef}
        lensPosition={LENS_POSITION}
        colorGain={flareGain}
        glareSize={0.24}
        flareSize={0.0035}
        flareSpeed={0.28}
        flareShape={0.08}
        haloScale={3.6}
        ghostScale={0.06}
        starPoints={6}
        opacity={0.2}
        animated={quality === 'high'}
        anamorphic={false}
        secondaryGhosts
        aditionalStreaks={false}
        starBurst={false}
      />
      <SMAA />
    </EffectComposer>
  )
}

/** Neutral studio rig: broad fill plus two soft key cards for the satin sheen. */
function StudioRig() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3, 4, 5]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[4, -1, -3]} intensity={0.35} color="#dce6f8" />
      {/* A full white surround, not a few cards: on a snow ground the metal
          must resolve to light grey from every angle, so the environment is
          effectively a lightbox with softbox highlights layered on top. */}
      {/* A gradient surround, not a uniform white box: bright softbox above,
          mid-grey cards to the sides and below. Uniform white would light
          every face identically and the asset would vanish into the page. */}
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#ffffff"
          position={[0, 7, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[16, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.55}
          color="#98a2b3"
          position={[0, -7, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[16, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.9}
          color="#ffffff"
          position={[-6, 2.5, 4]}
          rotation={[0, Math.PI / 5, 0]}
          scale={[6, 9, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#aeb8c8"
          position={[6, 0.5, 3]}
          rotation={[0, -Math.PI / 5, 0]}
          scale={[5, 9, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.4}
          color="#8f99a9"
          position={[0, 0, -9]}
          scale={[18, 12, 1]}
        />
      </Environment>
    </>
  )
}

/**
 * Fixed full-viewport stage behind the document. Pointer events are off so
 * the canvas never intercepts scroll or text selection.
 */
export default function Scene({ model = 'screen' }) {
  const { Model, Extras, sampleTimeline } = MODELS[model] ?? MODELS.screen
  const [quality, setQuality] = useState('high')

  const handleDecline = useCallback(() => setQuality('low'), [])
  const handleIncline = useCallback(() => setQuality('high'), [])

  return (
    <div aria-hidden="true" className="gpu-layer pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={quality === 'high' ? [1, 2] : 1}
        camera={{ fov: 34, position: [0, 0, 9], near: 0.1, far: 60 }}
        gl={{
          /* Transparent so the CSS grid matrix beneath stays visible — the
             canvas contributes the asset and its shadow, nothing else. */
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: NeutralToneMapping,
        }}
      >
        <StudioRig />
        <Model />
        {(Extras ?? []).map((Extra) => (
          <Suspense key={Extra.name} fallback={null}>
            <Extra />
          </Suspense>
        ))}
        <AmbientDropShadow sampleTimeline={sampleTimeline} />
        <StudioFlare quality={quality} sampleTimeline={sampleTimeline} />
        <PerformanceMonitor onDecline={handleDecline} onIncline={handleIncline} />
        {import.meta.env.DEV ? <DevHandle /> : null}
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Canvas>
    </div>
  )
}
