import { clients, hero, stats } from '../../data/siteContent'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'

/**
 * Hero. The copy column is held to the left two thirds because the 3D hub
 * occupies the right third for the whole of this section's timeline window.
 */
export default function Home() {
  /* Split rather than hardcode, so the headline stays verbatim CMS copy. */
  const [before, after] = hero.headline.split(hero.headlineEmphasis)

  return (
    <Section id="home" className="pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="max-w-[46rem] lg:max-w-[38rem]">
        <p className="inline-flex items-center gap-2 rounded-full border border-rule bg-snow-raised px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-signal uppercase shadow-lift">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
          <GradientText tone="label">{hero.eyebrow}</GradientText>
        </p>

        <h1 className="mt-7 text-[2.4rem] leading-[1.06] font-semibold sm:text-[3.25rem] lg:text-[3.6rem]">
          {after === undefined ? (
            hero.headline
          ) : (
            <>
              {before}
              <GradientText italic>{hero.headlineEmphasis}</GradientText>
              {after}
            </>
          )}
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
          <span className="w-full text-xs text-muted sm:w-auto sm:pl-2">
            {hero.location}
          </span>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="font-display text-2xl font-semibold text-ink tabular-nums sm:text-[1.75rem]">
                  {stat.value}
                  {stat.suffix}
                </span>
                <span className="mt-1 block text-[12px] leading-snug text-muted">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-20 border-t border-rule pt-7">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Trusted by
        </p>
        <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          {clients.map((client) => (
            <li
              key={client}
              className="font-display text-sm font-medium text-muted/80 transition-colors duration-200 hover:text-ink"
            >
              {client}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
