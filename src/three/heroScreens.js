/**
 * Canvas painters for the hero's 3D surfaces: the phone's app UI, the iMac's
 * website, and the pill labels that float around each scene.
 *
 * Everything is drawn with the 2D canvas API at 2x density and uploaded once
 * as a texture — no image files, no network, crisp at any zoom the hero uses.
 * Text uses the system UI stack, matching the page's fallback fonts.
 */
import { CanvasTexture, SRGBColorSpace } from 'three'

const DENIM = '#0D47C7'
const NEON = '#22D3EE'
const INK = '#111111'
const BODY = '#444444'
const MUTED = '#8A93A3'
const RULE = '#E6E8EC'
const SOFT = '#EEF3FF'
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif'

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

function text(g, str, x, y, { size, weight = 600, color = INK, align = 'left' }) {
  g.font = `${weight} ${size}px ${FONT}`
  g.fillStyle = color
  g.textAlign = align
  g.textBaseline = 'alphabetic'
  g.fillText(str, x, y)
}

function toTexture(canvas, { flipY = true } = {}) {
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.flipY = flipY
  tex.anisotropy = 8
  return tex
}

/* ------------------------------------------------------------------ *
 * Phone — a light client-app dashboard.
 *
 * Painted upright, then flipped vertically before upload: the iPhone
 * model's screen UVs run bottom-up (verified with an orientation card), and
 * its own KHR_texture_transform is copied onto this texture at runtime.
 * The top ~7% is left clear for the Dynamic Island.
 * ------------------------------------------------------------------ */
export function phoneScreenTexture() {
  const W = 1024
  const H = 2048
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')

  g.fillStyle = '#F7F9FD'
  g.fillRect(0, 0, W, H)

  // Status bar
  text(g, '9:41', 96, 118, { size: 46, weight: 700 })
  g.fillStyle = INK
  roundRect(g, W - 190, 88, 80, 36, 10)
  g.fill()

  // Header
  text(g, 'Welcome back', 80, 290, { size: 44, weight: 500, color: MUTED })
  text(g, 'Your dashboard', 80, 364, { size: 72, weight: 800 })
  g.fillStyle = DENIM
  g.beginPath()
  g.arc(W - 130, 316, 58, 0, Math.PI * 2)
  g.fill()
  text(g, 'IV', W - 130, 336, { size: 50, weight: 800, color: '#fff', align: 'center' })

  // Hero card — denim -> cyan
  const grad = g.createLinearGradient(80, 440, W - 80, 820)
  grad.addColorStop(0, DENIM)
  grad.addColorStop(1, '#06B6D4')
  g.fillStyle = grad
  roundRect(g, 80, 440, W - 160, 380, 56)
  g.fill()
  text(g, 'Project progress', 140, 540, {
    size: 42,
    weight: 600,
    color: 'rgba(255,255,255,0.85)',
  })
  text(g, '78%', 140, 660, { size: 120, weight: 800, color: '#fff' })
  g.fillStyle = 'rgba(255,255,255,0.25)'
  roundRect(g, 140, 720, W - 280, 26, 13)
  g.fill()
  g.fillStyle = '#fff'
  roundRect(g, 140, 720, (W - 280) * 0.78, 26, 13)
  g.fill()

  // Stat tiles
  const tiles = [
    ['Orders', '1,284', DENIM],
    ['Growth', '+23%', '#0891B2'],
  ]
  tiles.forEach(([label, value, color], i) => {
    const x = 80 + i * ((W - 160) / 2 + 20)
    const w = (W - 160) / 2 - 20
    g.fillStyle = '#fff'
    roundRect(g, x, 870, w, 250, 44)
    g.fill()
    g.strokeStyle = RULE
    g.lineWidth = 3
    g.stroke()
    text(g, label, x + 50, 950, { size: 40, weight: 500, color: MUTED })
    text(g, value, x + 50, 1060, { size: 84, weight: 800, color })
  })

  // Activity list
  text(g, 'Recent activity', 80, 1220, { size: 48, weight: 700 })
  const rows = [
    ['New order received', '2 min ago', DENIM],
    ['Campaign published', '1 hr ago', '#0891B2'],
    ['Payment settled', 'Today', '#4F46E5'],
  ]
  rows.forEach(([title, meta, color], i) => {
    const y = 1270 + i * 180
    g.fillStyle = '#fff'
    roundRect(g, 80, y, W - 160, 150, 40)
    g.fill()
    g.fillStyle = color
    g.globalAlpha = 0.14
    g.beginPath()
    g.arc(170, y + 75, 46, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
    g.beginPath()
    g.arc(170, y + 75, 18, 0, Math.PI * 2)
    g.fill()
    text(g, title, 250, y + 68, { size: 42, weight: 600 })
    text(g, meta, 250, y + 118, { size: 34, weight: 500, color: MUTED })
  })

  // Tab bar
  g.fillStyle = '#fff'
  roundRect(g, 60, H - 240, W - 120, 150, 75)
  g.fill()
  for (let i = 0; i < 4; i += 1) {
    const x = 60 + ((W - 120) / 4) * (i + 0.5)
    g.fillStyle = i === 0 ? DENIM : '#C9D2E3'
    roundRect(g, x - 26, H - 191, 52, 52, 16)
    g.fill()
  }

  // Flip vertically for the model's bottom-up UVs.
  const flipped = makeCanvas(W, H)
  const fg = flipped.getContext('2d')
  fg.translate(0, H)
  fg.scale(1, -1)
  fg.drawImage(c, 0, 0)
  return toTexture(flipped, { flipY: false })
}

/* ------------------------------------------------------------------ *
 * iMac — a light marketing site in a browser, with the live site's own
 * "www.yourwebsite.com" address bar. Aspect matches the fitted screen
 * plane (0.724 x 0.406).
 * ------------------------------------------------------------------ */
export const MONITOR_SCREEN = {
  x: 0,
  y: 0.1015,
  z: 0.0304,
  w: 0.724,
  h: 0.406,
  tilt: 0.1391,
}

export function websiteTexture() {
  const W = 2048
  const H = Math.round(W * (MONITOR_SCREEN.h / MONITOR_SCREEN.w))
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')

  g.fillStyle = '#FBFBFB'
  g.fillRect(0, 0, W, H)

  // Browser chrome
  g.fillStyle = '#F1F3F7'
  g.fillRect(0, 0, W, 96)
  ;['#FF5F57', '#FEBC2E', '#28C840'].forEach((color, i) => {
    g.fillStyle = color
    g.beginPath()
    g.arc(52 + i * 40, 48, 13, 0, Math.PI * 2)
    g.fill()
  })
  g.fillStyle = '#fff'
  roundRect(g, W / 2 - 360, 22, 720, 52, 26)
  g.fill()
  text(g, 'www.yourwebsite.com', W / 2, 58, {
    size: 26,
    weight: 500,
    color: BODY,
    align: 'center',
  })

  // Site nav
  text(g, 'yourbrand', 110, 190, { size: 38, weight: 800, color: DENIM })
  ;['Product', 'Solutions', 'Pricing', 'About'].forEach((label, i) => {
    text(g, label, 760 + i * 170, 186, { size: 26, weight: 500, color: BODY })
  })
  g.fillStyle = INK
  roundRect(g, W - 290, 150, 180, 56, 28)
  g.fill()
  text(g, 'Get started', W - 200, 187, {
    size: 24,
    weight: 600,
    color: '#fff',
    align: 'center',
  })

  // Hero copy
  g.fillStyle = SOFT
  roundRect(g, 110, 290, 250, 44, 22)
  g.fill()
  text(g, 'NEW  ·  Launch faster', 235, 320, {
    size: 20,
    weight: 700,
    color: DENIM,
    align: 'center',
  })
  text(g, 'Your brand,', 110, 450, { size: 96, weight: 800 })
  text(g, 'beautifully built.', 110, 560, { size: 96, weight: 800, color: DENIM })
  text(g, 'Fast, responsive websites that turn visitors into customers.', 110, 640, {
    size: 30,
    weight: 400,
    color: BODY,
  })
  g.fillStyle = DENIM
  roundRect(g, 110, 700, 250, 76, 38)
  g.fill()
  text(g, 'Start a project', 235, 748, {
    size: 28,
    weight: 600,
    color: '#fff',
    align: 'center',
  })
  g.strokeStyle = '#C9D2E3'
  g.lineWidth = 3
  roundRect(g, 385, 700, 220, 76, 38)
  g.stroke()
  text(g, 'See work', 495, 748, { size: 28, weight: 600, color: INK, align: 'center' })

  // Hero visual
  const grad = g.createLinearGradient(1180, 280, W - 110, 800)
  grad.addColorStop(0, DENIM)
  grad.addColorStop(1, NEON)
  g.fillStyle = grad
  roundRect(g, 1180, 280, W - 1290, 520, 40)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.92)'
  roundRect(g, 1240, 340, 360, 200, 26)
  g.fill()
  text(g, 'Conversions', 1280, 400, { size: 26, weight: 500, color: MUTED })
  text(g, '+48%', 1280, 490, { size: 72, weight: 800, color: DENIM })
  g.fillStyle = 'rgba(255,255,255,0.35)'
  ;[0.45, 0.7, 0.55, 0.9, 0.75].forEach((v, i) => {
    const bh = 200 * v
    roundRect(g, 1660 + i * 52, 740 - bh, 34, bh, 10)
    g.fill()
  })

  // Feature strip
  ;['Responsive', 'SEO-ready', 'Lightning fast'].forEach((label, i) => {
    const x = 110 + i * 620
    g.fillStyle = '#fff'
    roundRect(g, x, 880, 580, 150, 28)
    g.fill()
    g.strokeStyle = RULE
    g.lineWidth = 2
    g.stroke()
    g.fillStyle = SOFT
    roundRect(g, x + 36, 925, 60, 60, 16)
    g.fill()
    text(g, label, x + 124, 968, { size: 32, weight: 700 })
  })

  return toTexture(c)
}

/* ------------------------------------------------------------------ *
 * Icons for labels — simple strokes on a 24-unit grid.
 * ------------------------------------------------------------------ */
const ICONS = {
  seo: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M20 20l-4.8-4.8',
  content: 'M4 20l4.5-1l10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20',
  email: 'M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5l8.5-6.5',
  analytics: 'M5 19V11M10 19V6M15 19v-9M20 19V4',
  video: 'M7 5l12 7l-12 7z',
  ads: 'M4 10v4h3l7 4V6L7 10zM17.5 9.5a3.5 3.5 0 0 1 0 5',
  deploy:
    'M12 3c3 2.5 4.5 6 4.5 10l-2 3h-5l-2-3c0-4 1.5-7.5 4.5-10M9.5 16l-2 4M14.5 16l2 4',
  scale: 'M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7',
  monitor: 'M3 12h4l2.5-6l4 12l2.5-6H21',
  secure: 'M12 3l7 3v6c0 4.5-3 7.5-7 9c-4-1.5-7-4.5-7-9V6z',
}

/**
 * A floating pill label: icon chip + text, on a white card with a soft rim.
 * Returns the texture and the pill's aspect ratio so the caller can size
 * its plane without distortion.
 */
export function labelTexture(label, { icon, accent = DENIM } = {}) {
  const H = 112
  const pad = 30
  const chip = icon ? 72 : 0
  const measure = makeCanvas(8, 8).getContext('2d')
  measure.font = `700 40px ${FONT}`
  const textW = measure.measureText(label).width
  const W = Math.ceil(pad * 2 + chip + (icon ? 22 : 0) + textW)
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')

  g.fillStyle = '#ffffff'
  roundRect(g, 2, 2, W - 4, H - 4, (H - 4) / 2)
  g.fill()
  g.strokeStyle = 'rgba(13,71,199,0.18)'
  g.lineWidth = 3
  g.stroke()

  let x = pad
  if (icon) {
    g.fillStyle = accent
    roundRect(g, x, (H - chip) / 2, chip, chip, 22)
    g.fill()
    g.save()
    g.translate(x + chip / 2 - 21, H / 2 - 21)
    g.scale(42 / 24, 42 / 24)
    g.strokeStyle = '#fff'
    g.lineWidth = 2.1
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.stroke(new Path2D(ICONS[icon]))
    g.restore()
    x += chip + 22
  }
  text(g, label, x, H / 2 + 14, { size: 40, weight: 700 })
  return { texture: toTexture(c), aspect: W / H }
}

/* ------------------------------------------------------------------ *
 * Platform badges for the Mobile scene — the same marks the live site
 * uses: a simplified Android head, and the Apple glyph.
 * ------------------------------------------------------------------ */
const APPLE_PATH =
  'M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81-105.6-207-105.6-326.4 0-192 124.7-293.8 247.4-293.8 65.2 0 119.5 42.8 160.4 42.8 39.6 0 101.1-45.4 175.5-45.4 28.3 0 130.2 2.6 197.3 99.2zm-234.7-181.5c31.4-36.5 53.4-87.5 53.4-138.5 0-7.1-.6-14.3-1.9-20.1-50.9 1.9-110.7 33.9-147 75.8-28.4 32.4-56.2 83.4-56.2 135.1 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.6 0 103.2-30.6 136.2-71.7z'

export function platformTexture(platform) {
  const H = 132
  const label = platform === 'android' ? 'ANDROID' : 'iOS'
  const measure = makeCanvas(8, 8).getContext('2d')
  measure.font = `800 42px ${FONT}`
  const W = Math.ceil(36 + 84 + 24 + measure.measureText(label).width + 40)
  const c = makeCanvas(W, H)
  const g = c.getContext('2d')

  g.fillStyle = '#ffffff'
  roundRect(g, 2, 2, W - 4, H - 4, (H - 4) / 2)
  g.fill()
  g.strokeStyle = 'rgba(13,71,199,0.18)'
  g.lineWidth = 3
  g.stroke()

  const cx = 36
  const cy = (H - 84) / 2
  if (platform === 'android') {
    g.fillStyle = '#3DDC84'
    roundRect(g, cx, cy + 18, 84, 56, 26)
    g.fill()
    g.strokeStyle = '#3DDC84'
    g.lineWidth = 6
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(cx + 22, cy + 20)
    g.lineTo(cx + 12, cy + 4)
    g.moveTo(cx + 62, cy + 20)
    g.lineTo(cx + 72, cy + 4)
    g.stroke()
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(cx + 28, cy + 44, 6, 0, Math.PI * 2)
    g.arc(cx + 56, cy + 44, 6, 0, Math.PI * 2)
    g.fill()
  } else {
    g.fillStyle = INK
    roundRect(g, cx, cy, 84, 84, 24)
    g.fill()
    g.save()
    g.translate(cx + 20, cy + 14)
    g.scale(44 / 814, 44 / 814)
    g.fillStyle = '#fff'
    g.fill(new Path2D(APPLE_PATH))
    g.restore()
  }
  text(g, label, cx + 84 + 24, H / 2 + 15, { size: 42, weight: 800 })
  return { texture: toTexture(c), aspect: W / H }
}
