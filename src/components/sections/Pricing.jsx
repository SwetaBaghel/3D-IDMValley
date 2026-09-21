import { useState } from 'react'
import { TIER_ACCENTS, pricingCategories } from '../../data/pricingTiers'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M6.5 10.2 8.8 12.5 13.5 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z" />
    </svg>
  )
}

/**
 * Pricing section — four category tabs (Website Development, Mobile
 * Application, Server, SEO), each revealing three tier cards with full
 * feature lists, "Included free" callouts and a coloured border accent.
 *
 * Accent palette (light-theme, high contrast on white):
 *   Starter  amber  #F59E0B
 *   Popular  violet #7C3AED
 *   Premium  cyan   #0891B2
 *
 * Clicking any card or the CTA navigates to /pricing-calculator where the
 * full interactive quote builder lives.
 */
export default function Pricing() {
  const [activeTab, setActiveTab] = useState(0)
  const category = pricingCategories[activeTab]

  return (
    <Section id="pricing" className="py-24 sm:py-32">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title={
          <>
            Scale based on <GradientText italic>your timeline</GradientText>.
          </>
        }
        lead="Transparent starting prices across every service. Pick a category to explore tiers."
      />

      {/* ── Category tabs ──────────────────────────────────────── */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
        {pricingCategories.map((cat, i) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`rounded-full border px-5 py-2 text-[13px] font-semibold transition-[border-color,background-color,color,box-shadow] duration-200 ${
              i === activeTab
                ? 'border-ink bg-ink text-white shadow-lift'
                : 'border-rule bg-snow-raised text-body shadow-lift hover:border-ink/40 hover:text-ink hover:shadow-lift-lg'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Tier cards ─────────────────────────────────────────── */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {category.tiers.map((tier, i) => {
          const accent = TIER_ACCENTS[i]
          return (
            <div
              key={tier.name}
              className="relative flex flex-col overflow-hidden rounded-2xl border-2 bg-snow-raised shadow-lift backdrop-blur-sm transition-[box-shadow] duration-300 hover:shadow-lift-lg"
              style={{ borderColor: accent.border, backgroundColor: accent.bg }}
            >
              {/* Most popular badge */}
              {tier.popular ? (
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <span
                    className="rounded-b-full px-5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white uppercase"
                    style={{ backgroundColor: accent.border }}
                  >
                    Most Popular
                  </span>
                </div>
              ) : null}

              <div className="flex flex-1 flex-col p-6 pt-8 sm:p-7 sm:pt-9">
                {/* Tier name + tagline */}
                <div className={tier.popular ? 'mt-3' : ''}>
                  <h3 className="font-display text-[1.35rem] font-bold text-ink">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-[14px] text-muted">{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="mt-5">
                  <span
                    className="font-display text-[2.1rem] font-bold leading-none tabular-nums"
                    style={{ color: accent.text }}
                  >
                    ₹{tier.priceINR.toLocaleString('en-IN')}
                  </span>
                  <span className="ml-1 text-[13px] text-muted">/{tier.unit}</span>
                </div>

                {/* Features */}
                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[13.5px] text-body"
                      style={{ color: 'inherit' }}
                    >
                      <span style={{ color: accent.border }}>
                        <CheckIcon />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Included free */}
                <div
                  className="mt-6 border-t pt-5"
                  style={{ borderColor: `${accent.border}30` }}
                >
                  <p
                    className="mb-3 text-[12px] font-bold tracking-[0.16em] uppercase"
                    style={{ color: accent.text }}
                  >
                    Included free
                  </p>
                  <ul className="space-y-2">
                    {tier.free.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-[14px]"
                        style={{ color: accent.text }}
                      >
                        <SparkIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA button */}
                <a
                  href="/pricing-calculator"
                  className="mt-7 block rounded-full py-3 text-center text-[13.5px] font-semibold transition-[opacity,transform] duration-200 hover:-translate-y-0.5 hover:opacity-90"
                  style={{
                    backgroundColor: tier.popular ? accent.border : 'transparent',
                    color: tier.popular ? '#ffffff' : accent.text,
                    border: tier.popular ? 'none' : `2px solid ${accent.border}`,
                  }}
                >
                  Get Started
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Calculator CTA ─────────────────────────────────────── */}
      <div className="mt-14 flex flex-col items-center gap-3">
        <p className="text-[13.5px] text-muted">
          Need a custom scope? Build your exact quote in real time.
        </p>
        <a
          href="/pricing-calculator"
          className="gpu-hover inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-signal to-neon-mid px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift-lg"
        >
          <span aria-hidden="true">✦</span>
          Build your exact quote with our instant calculator
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </Section>
  )
}
