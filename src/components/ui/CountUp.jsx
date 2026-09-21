import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  getStageServerSnapshot,
  getStageSnapshot,
  subscribeStage,
} from '../../state/stageStore'

const DURATION = 1100

/**
 * Counts a metric up once, the first time it scrolls into view.
 *
 * The rAF loop commits at most one state update per frame and stops the
 * instant it reaches the target, so an idle statistics matrix costs nothing.
 * Under reduced motion the final value is derived straight from props — no
 * effect, no synchronous setState, no animation.
 */
export default function CountUp({ value, prefix = '', suffix = '' }) {
  const snap = useSyncExternalStore(
    subscribeStage,
    getStageSnapshot,
    getStageServerSnapshot,
  )
  const [counted, setCounted] = useState(0)
  const nodeRef = useRef(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node || snap.reducedMotion) return undefined

    let frame = 0
    let start = 0

    const step = (now) => {
      if (start === 0) start = now
      const t = Math.min(1, (now - start) / DURATION)
      /* easeOutExpo — fast commit, long settle. */
      const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t)
      setCounted(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (frame !== 0) cancelAnimationFrame(frame)
    }
  }, [value, snap.reducedMotion])

  return (
    <span ref={nodeRef} className="tabular-nums">
      {prefix}
      {snap.reducedMotion ? value : counted}
      {suffix}
    </span>
  )
}
