/**
 * Corporate multi-tone gradient text.
 *
 * Two tones only, so the whole site shares one vocabulary — see TONES below
 * for why they split on text size.
 *
 * `bg-clip-text` + `text-transparent` is a painted-background effect, so it
 * disappears under forced-colors and in print. `index.css` carries a global
 * fallback keyed off `.bg-clip-text` that hands the text back to the system
 * colour in both cases — do not remove the class from the string below or
 * that fallback stops matching.
 *
 * The gradient paints once and never animates, so it adds no per-frame cost.
 */
/**
 * Two tones, split on TEXT SIZE rather than on meaning.
 *
 * `display` carries the full Denim -> Neon Cyan -> Indigo spectrum. The cyan
 * midpoint sits at roughly 2.9:1 on snow, which clears WCAG AA for large text
 * (>=24px, or >=19px bold) and nothing smaller.
 *
 * `label` is the same spectrum with the cyan stop removed, for the 11px
 * uppercase eyebrows where the display tone would land near 2.9:1 against a
 * 4.5:1 requirement. Same family, legible at caption size.
 */
const TONES = {
  display: 'bg-gradient-to-r from-[#0D47C7] via-cyan-500 to-indigo-600',
  label: 'bg-gradient-to-r from-[#0D47C7] to-indigo-700',
}

export default function GradientText({
  children,
  tone = 'display',
  italic = false,
  className = '',
}) {
  return (
    <span
      className={`bg-clip-text text-transparent ${TONES[tone]} ${
        italic ? 'pr-[0.08em] italic' : ''
      } ${className}`}
    >
      {children}
    </span>
  )
}
