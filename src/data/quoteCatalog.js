/**
 * Project Quote Calculator catalog.
 *
 * PROVENANCE: every project type, base price, inclusion, add-on, INR price,
 * USD price and day estimate below is transcribed from the live calculator at
 * idmvalley.com/pricing (captured 2026-09-18). Nothing here is derived.
 *
 * USD prices are NOT a conversion of INR — the live site sets them per item
 * (the Website base is ₹25,000 but $349, a ~71.6 rate, while add-ons land
 * nearer ~79). Keep both columns and update them together.
 *
 * Timeline rule, matching the live calculator:
 *   weeks = ceil((baseWeeks * 5 + sum(add-on days)) / 5)
 * i.e. add-on days are working days. Monthly retainers (SEO, Cloud) have no
 * timeline; their add-ons are monthly too.
 */

/** [label, description, inr, usd, days] — days omitted for monthly services. */
const addon = (label, description, inr, usd, days = 0) => ({
  id: label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  label,
  description,
  price: { INR: inr, USD: usd },
  days,
})

export const projectTypes = [
  {
    id: 'website',
    label: 'Website',
    icon: 'globe',
    blurb: 'Marketing & business websites that turn visitors into leads.',
    billing: 'project',
    base: { INR: 25000, USD: 349 },
    baseWeeks: 2,
    included: [
      'Up to 5 responsive pages',
      'Mobile & tablet friendly',
      'Basic on-page SEO',
      'Contact form + WhatsApp',
      'Free SSL + 1yr hosting',
    ],
    groups: [
      {
        title: 'Pages & content',
        addons: [
          addon(
            'Extra pages (per 5)',
            'Additional designed pages beyond the base 5.',
            8000,
            99,
            3,
          ),
          addon('Blog / news section', 'Article system with categories.', 6000, 79, 3),
          addon('Multi-language', 'Serve the site in 2+ languages.', 12000, 149, 5),
          addon(
            'Professional copywriting',
            'SEO content written for your pages.',
            9000,
            119,
            4,
          ),
        ],
      },
      {
        title: 'Functionality',
        addons: [
          addon('Admin CMS dashboard', 'Edit content yourself, no code.', 12000, 149, 5),
          addon('Booking / appointments', 'Let customers book online.', 15000, 189, 5),
          addon('Live chat / chatbot', 'On-site chat widget.', 3000, 39, 1),
          addon('Newsletter signup', 'Capture emails to a list.', 4000, 49, 2),
        ],
      },
      {
        title: 'Growth & performance',
        addons: [
          addon('Advanced SEO setup', 'Schema, sitemaps, meta, speed.', 10000, 129, 4),
          addon('Analytics + ad pixels', 'GA4, Meta/Google pixels.', 3000, 39, 1),
          addon('Speed optimization', 'Core Web Vitals tuning.', 6000, 79, 2),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI chatbot (24/7 support)',
            'Answer visitor questions instantly with AI.',
            15000,
            189,
            4,
          ),
          addon('AI content generation', 'Auto-draft page & blog copy.', 10000, 129, 3),
          addon(
            'AI-powered site search',
            'Smart search that understands intent.',
            8000,
            99,
            3,
          ),
        ],
      },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    icon: 'cart',
    blurb: 'Online stores built to sell — fast checkout, easy management.',
    billing: 'project',
    base: { INR: 60000, USD: 799 },
    baseWeeks: 4,
    included: [
      'Product listing & catalog',
      'Cart & checkout',
      '1 payment gateway',
      'Order management',
      'Info pages (about, contact)',
      'Responsive design',
    ],
    groups: [
      {
        title: 'Catalog & orders',
        addons: [
          addon('Product variants & options', 'Size, colour, etc.', 8000, 99, 3),
          addon('Inventory management', 'Track stock automatically.', 10000, 129, 4),
          addon('Coupon & discount engine', 'Run promo codes & offers.', 8000, 99, 3),
          addon('Wishlist & save for later', 'Let shoppers save items.', 4000, 49, 2),
        ],
      },
      {
        title: 'Payments & shipping',
        addons: [
          addon('Extra payment gateway', 'Add another payment option.', 6000, 79, 2),
          addon(
            'Shipping vendor integration',
            'Shiprocket / Delhivery / etc.',
            12000,
            149,
            5,
          ),
          addon('Cash on delivery', 'COD with verification.', 3000, 39, 1),
          addon('GST invoicing', 'Automatic tax invoices.', 7000, 89, 3),
        ],
      },
      {
        title: 'Engagement & scale',
        addons: [
          addon('Customer accounts & login', 'Order history & profiles.', 6000, 79, 3),
          addon('Reviews & ratings', 'Product reviews with photos.', 5000, 65, 2),
          addon('Abandoned cart recovery', 'Auto follow-up emails.', 8000, 99, 3),
          addon('Multi-vendor marketplace', 'Many sellers, commissions.', 40000, 499, 15),
          addon('Advanced admin dashboard', 'Full store control panel.', 12000, 149, 5),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI product recommendations',
            '“You may also like” powered by AI.',
            18000,
            229,
            6,
          ),
          addon(
            'AI shopping assistant',
            'Chatbot that helps customers buy.',
            15000,
            189,
            5,
          ),
          addon('AI & visual search', 'Search by text or image.', 12000, 149, 4),
          addon(
            'AI product descriptions',
            'Auto-generate SEO descriptions.',
            8000,
            99,
            3,
          ),
        ],
      },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    icon: 'phone',
    blurb: 'Android & iOS apps your customers will love to use.',
    billing: 'project',
    base: { INR: 90000, USD: 1199 },
    baseWeeks: 6,
    included: [
      'Single platform (Android or iOS)',
      'Up to 8 screens',
      'Standard UI design',
      'Basic backend & API',
      'Store submission',
    ],
    groups: [
      {
        title: 'Platform & design',
        addons: [
          addon('Add second platform', 'Build for both Android + iOS.', 70000, 899, 20),
          addon('Custom UI/UX design', 'Unique, branded interface.', 25000, 319, 8),
          addon('Extra screens (per 5)', 'More app screens.', 15000, 189, 5),
        ],
      },
      {
        title: 'Features',
        addons: [
          addon(
            'User login & social auth',
            'Email, Google, Apple sign-in.',
            12000,
            149,
            4,
          ),
          addon('Push notifications', 'Engage users with alerts.', 10000, 129, 3),
          addon('In-app payments', 'Razorpay / Stripe / IAP.', 18000, 229, 6),
          addon('Chat / messaging', 'In-app real-time chat.', 25000, 319, 8),
          addon('Maps & geolocation', 'Live location & maps.', 12000, 149, 4),
          addon('Admin dashboard', 'Manage app data & users.', 20000, 249, 7),
        ],
      },
      {
        title: 'Backend',
        addons: [
          addon('Custom backend & database', 'Scalable API + DB.', 30000, 379, 10),
          addon('Real-time features', 'Live updates / sockets.', 20000, 249, 7),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI in-app assistant',
            'Conversational AI inside your app.',
            20000,
            249,
            6,
          ),
          addon('AI personalization', 'Tailor content to each user.', 22000, 279, 7),
          addon(
            'AI image / voice features',
            'Image recognition or voice input.',
            18000,
            229,
            6,
          ),
        ],
      },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: 'search',
    blurb: 'Rank higher on Google and win more organic leads — monthly.',
    billing: 'monthly',
    base: { INR: 15000, USD: 199 },
    baseWeeks: null,
    included: [
      'Up to 10 target keywords',
      'On-page SEO',
      'Google Business Profile',
      'Technical audit',
      'Monthly report',
    ],
    groups: [
      {
        title: 'Scope',
        addons: [
          addon('+20 more keywords', 'Target a wider keyword set.', 10000, 129),
          addon('Multi-location SEO', 'Rank in multiple cities.', 15000, 189),
        ],
      },
      {
        title: 'Content & links',
        addons: [
          addon('Content (4 blogs / month)', 'SEO articles written for you.', 12000, 149),
          addon('Link building', 'Quality backlinks monthly.', 15000, 189),
          addon(
            'Competitor analysis',
            'Monthly report on what competitors changed and ranked for.',
            6000,
            79,
          ),
        ],
      },
      {
        title: 'Technical',
        addons: [
          addon(
            'Schema & rich results',
            'Structured data added and kept current as pages change.',
            5000,
            65,
          ),
          addon(
            'Core Web Vitals monitoring',
            'Speed tracked monthly, regressions fixed as they appear.',
            8000,
            99,
          ),
          addon('Conversion optimization', 'Turn traffic into leads.', 10000, 129),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon('AI content writing', 'AI-assisted SEO articles at scale.', 12000, 149),
          addon('AI keyword & topic research', 'Find winning topics with AI.', 8000, 99),
          addon('AI insights dashboard', 'AI-summarised ranking & traffic.', 10000, 129),
        ],
      },
    ],
  },
  {
    id: 'crm',
    label: 'Custom CRM',
    icon: 'users',
    blurb: 'Tailored CRM to capture, track and close more leads.',
    billing: 'project',
    base: { INR: 120000, USD: 1499 },
    baseWeeks: 7,
    included: [
      'Lead & contact management',
      'Deal pipeline',
      'User roles & permissions',
      'Dashboard',
      'Email integration',
    ],
    groups: [
      {
        title: 'Sales',
        addons: [
          addon('Quotations & invoicing', 'Create quotes & invoices.', 20000, 249, 7),
          addon('Sales automation', 'Workflows & reminders.', 25000, 319, 8),
          addon('Telephony / call logging', 'Click-to-call & logs.', 18000, 229, 6),
        ],
      },
      {
        title: 'Marketing',
        addons: [
          addon('Email campaigns', 'Bulk email & sequences.', 20000, 249, 7),
          addon('WhatsApp integration', 'Message leads on WhatsApp.', 15000, 189, 5),
          addon('Lead scoring', 'Prioritise hot leads.', 12000, 149, 4),
        ],
      },
      {
        title: 'Platform',
        addons: [
          addon('Mobile CRM app', 'CRM on the go.', 60000, 749, 20),
          addon('Custom reports & analytics', 'Tailored dashboards.', 18000, 229, 6),
          addon('Third-party integrations', 'Connect your tools.', 15000, 189, 5),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI lead scoring & insights',
            'Predict which leads will convert.',
            20000,
            249,
            6,
          ),
          addon(
            'AI email / reply assistant',
            'Draft replies & follow-ups with AI.',
            18000,
            229,
            6,
          ),
          addon('AI support chatbot', 'Automate customer support.', 20000, 249, 7),
        ],
      },
    ],
  },
  {
    id: 'erp',
    label: 'ERP',
    icon: 'layers',
    blurb: 'End-to-end ERP to run operations, finance and inventory.',
    billing: 'project',
    base: { INR: 250000, USD: 3199 },
    baseWeeks: 10,
    included: [
      'Inventory management',
      'Purchase & sales',
      'Basic accounting',
      'User roles',
      'Operations dashboard',
    ],
    groups: [
      {
        title: 'Operations',
        addons: [
          addon('Manufacturing / BOM', 'Production & bill of materials.', 60000, 749, 18),
          addon('Warehouse management', 'Multi-warehouse stock.', 40000, 499, 14),
          addon('Procurement workflows', 'Approvals & vendors.', 30000, 379, 10),
        ],
      },
      {
        title: 'Finance & HR',
        addons: [
          addon('Full accounting + GST', 'Ledgers, tax, compliance.', 45000, 569, 15),
          addon('Payroll & HR', 'Attendance, salary, leave.', 40000, 499, 14),
          addon('Asset management', 'Track company assets.', 25000, 319, 8),
        ],
      },
      {
        title: 'Platform',
        addons: [
          addon('Mobile app', 'ERP access on mobile.', 70000, 899, 20),
          addon('BI dashboards', 'Advanced analytics.', 30000, 379, 10),
          addon('API & integrations', 'Connect external systems.', 25000, 319, 8),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI demand forecasting',
            'Predict stock & sales with AI.',
            40000,
            499,
            12,
          ),
          addon(
            'AI document / invoice OCR',
            'Auto-read invoices & documents.',
            30000,
            379,
            10,
          ),
          addon('AI analytics assistant', 'Ask questions, get insights.', 25000, 319, 8),
        ],
      },
    ],
  },
  {
    id: 'uiux',
    label: 'UI/UX Design',
    icon: 'pen',
    blurb:
      'Design your product before it is built — screens, flows and a system your developers can use.',
    billing: 'project',
    base: { INR: 35000, USD: 449 },
    baseWeeks: 3,
    included: [
      'Up to 8 key screens',
      'Wireframes + high-fidelity design',
      'Mobile and desktop layouts',
      'Clickable Figma prototype',
      'Editable source files are yours',
    ],
    groups: [
      {
        title: 'Scope',
        addons: [
          addon(
            'Extra screens (per 5)',
            'More designed screens beyond the base 8.',
            12000,
            149,
            5,
          ),
          addon(
            'Tablet layouts',
            'A third breakpoint alongside mobile and desktop.',
            8000,
            99,
            3,
          ),
          addon('Dark mode variants', 'A second theme for every screen.', 10000, 129, 4),
        ],
      },
      {
        title: 'Research & testing',
        addons: [
          addon(
            'User research & interviews',
            'Talk to real users before design starts.',
            18000,
            229,
            7,
          ),
          addon(
            'UX audit of your current product',
            'What is losing you users today, and why.',
            15000,
            189,
            5,
          ),
          addon(
            'Usability testing round',
            'Five users walk through the prototype.',
            14000,
            179,
            5,
          ),
        ],
      },
      {
        title: 'Handover',
        addons: [
          addon(
            'Design system & components',
            'Reusable library so future screens stay consistent.',
            22000,
            279,
            8,
          ),
          addon(
            'Brand & logo design',
            'Logo, colours, type and usage rules.',
            20000,
            249,
            8,
          ),
          addon(
            'Developer handoff pack',
            'Specs, tokens and assets your devs can build from.',
            9000,
            119,
            3,
          ),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI-assisted UX copy',
            'Draft labels, empty states and error text.',
            8000,
            99,
            3,
          ),
          addon(
            'AI design variations',
            'Several directions per screen to choose from.',
            10000,
            129,
            4,
          ),
        ],
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    icon: 'cloud',
    blurb: 'Keep your servers fast, secure and monitored — managed month to month.',
    billing: 'monthly',
    base: { INR: 22000, USD: 279 },
    baseWeeks: null,
    included: [
      'Server setup & hardening',
      'Daily automated backups',
      'Uptime & error monitoring',
      'SSL and security patching',
      'Monthly health report',
    ],
    groups: [
      {
        title: 'Infrastructure',
        addons: [
          addon(
            'Cloud migration',
            'Move an existing app onto AWS, GCP or Azure.',
            20000,
            249,
          ),
          addon(
            'Additional environment',
            'A separate staging or test environment.',
            9000,
            119,
          ),
          addon(
            'Auto-scaling & load balancing',
            'Handle traffic spikes without going down.',
            15000,
            189,
          ),
          addon(
            'CDN & caching layer',
            'Faster delivery for visitors outside your region.',
            7000,
            89,
          ),
        ],
      },
      {
        title: 'Reliability',
        addons: [
          addon(
            'High availability setup',
            'Redundant servers so one failure is not an outage.',
            25000,
            319,
          ),
          addon(
            'Disaster recovery plan',
            'Tested restore path with a defined recovery time.',
            12000,
            149,
          ),
          addon(
            '24/7 on-call support',
            'Someone reachable outside business hours.',
            30000,
            379,
          ),
        ],
      },
      {
        title: 'Security & delivery',
        addons: [
          addon(
            'WAF & DDoS protection',
            'Filter malicious traffic before it reaches you.',
            10000,
            129,
          ),
          addon(
            'Security audit & hardening',
            'Quarterly review with a written report.',
            14000,
            179,
          ),
          addon(
            'CI/CD pipeline',
            'Automated tests and deploys on every push.',
            13000,
            165,
          ),
        ],
      },
      {
        title: 'AI features',
        ai: true,
        addons: [
          addon(
            'AI anomaly detection',
            'Flags unusual traffic or error patterns early.',
            12000,
            149,
          ),
          addon(
            'AI cost optimisation',
            'Finds idle resources and suggests cuts monthly.',
            9000,
            119,
          ),
        ],
      },
    ],
  },
]

export const currencies = ['INR', 'USD']

const formatters = {
  INR: new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
}

export function formatMoney(value, currency) {
  return formatters[currency].format(Math.round(value))
}

export function getProjectType(id) {
  return projectTypes.find((type) => type.id === id) ?? projectTypes[0]
}

/**
 * Pure quote calculation — safe to call during render.
 * @param {string} typeId
 * @param {readonly string[]} addonIds
 * @param {'INR' | 'USD'} currency
 */
export function calculateQuote(typeId, addonIds, currency) {
  const type = getProjectType(typeId)
  const chosen = new Set(addonIds)
  const lines = []
  let addonsTotal = 0
  let days = 0

  for (const group of type.groups) {
    for (const item of group.addons) {
      if (!chosen.has(item.id)) continue
      lines.push(item)
      addonsTotal += item.price[currency]
      days += item.days
    }
  }

  const base = type.base[currency]
  const monthly = type.billing === 'monthly'

  return {
    type,
    currency,
    base,
    lines,
    addonsTotal,
    total: base + addonsTotal,
    /** INR total, regardless of display currency — used for budget banding. */
    totalINR: type.base.INR + lines.reduce((sum, item) => sum + item.price.INR, 0),
    monthly,
    weeks: monthly ? null : Math.ceil((type.baseWeeks * 5 + days) / 5),
  }
}

/** Human-readable timeline for a calculated quote. */
export function describeTimeline(quote) {
  return quote.monthly ? 'Ongoing · monthly retainer' : `≈ ${quote.weeks} weeks`
}
