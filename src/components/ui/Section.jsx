/**
 * Shared section shell. Owns the scroll anchor id that both `useActivePage`
 * and `useScrollTimeline` measure against, so those two never drift apart.
 */
export default function Section({ id, children, className = '' }) {
  return (
    <section
      id={id}
      className={`relative z-10 mx-auto w-full max-w-[1240px] px-5 sm:px-8 ${className}`}
    >
      {children}
    </section>
  )
}
