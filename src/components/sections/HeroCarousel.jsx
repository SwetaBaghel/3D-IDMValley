import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  clients,
  hero,
  heroSlides,
  HERO_INTERVAL_MS,
  outcomes,
} from '../../data/siteContent'
import {
  getHeroSlide,
  getStageServerSnapshot,
  getStageSnapshot,
  setHeroSlide,
  subscribeHero,
  subscribeStage,
} from '../../state/stageStore'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'

/**
 * Hero, carousel edition — the live idmvalley.com pattern: every 3.5 s the
 * service line, the outcome stat and the 3D scene on the right change
 * together. Copy, order and pairing come from the live site.
 *
 * The timer writes `stage.heroSlide`; the 3D HeroScenes read it directly and
 * pin themselves to the transparent [data-hero-slot] box below.
 *
 * Auto-rotation pauses on hover and keyboard focus, has an explicit pause
 * button (WCAG 2.2.2: moving content must be stoppable), and does not run at
 * all under prefers-reduced-motion — the indicators still work.
 */
export default function HeroCarousel() {
  const slide = useSyncExternalStore(subscribeHero, getHeroSlide, getHeroSlide)
  const { reducedMotion } = useSyncExternalStore(
    subscribeStage,
    getStageSnapshot,
    getStageServerSnapshot,
  )
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [paused, setPaused] = useState(false)
  const running = !hovered && !focused && !paused && !reducedMotion

  /* One timeout per slide rather than an interval, so a manual jump restarts
     the full 3.5 s instead of cutting the next slide short. The callback
     writes to the external store — no React state is set in the effect. */
  useEffect(() => {
    if (!running) return undefined
    const id = setTimeout(() => setHeroSlide(slide + 1), HERO_INTERVAL_MS)
    return () => clearTimeout(id)
  }, [slide, running])

  const handleIndicator = useCallback((event) => {
    setHeroSlide(Number(event.currentTarget.dataset.slide))
  }, [])
  const togglePause = useCallback(() => setPaused((value) => !value), [])
  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback((event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }, [])

  return (
    <Section id="home" className="pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div
        className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-6"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-rule bg-snow-raised px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase shadow-lift">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
            <GradientText tone="label">{hero.eyebrow}</GradientText>
          </p>

          <h1 className="mt-7 text-[2.4rem] leading-[1.08] font-semibold sm:text-[3.25rem] lg:text-[3.6rem]">
            {/* Screen readers get the whole list once, not a line that changes
                under them every 3.5 s. */}
            <span className="sr-only">{hero.headline}</span>
            <span aria-hidden="true">
              AI automation for
              {/* All four lines stacked in one grid cell: the box is always as
                  tall as the longest line, so nothing below ever jumps. */}
              <span className="mt-1 grid">
                {heroSlides.map((item, i) => (
                  <span
                    key={item.id}
                    className={`transition-[opacity,transform] duration-500 ease-out [grid-area:1/1] ${
                      i === slide
                        ? 'translate-y-0 opacity-100'
                        : i === (slide + heroSlides.length - 1) % heroSlides.length
                          ? '-translate-y-4 opacity-0'
                          : 'translate-y-4 opacity-0'
                    }`}
                    style={{ willChange: i === slide ? 'transform, opacity' : undefined }}
                  >
                    <GradientText italic>{item.label}</GradientText>
                  </span>
                ))}
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-body sm:text-[17px]">
            {hero.subheadline}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={hero.primaryCta.href}
              className="gpu-hover rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-signal"
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="rounded-full border border-rule-strong bg-snow-raised px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-signal hover:text-signal"
            >
              {hero.secondaryCta.label}
            </a>
          </div>

          {/* Outcome stat, paired to the current slide as on the live site. */}
          <div className="mt-10 flex items-end gap-6">
            <div className="grid min-w-[15rem] rounded-2xl border border-rule bg-snow-raised/85 px-6 py-5 shadow-lift backdrop-blur-sm">
              {heroSlides.map((item, i) => {
                const stat = outcomes[item.stat]
                return (
                  <div
                    key={item.id}
                    aria-hidden={i !== slide}
                    className={`transition-[opacity,transform] duration-500 ease-out [grid-area:1/1] ${
                      i === slide
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-2 opacity-0'
                    }`}
                  >
                    <p className="font-display text-4xl leading-none font-bold tabular-nums">
                      <GradientText>
                        {stat.prefix ?? ''}
                        {stat.value}
                        {stat.suffix}
                      </GradientText>
                    </p>
                    <p className="mt-2 text-[13px] text-body">{stat.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-2 pb-1">
              <div role="group" aria-label="Choose a service" className="flex gap-1.5">
                {heroSlides.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    data-slide={i}
                    onClick={handleIndicator}
                    aria-pressed={i === slide}
                    aria-label={item.label}
                    className="grid h-6 place-items-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                        i === slide
                          ? 'w-7 bg-signal'
                          : 'w-3 bg-rule-strong hover:bg-signal/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={togglePause}
                aria-pressed={paused}
                aria-label={paused ? 'Resume carousel' : 'Pause carousel'}
                className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:text-ink"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  {paused ? (
                    <path d="M4 2.5v11l9-5.5z" />
                  ) : (
                    <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Transparent window onto the WebGL canvas: HeroScenes project this
            box's screen rect into world space every frame. */}
        <div
          data-hero-slot=""
          aria-hidden="true"
          className="pointer-events-none mx-auto aspect-square w-full max-w-[34rem]"
        />
      </div>


    </Section>
  )
}
