/**
 * Pricing tier catalog — four service categories, three tiers each.
 *
 * Data mirrors the live idmvalley.com pricing page (captured 2026-09-21).
 * Each tier has a name, tagline, price, billing unit, features list,
 * free inclusions, a "most popular" flag, and a border accent colour.
 *
 * Accent palette (light-theme safe):
 *   Starter  — amber  #F59E0B  warm contrast on white
 *   Popular  — violet #7C3AED  punchy mid-tone
 *   Premium  — cyan   #0891B2  matches brand neon family
 */

const tier = (name, tagline, priceINR, unit, features, free, popular = false) => ({
  name,
  tagline,
  priceINR,
  unit,
  features,
  free,
  popular,
})

export const pricingCategories = [
  {
    id: 'web',
    label: 'Website Development',
    tiers: [
      tier(
        'Starter',
        'Launch a clean, professional site fast',
        25000,
        'project',
        [
          'Up to 5 responsive pages',
          'Mobile & tablet friendly design',
          'Easy-to-edit content (CMS)',
          'Basic on-page SEO setup',
          'Contact form + WhatsApp button',
        ],
        ['1 year hosting', 'Free domain (1st year)', 'Free SSL security'],
      ),
      tier(
        'Business',
        'For growing brands that need more',
        65000,
        'project',
        [
          'Up to 15 custom-designed pages',
          'Unique UI/UX (no templates)',
          'Blog + full CMS',
          'Advanced SEO & speed optimisation',
          'Lead forms + Google Analytics',
          'Payment / booking integration',
        ],
        ['1 year hosting', 'Free domain (1st year)', 'Free SSL', '3 months free support'],
        true,
      ),
      tier(
        'Premium',
        'Custom web app, built to scale',
        150000,
        'project',
        [
          'Unlimited pages or custom web app',
          'Fully custom design system',
          'Headless CMS / admin dashboard',
          'E-commerce ready',
          'Priority SEO & Core Web Vitals',
          'API & third-party integrations',
        ],
        ['1 year hosting', 'Free domain', 'Free SSL', '6 months support & maintenance'],
      ),
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile Application',
    tiers: [
      tier(
        'Starter',
        'A solid single-platform MVP',
        90000,
        'project',
        [
          'Android OR iOS app',
          'Up to 8 screens',
          'Clean standard UI design',
          'Basic backend & API',
          'Play Store / App Store submission',
        ],
        ['App icon & splash screen', '3 months bug-fix support'],
      ),
      tier(
        'Growth',
        'Both platforms, ready to grow',
        180000,
        'project',
        [
          'Android + iOS (cross-platform)',
          'Up to 20 screens',
          'Custom UI/UX design',
          'Login, payments & push notifications',
          'Admin dashboard',
          'Submission to both stores',
        ],
        ['App icon & splash', 'Analytics setup', '4 months free support'],
        true,
      ),
      tier(
        'Enterprise',
        'High-performance, fully custom apps',
        350000,
        'project',
        [
          'Native Android + iOS',
          'Unlimited screens & modules',
          'Custom backend & APIs',
          'Real-time features & integrations',
          'Scalable cloud architecture',
          'Admin + analytics dashboard',
        ],
        ['UI/UX design system', 'CI/CD setup', '6 months support & updates'],
      ),
    ],
  },
  {
    id: 'server',
    label: 'Server',
    tiers: [
      tier(
        'Basic',
        'Perfect for a single website',
        4000,
        'month',
        [
          '1 vCPU · 2 GB RAM · 40 GB SSD',
          'Host 1 website',
          'Daily automated backups',
          'Free SSL certificate',
          '99.9% uptime guarantee',
        ],
        ['Setup & migration', 'Basic uptime monitoring'],
      ),
      tier(
        'Pro',
        'For growing teams & multiple apps',
        9000,
        'month',
        [
          '4 vCPU · 8 GB RAM · 160 GB SSD',
          'Host up to 10 sites / apps',
          'Daily backups + 1-click restore',
          'CDN + caching for speed',
          'Staging environment',
          'Email & uptime monitoring',
        ],
        ['Setup & migration', 'Security hardening', 'Monthly maintenance'],
        true,
      ),
      tier(
        'Managed Cloud',
        'Fully managed, auto-scaling cloud',
        22000,
        'month',
        [
          '8 vCPU · 16 GB RAM · 320 GB SSD',
          'Unlimited sites / apps',
          'Auto-scaling & load balancing',
          'Hourly backups',
          '24/7 monitoring & alerts',
          'Dedicated DevOps support',
        ],
        ['Migration & setup', 'CI/CD pipeline', 'Priority SLA support'],
      ),
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    tiers: [
      tier(
        'Starter',
        'Get found by local customers',
        15000,
        'month',
        [
          'Up to 10 target keywords',
          'On-page SEO optimisation',
          'Google Business Profile setup',
          'Technical SEO audit',
          'Monthly performance report',
        ],
        ['Keyword research', 'Search Console setup'],
      ),
      tier(
        'Growth',
        'Rank higher & win more leads',
        35000,
        'month',
        [
          'Up to 30 target keywords',
          'On-page + technical SEO',
          'Content strategy (4 blogs / month)',
          'Quality link building',
          'Competitor analysis',
          'Bi-weekly reporting',
        ],
        ['Keyword & competitor research', 'Analytics + Search Console setup'],
        true,
      ),
      tier(
        'Enterprise',
        'Aggressive, multi-location growth',
        75000,
        'month',
        [
          '75+ keywords / multi-location',
          'Full technical + on-page SEO',
          'Content (8+ blogs / month)',
          'Authority link building',
          'Conversion rate optimisation',
          'Dedicated SEO strategist',
        ],
        ['Full SEO audit', 'Custom dashboard & weekly reports'],
      ),
    ],
  },
]

/** Accent colour per tier position — light-theme safe, high contrast on white. */
export const TIER_ACCENTS = [
  { border: '#F59E0B', text: '#B45309', bg: 'rgba(245,158,11,0.06)' }, // Starter — amber
  { border: '#7C3AED', text: '#5B21B6', bg: 'rgba(124,58,237,0.07)' }, // Popular — violet
  { border: '#0891B2', text: '#0E7490', bg: 'rgba(8,145,178,0.06)' }, // Premium — cyan
]
