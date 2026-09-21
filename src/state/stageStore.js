/**
 * Stage store — the bridge between DOM scroll and the WebGL render loop.
 *
 * Three deliberately separate read paths:
 *
 *  1. `stage` is a mutable singleton read DIRECTLY inside useFrame. It is
 *     never touched during React render, so it costs zero re-renders and
 *     zero allocations on the 120 FPS hot path.
 *  2. `subscribeStage` / `getStageSnapshot` — the *stage* snapshot: active
 *     section, selected service layer, reduced motion. Anything that changes
 *     what the 3D asset does.
 *  3. `subscribeQuote` / `getQuoteSnapshot` — the *quote* snapshot: the
 *     calculator's project type, selected add-ons and display currency.
 *  4. `subscribeQuoteRequest` / `getQuoteRequestSnapshot` — a one-shot
 *     "send me this quote" hand-off to the contact form. Kept apart from (3)
 *     so the contact form is not re-rendered by every add-on toggle.
 *
 * The two snapshots are split on purpose. They used to be one object, which
 * meant every click in the pricing calculator re-rendered FocalModels and
 * the navbar for nothing. Now a quote change notifies only the Pricing
 * subtree, and the WebGL component is never re-rendered by the calculator at
 * all — the render loop keeps running undisturbed.
 *
 * Each snapshot is rebuilt only when a discrete value actually changes, so
 * referential equality holds and useSyncExternalStore bails out of no-op
 * renders. Nothing here mutates React state or refs during render, which
 * keeps the react-hooks purity/immutability rules satisfied.
 */

import { projectTypes } from '../data/quoteCatalog'
import { sections } from '../data/siteContent'

export const SECTION_COUNT = sections.length
const LAST_SECTION = SECTION_COUNT - 1
const LAST_SERVICE = 3

/** Hot-path state. Read from useFrame; never read during React render. */
export const stage = {
  /** Normalised document scroll, 0 -> 1 across the whole page. */
  progress: 0,
  /** Continuous position on the section timeline, 0 -> SECTION_COUNT - 1. */
  timeline: 0,
  /** Nearest whole section index. */
  sectionIndex: 0,
  /** Currently selected service card, 0 -> 3. Drives the status layers. */
  serviceIndex: 0,
  /** Honoured by every animated subsystem. */
  reducedMotion: false,
  /** Contact form state — 'idle' | 'invalid' | 'submitting' | 'sent'.
   *  Hot path only: the paper plane reads it in useFrame. */
  contactStatus: 'idle',
  /** Hero carousel slide, 0 -> 3 (Mobile, Website, Marketing, CloudOps). */
  heroSlide: 0,
}

/* ------------------------------------------------------------------ *
 * Stage snapshot
 * ------------------------------------------------------------------ */

const stageListeners = new Set()

let stageSnapshot = {
  sectionIndex: 0,
  sectionId: sections[0].id,
  serviceIndex: 0,
  reducedMotion: false,
}

const stageServerSnapshot = stageSnapshot

export function subscribeStage(listener) {
  stageListeners.add(listener)
  return () => {
    stageListeners.delete(listener)
  }
}

export function getStageSnapshot() {
  return stageSnapshot
}

export function getStageServerSnapshot() {
  return stageServerSnapshot
}

function commitStage() {
  stageSnapshot = {
    sectionIndex: stage.sectionIndex,
    sectionId: sections[stage.sectionIndex].id,
    serviceIndex: stage.serviceIndex,
    reducedMotion: stage.reducedMotion,
  }
  for (const listener of stageListeners) listener()
}

/* ------------------------------------------------------------------ *
 * Quote snapshot — the Project Quote Calculator
 * ------------------------------------------------------------------ */

const quoteListeners = new Set()

/** Frozen, so a snapshot can never be mutated out from under React. */
let quoteSnapshot = Object.freeze({
  typeId: projectTypes[0].id,
  addons: Object.freeze([]),
  currency: 'INR',
})

const quoteServerSnapshot = quoteSnapshot

export function subscribeQuote(listener) {
  quoteListeners.add(listener)
  return () => {
    quoteListeners.delete(listener)
  }
}

export function getQuoteSnapshot() {
  return quoteSnapshot
}

export function getQuoteServerSnapshot() {
  return quoteServerSnapshot
}

function commitQuote(next) {
  quoteSnapshot = Object.freeze({ ...quoteSnapshot, ...next })
  for (const listener of quoteListeners) listener()
}

/* ------------------------------------------------------------------ *
 * Quote request — one-shot hand-off to the contact form
 * ------------------------------------------------------------------ */

const requestListeners = new Set()

let requestSnapshot = Object.freeze({ nonce: 0, message: '', budgetIndex: -1 })
const requestServerSnapshot = requestSnapshot

export function subscribeQuoteRequest(listener) {
  requestListeners.add(listener)
  return () => {
    requestListeners.delete(listener)
  }
}

export function getQuoteRequestSnapshot() {
  return requestSnapshot
}

export function getQuoteRequestServerSnapshot() {
  return requestServerSnapshot
}

/* ------------------------------------------------------------------ *
 * Writers
 * ------------------------------------------------------------------ */

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)
const clamp = (n, max) => (n < 0 ? 0 : n > max ? max : n)

/**
 * Hot-path write from the scroll listener. Deliberately commits nothing to
 * React — the discrete section is owned by useActivePage's observer, so the
 * two never fight over the same value.
 * @param {number} timeline continuous position, 0 -> SECTION_COUNT - 1
 */
export function setTimeline(timeline) {
  const t = clamp(timeline, LAST_SECTION)
  stage.timeline = t
  stage.progress = LAST_SECTION === 0 ? 0 : clamp01(t / LAST_SECTION)
}

/** Called by the IntersectionObserver in useActivePage. */
export function setSectionIndex(index) {
  const next = clamp(index, LAST_SECTION)
  if (next === stage.sectionIndex) return
  stage.sectionIndex = next
  commitStage()
}

export function setServiceIndex(index) {
  const next = clamp(index, LAST_SERVICE)
  if (next === stage.serviceIndex) return
  stage.serviceIndex = next
  commitStage()
}

export function setReducedMotion(value) {
  if (value === stage.reducedMotion) return
  stage.reducedMotion = value
  commitStage()
}

/** Switching project type clears add-ons: they belong to one type only. */
export function setProjectType(typeId) {
  if (typeId === quoteSnapshot.typeId) return
  if (!projectTypes.some((type) => type.id === typeId)) return
  commitQuote({ typeId, addons: Object.freeze([]) })
}

export function toggleAddon(addonId) {
  const current = quoteSnapshot.addons
  const next = current.includes(addonId)
    ? current.filter((id) => id !== addonId)
    : [...current, addonId]
  commitQuote({ addons: Object.freeze(next) })
}

export function clearAddons() {
  if (quoteSnapshot.addons.length === 0) return
  commitQuote({ addons: Object.freeze([]) })
}

export function setCurrency(currency) {
  if (currency === quoteSnapshot.currency) return
  if (currency !== 'INR' && currency !== 'USD') return
  commitQuote({ currency })
}

/**
 * Hand the current quote to the contact form. The nonce lets the form tell
 * a fresh request from one it has already applied.
 * @param {{ message: string, budgetIndex: number }} request
 */
export function sendQuoteRequest(request) {
  requestSnapshot = Object.freeze({ ...request, nonce: requestSnapshot.nonce + 1 })
  for (const listener of requestListeners) listener()
}

/** Mirrors the contact form's submit state for the 3D paper plane. */
export function setContactStatus(status) {
  stage.contactStatus = status
}

/* ------------------------------------------------------------------ *
 * Hero carousel — its own channel, because it ticks every 3.5 s and
 * nothing outside the hero should re-render on that beat. The 3D scenes
 * read stage.heroSlide directly; only the hero copy subscribes here.
 * ------------------------------------------------------------------ */
export const HERO_SLIDES = 4

const heroListeners = new Set()

export function subscribeHero(listener) {
  heroListeners.add(listener)
  return () => {
    heroListeners.delete(listener)
  }
}

export function getHeroSlide() {
  return stage.heroSlide
}

export function setHeroSlide(index) {
  const next = ((index % HERO_SLIDES) + HERO_SLIDES) % HERO_SLIDES
  if (next === stage.heroSlide) return
  stage.heroSlide = next
  for (const listener of heroListeners) listener()
}
