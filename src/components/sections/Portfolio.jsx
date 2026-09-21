import { clients, stats } from '../../data/siteContent'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'

const clientCount = stats.find((s) => s.label === 'Happy Clients')

/**
 * Portfolio — clients marquee strip.
 *
 * A full-bleed horizontal ticker showing the client roster, preceded by a
 * centred heading and followed by a four-stat summary row. The marquee
 * duplicates the list once so the scroll is seamless; it pauses on hover
 * and stops under prefers-reduced-motion (the global transition rule in
 * index.css collapses the animation-duration to 0.001ms).
 *
 * Client names only — no service lines or outcome claims attached to real
 * brands without verified case studies.
 */
export default function Portfolio() {
  /* Duplicate the list once for a seamless loop. */
  const doubled = [...clients, ...clients]

  return (
    <Section id="portfolio" className="overflow-hidden py-24 sm:py-32">
      {/* ── Heading ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl text-center">
        
        <h2 className="mt-4 font-display text-[2.1rem] leading-[1.1] font-semibold sm:text-[2.6rem]">
          Trusted by{' '}
          <GradientText italic>
            {clientCount?.value}
            {clientCount?.suffix} Brands
          </GradientText>
        </h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-body">
          We&rsquo;ve partnered with ambitious businesses to deliver digital excellence
          across commerce, lifestyle, technology and consumer brands.
        </p>
      </div>

      {/* ── Marquee strip ───────────────────────────────────────── */}
      {/* Fade masks on the edges so cards dissolve in and out cleanly. */}
      <div
        className="relative mt-14 -mx-5 sm:-mx-8"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
        aria-hidden="true"
      >
        <div className="marquee-track gap-4 py-2">
          {doubled.map((client, i) => (
            <ClientCard key={`${client}-${i}`} name={client} />
          ))}
        </div>
      </div>
      
    </Section>
  )
}

/** Single client pill — initial avatar + name. */
function ClientCard({ name }) {
  return (
    <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-rule bg-snow-raised/90 px-7 py-5 shadow-lift backdrop-blur-sm">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-signal-soft font-display text-[15px] font-bold text-signal uppercase"
        aria-hidden="true"
      >
        {name.charAt(0)}
      </span>
      <span className="font-display text-[16px] font-semibold text-ink">{name}</span>
    </div>
  )
}
