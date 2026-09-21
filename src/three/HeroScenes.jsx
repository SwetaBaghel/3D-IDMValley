import { useFrame } from '@react-three/fiber'
import { use, useRef } from 'react'
import { stage } from '../state/stageStore'
import { createHeroState, hero, ready, stepHero } from './heroStage'

/**
 * Hero scenes, pinned to the transparent [data-hero-slot] box in the hero
 * copy and driven by `stage.heroSlide` (written by the hero's 3.5 s timer).
 *
 * All the work lives in heroStage.js; this component only suspends until the
 * models are ready, finds the slot, and hands each frame to stepHero().
 */
export default function HeroScenes() {
  use(ready)

  const slotRef = useRef(null)
  const stateRef = useRef(createHeroState())

  useFrame((frame, delta) => {
    let slot = slotRef.current
    if (!slot || !slot.isConnected) {
      slot = document.querySelector('[data-hero-slot]')
      slotRef.current = slot
    }
    stepHero(
      {
        slide: stage.heroSlide,
        elapsed: frame.clock.elapsedTime,
        delta,
        reduced: stage.reducedMotion,
        rect: slot?.getBoundingClientRect() ?? null,
        size: frame.size,
        viewport: frame.viewport,
      },
      stateRef.current,
    )
  })

  return <primitive object={hero.root} />
}
