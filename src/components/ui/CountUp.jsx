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
 * Pass an optional `replayKey` to restart the animation whenever that value
 * changes (e.g. pass the active-card index from Services so the number
 * re-counts each time the card becomes active). When `replayKey` is omitted
 * the component behaves exactly as before — one-shot on scroll entry.
 *
 * The rAF loop commits at most one state update per frame and stops the
 * instant it reaches the target, so an idle statistics matrix costs nothing.
 * Under reduced motion the final value is derived straight from props — no
 * effect, no synchronous setState, no animation.
 */
export default function CountUp({ value, prefix = '', suffix = '', replayKey }) {
  const snap = useSyncExternalStore(
    subscribeStage,
    getStageSnapshot,
    getStageServerSnapshot,
  )
  const [counted, setCounted] = useState(0)
  const nodeRef = useRef(null)
  /* Stable ref so the rAF callback always sees the latest frame handle. */
  const frameRef = useRef(0)

  useEffect(() => {
    const node = nodeRef.current
    if (!node || snap.reducedMotion) return undefined

    let start = 0

    const step = (now) => {
      if (start === 0) start = now
      const t = Math.min(1, (now - start) / DURATION)
      /* easeOutExpo — fast commit, long settle. */
      const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t)
      setCounted(Math.round(value * eased))
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }

    const run = () => {
      if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current)
      start = 0
      setCounted(0)
      frameRef.current = requestAnimationFrame(step)
    }

    /* replayKey present → re-run whenever it changes (Services active card).
       replayKey absent  → original behaviour: one-shot via IntersectionObserver. */
    if (replayKey !== undefined) {
      run()
      return () => {
        if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        run()
      },
      { threshold: 0.4 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current)
    }
  }, [value, snap.reducedMotion, replayKey])

  return (
    <span ref={nodeRef} className="tabular-nums">
      {prefix}
      {snap.reducedMotion ? value : counted}
      {suffix}
    </span>
  )
}
