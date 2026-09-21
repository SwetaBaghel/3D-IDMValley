import { brand, contact, sections } from '../data/siteContent'

/** CC BY 4.0 requires title, author, source and licence for each model. */
const MODEL_CREDITS = [
  [
    'iPhone 16 Pro Max',
    'Sketcher',
    'https://sketchfab.com/3d-models/iphone-16-pro-max-dd0073ec4d5e43f8a9e4b20da71badcd',
  ],
  [
    'iMac',
    'sethgordon',
    'https://sketchfab.com/3d-models/imac-a44ab4c19a584a6cb9672354060b293c',
  ],
  [
    'Weekly Challenge (19) Cloud',
    '21some',
    'https://sketchfab.com/3d-models/weekly-challenge-19-cloud-cd5a48bc55964a87bf6a468485be154f',
  ],
  [
    'Physically Based Rendering Magnifier',
    'godisme1220',
    'https://sketchfab.com/3d-models/physically-based-rendering-magnifier-gltf-847f15958d5e49b5aa994fadcfec6b32',
  ],
]

/** @param {{ credits?: boolean }} props — show 3D model attributions. */
export default function Footer({ credits = false }) {
  return (
    <footer className="relative z-10 border-t border-rule bg-snow-raised/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-8">
        <div>
          <p className="font-display text-sm font-semibold text-ink">{brand.name}</p>
          <p className="mt-1 text-[12.5px] text-muted">{brand.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-[12.5px] text-body hover:text-signal"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-[12.5px] text-muted">
          {contact.phone} · {contact.email}
        </p>
      </div>
      {credits ? (
        <div className="mx-auto max-w-[1240px] border-t border-rule px-5 py-4 text-[11px] leading-relaxed text-muted sm:px-8">
          3D models:{' '}
          {MODEL_CREDITS.map(([title, author, href], i) => (
            <span key={title}>
              <a href={href} className="underline underline-offset-2 hover:text-signal">
                {title}
              </a>{' '}
              by {author}
              {i < MODEL_CREDITS.length - 1 ? ' · ' : ''}
            </span>
          ))}{' '}
          — licensed under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="underline underline-offset-2 hover:text-signal"
          >
            CC BY 4.0
          </a>
          . Optimised for the web.
        </div>
      ) : null}
    </footer>
  )
}
