import { useCallback, useEffect, useRef, useState } from 'react'
import { contact, sections } from '../data/siteContent'
import { useActivePage } from '../hooks/useActivePage'

const MARQUEE_TEXT =
  '✨ AI Solutions • Digital Marketing • Custom Web Development • SEO Optimization • Mobile Apps 🚀 AI-Powered Marketing • Web & App Development • Performance Ads • SEO Mastery'

const TOP_SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/idmvalley',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'X',
    href: 'https://x.com/idmvalley',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/idmvalley',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/idmvalley',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
]

/**
 * Thin utility bar above the main navbar.
 * Left: phone + email + location tag. Centre: infinite marquee. Right: social icons.
 * Hidden on mobile (too narrow) — only shows at sm+.
 */
function TopBar() {
  return (
    <div
      aria-hidden="true"
      className="hidden border-b border-rule/60 bg-[#d0daff]/90 backdrop-blur-sm sm:block"
    >
      <div className="mx-auto flex h-8 max-w-[1240px] items-center gap-0 px-5 sm:px-8">
        {/* Left — contact meta */}
        <div className="flex shrink-0 items-center gap-4 text-[12px] text-muted">
          <a href={contact.phoneHref} className="flex items-center gap-1.5 hover:text-signal">
            <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.95-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-signal">
            <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {contact.email}
          </a>
          <span className="hidden items-center gap-1.5 xl:flex">
            <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Global Remote Operations
          </span>
        </div>
        <span aria-hidden="true" className="mx-3 h-3 w-px shrink-0 bg-rule-strong" />
        <div className="relative min-w-0 flex-1 overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)' }}>
          <div className="marquee-track gap-8" style={{ animationDuration: '22s' }}>
            {[MARQUEE_TEXT, MARQUEE_TEXT].map((text, i) => (
              <span key={i} className="shrink-0 whitespace-nowrap text-[12px] text-muted">{text}</span>
            ))}
          </div>
        </div>
        <span aria-hidden="true" className="mx-3 h-3 w-px shrink-0 bg-rule-strong" />
        <div className="flex shrink-0 items-center gap-2">
          {TOP_SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="text-muted transition-colors duration-150 hover:text-signal">
              <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true"><path d={s.path} /></svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

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
          ? 'border-b border-rule bg-[#dce4ff]/98 shadow-lift backdrop-blur-xl'
          : 'border-b border-rule/40 bg-[#dce4ff]/95 backdrop-blur-md'
      }`}
    >
      <TopBar />
      <nav
        aria-label="Primary"
        className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8"
      >
        <a
          href="/"
          aria-label="IDM Valley — back to top"
          className="flex shrink-0 cursor-pointer items-center select-none"
          onClick={closeMenu}
        >
          <img
            src="/logo-removebg-preview.png"
            alt="IDM Valley"
            className="h-18 w-auto object-contain"
          />
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
                  className={`group relative isolate block overflow-hidden rounded-full px-4 py-2 text-[15px] font-medium transition-colors duration-200 ${
                    active ? 'text-signal' : 'text-body hover:text-ink'
                  }`}
                >
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
            className="hidden rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-signal sm:block"
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
        className="border-t border-rule bg-[#dce4ff]/98 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-[1240px] gap-1 px-5 py-4 sm:px-8">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={closeMenu}
                className={`block rounded-lg px-3 py-2.5 text-[15px] font-medium ${
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
