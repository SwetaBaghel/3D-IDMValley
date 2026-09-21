import { useCallback, useEffect, useRef, useState } from 'react'
import { sections } from '../data/siteContent'
import { useActivePage } from '../hooks/useActivePage'

/**
 * Fixed top overlay navigation.
 *
 * Two animated affordances, both kept off the React render path:
 *
 *  - the active underline is a transform-only scaleX on a promoted layer;
 *  - the hover glint is a radial gradient whose centre comes from two CSS
 *    custom properties written directly onto the hovered tab. Tracking the
 *    cursor through state would re-render the navbar on every mousemove; this
 *    way a move costs one style recalc on one element, and the 3D render loop
 *    never sees it.
 *
 * `useActivePage` remains the sole source of truth for which link is lit.
 */
export default function Navbar() {
  const { sectionId } = useActivePage()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = useCallback(() => setOpen(false), [])
  const toggleMenu = useCallback(() => setOpen((value) => !value), [])

  /* One delegated listener for the whole tab strip rather than one per link,
     and writes are coalesced to a single frame so a fast sweep across the nav
     cannot outpace the compositor. */
  const frameRef = useRef(0)
  const pendingRef = useRef(null)

  const handlePointerMove = useCallback((event) => {
    if (event.pointerType !== 'mouse') return
    const tab = event.target.closest('[data-glint]')
    if (!tab) return

    const box = tab.getBoundingClientRect()
    pendingRef.current = {
      tab,
      x: event.clientX - box.left,
      y: event.clientY - box.top,
    }

    if (frameRef.current !== 0) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      const next = pendingRef.current
      if (!next) return
      next.tab.style.setProperty('--glint-x', `${next.x}px`)
      next.tab.style.setProperty('--glint-y', `${next.y}px`)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <header
      className={`gpu-layer fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? 'border-b border-rule bg-snow/85 shadow-[0_1px_0_0_rgba(17,17,17,0.04)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8"
      >
        {/* Corporate logotype: [ IDM ] x VALLEY. The visual is split across
            spans for the bracket / denim / separator treatment, so the link
            carries its own accessible name and the decoration is hidden from
            assistive tech rather than being read out character by character. */}
        <a
          href="#home"
          aria-label="IDM Valley — back to top"
          className="group flex shrink-0 cursor-pointer items-center gap-2 select-none"
          onClick={closeMenu}
        >
          <span
            aria-hidden="true"
            className="font-display flex items-baseline gap-1.5 text-[15px] leading-none font-bold"
          >
            <span className="flex items-baseline">
              <span className="text-rule-strong transition-colors duration-200 group-hover:text-signal/50">
                [
              </span>
              <span className="px-1 tracking-[0.2em] text-signal">IDM</span>
              <span className="text-rule-strong transition-colors duration-200 group-hover:text-signal/50">
                ]
              </span>
            </span>
            <span className="text-[10px] text-neon-ink">&#10005;</span>
            <span className="tracking-[0.2em] text-ink">VALLEY</span>
          </span>
        </a>

        <ul
          className="hidden items-center gap-1 lg:flex"
          onPointerMove={handlePointerMove}
        >
          {sections.map((section) => {
            const active = section.id === sectionId
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  data-glint=""
                  aria-current={active ? 'true' : undefined}
                  className={`group relative isolate block overflow-hidden rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    active ? 'text-signal' : 'text-body hover:text-ink'
                  }`}
                >
                  {/* Specular glint — position driven by --glint-x/--glint-y. */}
                  <span
                    aria-hidden="true"
                    className="nav-glint pointer-events-none absolute inset-0 -z-10 rounded-full opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:will-change-[opacity]"
                  />
                  {section.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-center bg-signal backface-hidden transition-transform duration-300 ease-out group-hover:will-change-transform ${
                      active
                        ? 'scale-x-100 will-change-transform'
                        : 'scale-x-0 group-hover:scale-x-50'
                    }`}
                  />
                </a>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="hidden rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-signal sm:block"
          >
            Start a project
          </a>
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="grid size-10 place-items-center rounded-full border border-rule bg-snow-raised text-ink lg:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
              <path
                d={open ? 'M4 4l12 12M16 4L4 16' : 'M3 6h14M3 10h14M3 14h14'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-rule bg-snow-raised/95 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-[1240px] gap-1 px-5 py-4 sm:px-8">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={closeMenu}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  section.id === sectionId ? 'bg-signal-soft text-signal' : 'text-body'
                }`}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
