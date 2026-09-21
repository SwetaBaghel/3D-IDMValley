import { clients, stats } from '../../data/siteContent'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

const delivered = stats.find((stat) => stat.label === 'Projects Delivered')
const clientCount = stats.find((stat) => stat.label === 'Happy Clients')

/**
 * Portfolio — the client roster.
 *
 * Deliberately names only. idmvalley.com publishes client logos without
 * engagement detail, so nothing here attributes a service line or an outcome
 * to a real brand. When verified case studies exist, add a `caseStudies`
 * export to siteContent and render them as a separate block below this grid —
 * do not bolt claims onto these cards.
 */
export default function Portfolio() {
  return (
    <Section id="portfolio" className="py-24 sm:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Portfolio"
          title={
            <>
              Brands we have <GradientText italic>built with</GradientText>.
            </>
          }
          lead="A selection of the teams on our client roster, across commerce, lifestyle, technology and consumer brands."
        />
        <dl className="flex gap-8">
          {[delivered, clientCount].filter(Boolean).map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-2xl font-semibold text-ink">
                {stat.value}
                {stat.suffix}
              </dd>
              <dt className="mt-0.5 text-[12px] text-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {clients.map((client) => (
          <li
            key={client}
            className="gpu-hover flex items-center gap-3 rounded-xl border border-rule bg-snow-raised/85 px-5 py-5 backdrop-blur-sm transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-signal/35"
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal-soft font-display text-sm font-bold text-signal uppercase"
            >
              {client.charAt(0)}
            </span>
            <span className="min-w-0 truncate font-display text-[15px] font-semibold text-ink">
              {client}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
