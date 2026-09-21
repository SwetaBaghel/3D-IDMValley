import { brand, outcomes, stats } from '../../data/siteContent'
import CountUp from '../ui/CountUp'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

/*
 * Per-cell accent colours for the two stat grids.
 * Index-locked to the stats / outcomes arrays in siteContent.js.
 * All are light-theme safe — checked against #ffffff at the cell's bg.
 *
 * Stats:    0 Years → amber   1 Projects → violet   2 Clients → cyan   3 Team → green
 * Outcomes: 0 Team  → violet  1 Leaks    → cyan     2 Campaigns→ amber  3 Manpower→ green
 */
const STAT_ACCENTS = [
  { num: '#B45309', bg: 'rgba(245,158,11,0.07)', dot: '#F59E0B' },  // amber  — Years of Experience
  { num: '#5B21B6', bg: 'rgba(124,58,237,0.07)', dot: '#7C3AED' },  // violet — Projects Delivered
  { num: '#0E7490', bg: 'rgba(8,145,178,0.08)',  dot: '#0891B2' },  // cyan   — Happy Clients
  { num: '#166534', bg: 'rgba(22,163,74,0.07)',  dot: '#16A34A' },  // green  — Team Members
]

const OUTCOME_ACCENTS = [
  { num: '#5B21B6', bg: 'rgba(124,58,237,0.06)', dot: '#7C3AED' },  // violet — Team productivity
  { num: '#0E7490', bg: 'rgba(8,145,178,0.07)',  dot: '#0891B2' },  // cyan   — Leaks detected
  { num: '#B45309', bg: 'rgba(245,158,11,0.07)', dot: '#F59E0B' },  // amber  — Campaigns launched
  { num: '#166534', bg: 'rgba(22,163,74,0.07)',  dot: '#16A34A' },  // green  — Manpower release
]

/**
 * About. The hub rotates in tight behind this grid, so the matrix sits on a
 * translucent card that lets the satin framing read through it.
 */
export default function About() {
  return (
    <Section id="about" className="py-24 sm:py-32">
      <SectionHeading
        eyebrow="About Us"
        title={
          <>
            A full-service digital agency built around{' '}
            <GradientText italic>automation</GradientText>.
          </>
        }
        lead={brand.description}
      />

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-6">
        {/* Transparent window onto the shared WebGL canvas: AboutLaptop
            projects this box's screen rect into world space every frame. */}
        <div
          data-about-slot=""
          aria-hidden="true"
          className="pointer-events-none mx-auto aspect-square w-full max-w-[40rem]"
        />

        <div className="rounded-2xl border border-rule bg-snow-raised/80 p-6 shadow-lift backdrop-blur-md sm:p-9">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            Agency statistics matrix
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-rule lg:grid-cols-4">
            {stats.map((stat, i) => {
              const a = STAT_ACCENTS[i] ?? STAT_ACCENTS[0]
              return (
                <div key={stat.label} className="bg-snow-raised px-5 py-7">
                  <dd
                    className="font-display text-[2.1rem] leading-none font-semibold tabular-nums"
                    style={{ color: a.num }}
                  >
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <dt className="mt-2.5 text-[14px] leading-snug text-body">
                    {stat.label}
                  </dt>
                </div>
              )
            })}
          </dl>

          <p className="mt-9 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            Measured outcomes
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-rule lg:grid-cols-4">
            {outcomes.map((outcome, i) => {
              const a = OUTCOME_ACCENTS[i] ?? OUTCOME_ACCENTS[0]
              return (
                <div key={outcome.label} className="hatch-matrix bg-snow-raised px-5 py-7">
                  <dd
                    className="font-display text-[2.1rem] leading-none font-semibold tabular-nums"
                    style={{ color: a.num }}
                  >
                    <CountUp
                      value={outcome.value}
                      prefix={outcome.prefix ?? ''}
                      suffix={outcome.suffix}
                    />
                  </dd>
                  <dt className="mt-2.5 text-[14px] leading-snug text-body">
                    {outcome.label}
                  </dt>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </Section>
  )
}
