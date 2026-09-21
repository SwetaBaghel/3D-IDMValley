import { useEffect } from 'react'
import { sections } from '../data/siteContent'
import { setReducedMotion, setTimeline } from '../state/stageStore'

/**
 * Maps document scroll onto the 3D section timeline.
 *
 * Rather than `scrollY / scrollHeight`, this measures each section's own
 * anchor line and interpolates between them, so section N's pose lands
 * exactly when section N is centred — regardless of how tall the sections
 * are relative to each other. Anchors are re-measured on resize only.
 *
 * Writes go straight into the hot-path store; nothing here re-renders React.
 */
export function useScrollTimeline() {
  useEffect(() => {
    let anchors = []
    let frame = 0

    const measure = () => {
      anchors = sections.map((section) => {
        const element = document.getElementById(section.id)
        if (!element) return 0
        const box = element.getBoundingClientRect()
        return box.top + window.scrollY + box.height / 2
      })
    }

    const resolve = () => {
      frame = 0
      if (anchors.length < 2) return
      const centre = window.scrollY + window.innerHeight / 2
      if (centre <= anchors[0]) {
        setTimeline(0)
        return
      }
      const last = anchors.length - 1
      if (centre >= anchors[last]) {
        setTimeline(last)
        return
      }
      for (let i = 0; i < last; i += 1) {
        const from = anchors[i]
        const to = anchors[i + 1]
        if (centre >= from && centre < to) {
          const span = to - from
          setTimeline(i + (span > 0 ? (centre - from) / span : 0))
          return
        }
      }
    }

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(resolve)
    }

    const remeasure = () => {
      measure()
      schedule()
    }

    measure()
    resolve()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure)

    /* Section heights change as fonts load and cards reflow. */
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      observer.disconnect()
    }
  }, [])
}

/** Mirrors the OS reduced-motion preference into the stage store. */
export function useReducedMotionSync() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
}
