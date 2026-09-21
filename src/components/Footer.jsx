import { contact, sections, serviceGroups } from '../data/siteContent'

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
  [
    'Voxel Web Development',
    'Diego G.',
    'https://sketchfab.com/3d-models/voxel-web-development-50ad959d6c6b4799806c45bfa46ca550',
  ],
]

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/idmvalley',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Twitter / X',
    href: 'https://twitter.com/idmvalley',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/idmvalley',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path
          d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="17.5"
          y1="6.5"
          x2="17.51"
          y2="6.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/idmvalley',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
]

const LEGAL_LINKS = [
  { label: "FAQ's", href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
]

/** @param {{ credits?: boolean }} props — show 3D model attributions. */
export default function Footer({ credits = false }) {
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-rule bg-snow-raised">
      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1240px] px-5 pt-14 pb-10 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo mark */}
            <a
              href="/"
              aria-label="IDM Valley — home"
              className="inline-flex items-center"
            >
              <img
                src="/logo-removebg-preview.png"
                alt="IDM Valley"
                className="h-24 w-auto object-contain"
              />
            </a>

            <p className="mt-4 max-w-[22rem] text-[13.5px] leading-relaxed text-body">
              IDM Valley helps businesses grow with AI automation, web development, mobile
              apps, SEO, and digital marketing.
            </p>

            <div className="mt-6 space-y-1.5 text-[13px] text-body">
              <p>
                <span className="font-semibold text-ink">Contact</span>
              </p>
              <p>
                <a href={contact.phoneHref} className="hover:text-signal">
                  {contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${contact.email}`} className="hover:text-signal">
                  {contact.email}
                </a>
              </p>
            </div>

            <div className="mt-4 text-[13px] text-body">
              <p className="font-semibold text-ink">Address</p>
              <p className="mt-1 leading-relaxed">{contact.address}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
              Quick Links
            </p>
            <ul className="mt-4 space-y-3">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-[13.5px] text-body transition-colors duration-150 hover:text-signal"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
              Our Services
            </p>
            <ul className="mt-4 space-y-3">
              {serviceGroups.map((group) => (
                <li key={group.id}>
                  <a
                    href="#services"
                    className="text-[13.5px] text-body transition-colors duration-150 hover:text-signal"
                  >
                    {group.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
              Legal
            </p>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13.5px] text-body transition-colors duration-150 hover:text-signal"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
              Follow Us
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-body">
              Connect with us for updates, launches, and insights.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gpu-hover grid size-9 place-items-center rounded-lg border border-rule bg-snow-sunk text-body shadow-lift transition-[border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-lift-lg hover:text-signal"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="text-[12px] text-muted">
            &copy; {year} IDM VALLEY. All Rights Reserved.
          </p>
          <p className="text-[12px] text-muted">
            Built with care
            <span aria-hidden="true" className="mx-2 text-rule-strong">
              •
            </span>
            <a href="#contact" className="hover:text-signal">
              Get a quote
            </a>
          </p>
        </div>
      </div>

      {/* ── 3D model credits (CC BY 4.0) ─────────────────────── */}
      {credits ? (
        <div className="border-t border-rule bg-snow-sunk">
          <div className="mx-auto max-w-[1240px] px-5 py-3 text-[11px] leading-relaxed text-muted sm:px-8">
            3D models:{' '}
            {MODEL_CREDITS.map(([title, author, href], i) => (
              <span key={title}>
                <a
                  href={href}
                  className="underline underline-offset-2 hover:text-signal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY 4.0
            </a>
            . Optimised for the web.
          </div>
        </div>
      ) : null}
    </footer>
  )
}
