import { useCallback, useSyncExternalStore } from 'react'
import { serviceGroups } from '../../data/siteContent'
import {
  getStageServerSnapshot,
  getStageSnapshot,
  setServiceIndex,
  subscribeStage,
} from '../../state/stageStore'
import CountUp from '../ui/CountUp'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

/**
 * Services.
 *
 * Each card is index-locked to one of the Four Floating Status Layers in the
 * 3D hub (`serviceGroups[i].layer === i`). Selecting a card writes to the
 * stage store; BracketCore lifts the matching node and AmbientDropShadow
 * shifts the shadow pool toward it.
 *
 * Three enhancements over the original flat layout:
 *   1. Per-pillar accent — border, dot, pills and metric number all use the
 *      pillar's own hex via a --accent CSS custom property so Tailwind's
 *      static analysis is never asked to generate runtime class names.
 *   2. Animated metric — CountUp re-counts each time the card becomes active,
 *      driven by the new `replayKey` prop. A thin bar is shown only for the
 *      two % metrics (Digital Marketing and CloudOps) where a fraction out of
 *      100 is meaningful.
 *   3. Accordion — collapsed cards show only the eyebrow, title and dot.
 *      The detail region animates open with grid-rows so no height guessing
 *      is needed. Tag pills stagger in. Cards sit in a 2-col grid at lg+.
 */
export default function Services() {
  const snap = useSyncExternalStore(
    subscribeStage,
    getStageSnapshot,
    getStageServerSnapshot,
  )

  const handleSelect = useCallback((event) => {
    setServiceIndex(Number(event.currentTarget.dataset.layer))
  }, [])

  return (
    <Section id="services" className="py-24 sm:py-32">
      <div className="lg:max-w-[38rem]">
        <SectionHeading
          eyebrow="Services"
          title={
            <>
              Four pillars, one <GradientText italic>operating system</GradientText>.
            </>
          }
          lead="Brand, product, acquisition and platform run as a single engagement — which is what makes the automation between them possible."
        />
      </div>

      <div className="mt-12 grid gap-4 lg:max-w-[38rem] lg:grid-cols-2">
        {serviceGroups.map((group) => {
          const active = group.layer === snap.serviceIndex
          const { metric } = group
          const isPercent = metric.suffix === '%'

          return (
            <button
              key={group.id}
              type="button"
              data-layer={group.layer}
              onClick={handleSelect}
              onFocus={handleSelect}
              onMouseEnter={handleSelect}
              aria-pressed={active}
              /* --accent drives all dynamic colour without runtime Tailwind classes. */
              style={{ '--accent': group.accent }}
              className={`gpu-hover group w-full rounded-xl border p-5 text-left transition-[border-color,background-color,box-shadow,transform] duration-300 sm:p-6 ${
                active
                  ? 'border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_7%,white)] shadow-lift-lg backdrop-blur-sm lg:translate-x-1.5'
                  : 'border-rule bg-snow-raised/70 shadow-lift hover:border-[color:var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_4%,white)] hover:shadow-lift-lg'
              }`}
            >
              {/* ── Header row — always visible ─────────────────────── */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                    Layer {String(group.layer + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{group.title}</h3>
                </div>
                <span
                  aria-hidden="true"
                  className="mt-1 size-2.5 shrink-0 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: active ? group.accent : 'var(--color-rule-strong)',
                  }}
                />
              </div>

              {/* ── Accordion body — grid-rows technique, no max-height guessing ── */}
              <div
                aria-hidden={!active}
                className={`grid transition-[grid-template-rows] duration-300 ${
                  active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden min-h-0">
                  <p className="mt-3 text-[14.5px] leading-relaxed text-body">
                    {group.summary}
                  </p>

                  {/* Tag pills — staggered in */}
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item, i) => (
                      <li
                        key={item}
                        className="rounded-full border px-2.5 py-1 text-[13px] transition-[opacity,transform] duration-300"
                        style={{
                          borderColor: active
                            ? `color-mix(in srgb, ${group.accent} 25%, transparent)`
                            : 'var(--color-rule)',
                          backgroundColor: active
                            ? 'rgb(255 255 255 / 0.7)'
                            : 'var(--color-snow)',
                          color: active ? 'var(--color-ink)' : 'var(--color-muted)',
                          transitionDelay: active ? `${i * 40}ms` : '0ms',
                          opacity: active ? 1 : 0,
                          transform: active ? 'translateY(0)' : 'translateY(4px)',
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Metric block */}
                  <div className="mt-4 border-t border-rule pt-3">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-display text-[1.6rem] leading-none font-semibold tabular-nums"
                        style={{ color: group.accent }}
                      >
                        <CountUp
                          value={metric.value}
                          prefix={metric.prefix ?? ''}
                          suffix={metric.suffix}
                          replayKey={active ? group.layer : undefined}
                        />
                      </span>
                      <span className="text-[13px] text-muted">{metric.label}</span>
                    </div>

                    {/* Thin bar only for % metrics — 75 campaigns has no denominator */}
                    {isPercent && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-rule">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{
                            width: active ? `${metric.value}%` : '0%',
                            backgroundColor: group.accent,
                            transitionDelay: active ? '150ms' : '0ms',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
