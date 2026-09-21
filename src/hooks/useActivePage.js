import { useEffect, useSyncExternalStore } from 'react'
import { sections } from '../data/siteContent'
import {
  getStageServerSnapshot,
  getStageSnapshot,
  setSectionIndex,
  subscribeStage,
} from '../state/stageStore'

/**
 * Reads the active section. Pure subscriber — mount `useActivePageObserver`
 * exactly once (App does) to actually drive it.
 * @returns {{ sectionId: string, sectionIndex: number }}
 */
export function useActivePage() {
  const snap = useSyncExternalStore(
    subscribeStage,
    getStageSnapshot,
    getStageServerSnapshot,
  )
  return { sectionId: snap.sectionId, sectionIndex: snap.sectionIndex }
}

/**
 * Owns the active-section boundary.
 *
 * The root margin pulls the detection band down past the fixed navbar and up
 * from the fold, so a section only becomes "active" once its content — not
 * its top padding — is what the reader is actually looking at. Ties are
 * broken by intersection ratio, then by document order, which keeps short
 * sections from being swallowed by their taller neighbours.
 */
export function useActivePageObserver() {
  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean)
    if (elements.length === 0) return undefined

    const ratios = new Map()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        let bestIndex = -1
        let bestRatio = 0
        for (let i = 0; i < sections.length; i += 1) {
          const ratio = ratios.get(sections[i].id) ?? 0
          if (ratio > bestRatio + 0.001) {
            bestRatio = ratio
            bestIndex = i
          }
        }
        if (bestIndex >= 0) setSectionIndex(bestIndex)
      },
      {
        // 96px navbar band off the top, 45% off the bottom.
        rootMargin: '-96px 0px -45% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [])
}
