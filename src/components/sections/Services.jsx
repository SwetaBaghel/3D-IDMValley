import { useCallback, useSyncExternalStore } from 'react'
import { serviceGroups } from '../../data/siteContent'
import {
  getStageServerSnapshot,
  getStageSnapshot,
  setServiceIndex,
  subscribeStage,
} from '../../state/stageStore'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

/**
 * Services.
 *
 * Each card is index-locked to one of the Four Floating Status Layers in the
 * 3D hub (`serviceGroups[i].layer === i`). Selecting a card writes to the
 * stage store; FocalModels lifts the matching layer, tints its edge lines
 * cyan, and AmbientDropShadow slides the shadow pool toward it.
 *
 * NOTE on the cyan tint: these cards select on mouseenter, so on a pointer
 * device hover and active are effectively the same state — a hover-only tint
 * would never be visible. The cyan-tinted slate profile therefore lives on
 * the ACTIVE state (with the hover classes kept for the keyboard and touch
 * paths, where hover does not imply selection). Cyan is used deliberately
 * rather than the brand blue: it is the same hue the selected 3D slab's
 * edges and the lens flare shift to, which is what closes the feedback loop
 * between the DOM and the canvas.
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

      <div className="mt-12 grid gap-4 lg:max-w-[38rem]">
        {serviceGroups.map((group) => {
          const active = group.layer === snap.serviceIndex
          return (
            <button
              key={group.id}
              type="button"
              data-layer={group.layer}
              onClick={handleSelect}
              onFocus={handleSelect}
              onMouseEnter={handleSelect}
              aria-pressed={active}
              className={`gpu-hover group w-full rounded-xl border p-5 text-left transition-[border-color,background-color,box-shadow,transform] duration-300 sm:p-6 ${
                active
                  ? 'border-cyan-500/40 bg-cyan-50/70 shadow-lift-lg lg:translate-x-1.5'
                  : 'border-rule bg-snow-raised/70 shadow-none hover:border-cyan-500/30 hover:bg-cyan-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                    Layer {String(group.layer + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{group.title}</h3>
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-1 size-2.5 shrink-0 rounded-full transition-colors duration-300 ${
                    active ? 'bg-cyan-600' : 'bg-rule-strong'
                  }`}
                />
              </div>

              <p className="mt-3 text-[14.5px] leading-relaxed text-body">
                {group.summary}
              </p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors duration-300 ${
                      active
                        ? 'border-cyan-600/25 bg-white/70 text-cyan-900'
                        : 'border-rule bg-snow text-muted'
                    }`}
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-4 border-t border-rule pt-3 font-mono text-[11.5px] text-muted">
                {group.metric}
              </p>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
