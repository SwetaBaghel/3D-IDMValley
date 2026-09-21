import GradientText from './GradientText'

/**
 * Section heading.
 *
 * `title` accepts a node, so callers can wrap an emphasis fragment in
 * <GradientText italic> without this component doing string surgery on copy
 * that comes from the CMS data module.
 */
export default function SectionHeading({ eyebrow, title, lead, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase">
          <span
            aria-hidden="true"
            className="h-px w-6 bg-gradient-to-r from-signal to-neon"
          />
          <GradientText tone="label">{eyebrow}</GradientText>
        </p>
      ) : null}
      <h2 className="text-3xl leading-[1.12] font-semibold sm:text-4xl">{title}</h2>
      {lead ? <p className="mt-4 text-[15px] leading-relaxed text-body">{lead}</p> : null}
    </div>
  )
}
