/**
 * Single source of truth for every string and number rendered by the site.
 *
 * PROVENANCE
 *  - brand, hero, about, stats, services, clients and contact are lifted
 *    verbatim from the live idmvalley.com ecosystem.
 *  - There is deliberately NO per-client outcome copy and NO blog data. The
 *    live site publishes client logos only; any case-study claim attached to
 *    a real client name must come from the actual engagement, not be written
 *    here. Add a `caseStudies` export when real material exists.
 *  - Pricing lives in quoteCatalog.js, transcribed from the live calculator.
 */

export const brand = {
  name: 'IDM Valley',
  tagline: 'AI Driven Digital 360° Company',
  description:
    'IDM Valley is a full-service digital agency specializing in AI automation, digital transformation, and innovative technology solutions. Transform ambitious ideas into powerful digital experiences that drive measurable growth.',
}

/** Section order drives BOTH the navbar and the 3D timeline. Do not reorder
 *  without updating src/three/sequence.js — the keyframe array is index-locked. */
export const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'services', label: 'Services' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'contact', label: 'Contact Us' },
]

export const hero = {
  eyebrow: 'AI Driven Digital 360° Company',
  headline:
    'AI automation for Mobile Applications, Website Designing, Digital Marketing, CloudOps',
  /** Fragment of `headline` given the gradient emphasis treatment. Must be an
   *  exact substring of `headline`, or the split is a no-op and the headline
   *  simply renders flat. */
  headlineEmphasis: 'AI automation',
  subheadline:
    "We translate messy processes into clean, automated flows that compound your team's output and free up strategic time.",
  primaryCta: { label: 'Start a project', href: '#contact' },
  secondaryCta: { label: 'See the work', href: '#portfolio' },
  location: 'Delhi NCR · working with clients worldwide',
}

/**
 * Hero carousel, as on idmvalley.com: every 3.5 s the service line, the 3D
 * scene and the outcome stat change together. Order and pairing are the live
 * site's (Mobile Applications <-> +23%, Website Designing <-> 100%, ...).
 */
export const heroSlides = [
  { id: 'mobile', label: 'Mobile Applications', stat: 0 },
  { id: 'web', label: 'Website Designing', stat: 1 },
  { id: 'marketing', label: 'Digital Marketing', stat: 2 },
  { id: 'cloud', label: 'CloudOps', stat: 3 },
]
export const HERO_INTERVAL_MS = 2500

/** The agency statistics matrix framed by the hub in the About sequence. */
export const stats = [
  { value: 8, suffix: '+', label: 'Years of Experience' },
  { value: 40, suffix: '+', label: 'Projects Delivered' },
  { value: 50, suffix: '+', label: 'Happy Clients' },
  { value: 15, suffix: '+', label: 'Team Members' },
]

/** Outcome metrics — the second row of the About matrix. */
export const outcomes = [
  { value: 23, prefix: '+', suffix: '%', label: 'Team productivity growth' },
  { value: 100, suffix: '%', label: 'Leaks detected' },
  { value: 75, suffix: '+', label: 'Campaigns launched' },
  { value: 85, suffix: '%', label: 'Manpower release' },
]

/**
 * Four capability pillars. Each maps 1:1 onto one of the Four Floating
 * Status Layers in FocalModels — `layer` is the mesh index (0 = top).
 */
export const serviceGroups = [
  {
    id: 'brand',
    layer: 0,
    /** Drives the colour of this pillar's holographic node in the 3D screen. */
    accent: '#0D47C7',
    title: 'Branding',
    summary:
      'Positioning, identity systems and the narrative that makes a category remember you.',
    items: ['Branding', 'Creative', 'Content'],
    metric: { value: 75, suffix: '+', label: 'campaigns launched' },
  },
  {
    id: 'tech',
    layer: 1,
    accent: '#22D3EE',
    title: 'Tech',
    summary:
      'Product engineering across mobile and web, built to ship and built to hand over.',
    items: ['Mobile Applications', 'Shopify Development', 'Website Designing'],
    metric: { value: 40, suffix: '+', label: 'projects delivered' },
  },
  {
    id: 'growth',
    layer: 2,
    accent: '#4F46E5',
    title: 'Digital Marketing',
    summary:
      'Acquisition that is measured end-to-end, from first impression to booked revenue.',
    items: [
      'Digital Marketing',
      'SEO Optimization',
      'Social Media Marketing',
      'Email Marketing',
    ],
    metric: { value: 23, prefix: '+', suffix: '%', label: 'team productivity growth' },
  },
  {
    id: 'cloudops',
    layer: 3,
    accent: '#0891B2',
    title: 'CloudOps',
    summary:
      'Automation, observability and cost control so the platform runs without heroics.',
    items: ['CloudOps', 'AI Automation', 'Process Orchestration'],
    metric: { value: 85, suffix: '%', label: 'manpower release' },
  },
]

/** Client roster as published on idmvalley.com. */
export const clients = [
  'avshack',
  'DivineBamboo',
  'goldleaf',
  'janapril',
  'kaizen',
  'kwc',
  'modv',
  'pixelrush',
  'revital',
  'riderzplanet',
  'sandsfashions',
]

export const contact = {
  phone: '+91 98910 54016',
  phoneHref: 'tel:+919891054016',
  email: 'hi@idmvalley.com',
  address: 'A7/15 Ground Floor, Sec 85 BPTP, Faridabad, HR, 121002',
  region: 'Delhi NCR · working with clients worldwide',
  budgetOptions: [
    'Under ₹1,00,000',
    '₹1,00,000 – ₹5,00,000',
    '₹5,00,000 – ₹15,00,000',
    '₹15,00,000+',
  ],
}
