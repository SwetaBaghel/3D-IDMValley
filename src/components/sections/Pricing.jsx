import { useCallback, useState, useSyncExternalStore } from 'react'
import { createPortal, flushSync } from 'react-dom'
import {
  calculateQuote,
  currencies,
  describeTimeline,
  formatMoney,
  getProjectType,
  projectTypes,
} from '../../data/quoteCatalog'
import { contact } from '../../data/siteContent'
import {
  clearAddons,
  getQuoteServerSnapshot,
  getQuoteSnapshot,
  sendQuoteRequest,
  setCurrency,
  setProjectType,
  subscribeQuote,
  toggleAddon,
} from '../../state/stageStore'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

/* ------------------------------------------------------------------ *
 * Icons — inline stroke SVGs, one per project type. No icon library:
 * eight glyphs do not justify a dependency.
 * ------------------------------------------------------------------ */
const ICON_PATHS = {
  globe:
    'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3.6 9h16.8M3.6 15h16.8M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3',
  cart: 'M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6M9 20.5a1 1 0 1 0 0-.01M17 20.5a1 1 0 1 0 0-.01',
  phone:
    'M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3M11 18h2',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-4-4',
  users:
    'M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.3c1.8.8 3 2.6 3 4.7',
  layers: 'M12 3l9 5l-9 5l-9-5l9-5M3 13l9 5l9-5M3 17.5l9 5l9-5',
  pen: 'M4 20l4.5-1l10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20M13.5 7.5l3 3',
  cloud: 'M7 18h10.5a4 4 0 0 0 .6-8a6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18',
}

function Icon({ name, className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

function Check({ className = 'size-3' }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Quote helpers
 * ------------------------------------------------------------------ */

/** Contact-form budget band for an INR amount. Index into contact.budgetOptions. */
function budgetIndexFor(totalINR) {
  if (totalINR < 100000) return 0
  if (totalINR < 500000) return 1
  if (totalINR < 1500000) return 2
  return 3
}

/** The contact form's "Interested in" pillar for a project type. */
const SERVICE_FOR_TYPE = {
  seo: 'Digital Marketing',
  cloud: 'CloudOps',
}

function priceSuffix(quote) {
  return quote.monthly ? ' / month' : ''
}

/** Plain-text quote, used for the contact hand-off. */
function quoteToText(quote) {
  const money = (value) => formatMoney(value, quote.currency)
  const lines = [
    `Project quote — ${quote.type.label}`,
    `Base: ${money(quote.base)}${priceSuffix(quote)}`,
    ...quote.lines.map((item) => `+ ${item.label}: ${money(item.price[quote.currency])}`),
    `Estimated total: ${money(quote.total)}${priceSuffix(quote)} · ${describeTimeline(quote)}`,
  ]
  return lines.join('\n')
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

function TypeCard({ type, active, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-type={type.id}
      onClick={onSelect}
      className={`gpu-hover group flex h-full flex-col rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-300 sm:p-5 ${
        active
          ? 'border-signal/50 bg-snow-raised shadow-lift-lg'
          : 'border-rule bg-snow-raised/70 hover:-translate-y-0.5 hover:border-signal/30'
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={`grid size-10 place-items-center rounded-xl transition-colors duration-300 ${
            active
              ? 'bg-gradient-to-br from-signal to-neon-mid text-white'
              : 'bg-signal-soft text-signal'
          }`}
        >
          <Icon name={type.icon} />
        </span>
        {type.billing === 'monthly' ? (
          <span className="rounded-full bg-neon-soft px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-neon-ink uppercase">
            Monthly
          </span>
        ) : null}
      </span>
      <span className="mt-4 font-display text-[15px] font-semibold text-ink">
        {type.label}
      </span>
      <span className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">
        {type.blurb}
      </span>
      <span className="mt-auto pt-3 font-mono text-[11.5px] text-body">
        from {formatMoney(type.base.INR, 'INR')}
        {type.billing === 'monthly' ? '/mo' : ''}
      </span>
    </button>
  )
}

function AddonToggle({ item, on, currency, monthly, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-addon={item.id}
      onClick={onToggle}
      className={`gpu-hover flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color] duration-200 ${
        on
          ? 'border-signal/40 bg-signal-soft'
          : 'border-rule bg-snow hover:border-signal/25'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-[5px] border text-white transition-colors duration-200 ${
          on ? 'border-signal bg-signal' : 'border-rule-strong bg-snow-raised'
        }`}
      >
        <span
          className={`transition-transform duration-200 ease-out ${on ? 'scale-100' : 'scale-0'}`}
        >
          <Check className="size-2.5" />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13.5px] font-medium ${on ? 'text-signal-deep' : 'text-ink'}`}
        >
          {item.label}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted">
          {item.description}
        </span>
      </span>

      <span className="shrink-0 text-right font-mono text-[11.5px] leading-tight tabular-nums">
        <span className={`block ${on ? 'text-signal-deep' : 'text-ink'}`}>
          +{formatMoney(item.price[currency], currency)}
        </span>
        <span className="mt-0.5 block text-muted">
          {monthly ? '/mo' : `+${item.days}d`}
        </span>
      </span>
    </button>
  )
}

/**
 * Print-only itemised quote, portalled to <body> so it is a sibling of #root.
 * Under @media print, index.css sets every other body child to display:none —
 * that (rather than visibility:hidden) is what stops the PDF carrying a dozen
 * blank pages of invisible site underneath the quote.
 */
function PrintableQuote({ quote, printedAt }) {
  const money = (value) => formatMoney(value, quote.currency)
  return createPortal(
    <div className="print-quote hidden print:block">
      <p
        style={{
          fontSize: 13,
          letterSpacing: '0.2em',
          color: '#0d47c7',
          fontWeight: 700,
        }}
      >
        [ IDM ] ✕ VALLEY
      </p>
      <h1 style={{ fontSize: 26, marginTop: 18 }}>Project quote — {quote.type.label}</h1>
      <p style={{ color: '#6c7480', fontSize: 12, marginTop: 4 }}>
        {printedAt ? `Prepared ${printedAt}` : null} · Indicative estimate
      </p>

      <table
        style={{ width: '100%', marginTop: 28, borderCollapse: 'collapse', fontSize: 13 }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '8px 0', borderBottom: '1px solid #e6e8ec' }}>
              {quote.type.label} base
            </td>
            <td
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #e6e8ec',
                textAlign: 'right',
              }}
            >
              {money(quote.base)}
            </td>
          </tr>
          {quote.lines.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: '8px 0', borderBottom: '1px solid #e6e8ec' }}>
                + {item.label}
              </td>
              <td
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #e6e8ec',
                  textAlign: 'right',
                }}
              >
                {money(item.price[quote.currency])}
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: '14px 0 4px', fontWeight: 700 }}>Estimated total</td>
            <td
              style={{
                padding: '14px 0 4px',
                textAlign: 'right',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {money(quote.total)}
              {priceSuffix(quote)}
            </td>
          </tr>
          <tr>
            <td style={{ color: '#6c7480' }}>Timeline</td>
            <td style={{ color: '#6c7480', textAlign: 'right' }}>
              {describeTimeline(quote)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 22, fontSize: 12, color: '#444444' }}>
        Included in the base: {quote.type.included.join(' · ')}.
      </p>
      <p style={{ marginTop: 28, fontSize: 12, color: '#6c7480' }}>
        Indicative estimate. Final scope & price confirmed on a quick call.{' '}
        {contact.phone} · {contact.email}
      </p>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

/**
 * Pricing — the Project Quote Calculator.
 *
 * Mirrors the live idmvalley.com calculator: every price, inclusion and day
 * estimate comes from data/quoteCatalog.js, which was transcribed from it.
 *
 * Subscribes to the *quote* snapshot only, so a toggle re-renders this
 * subtree and nothing else — the WebGL component never sees it.
 */
export default function Pricing() {
  const snap = useSyncExternalStore(
    subscribeQuote,
    getQuoteSnapshot,
    getQuoteServerSnapshot,
  )
  const [printedAt, setPrintedAt] = useState('')

  const type = getProjectType(snap.typeId)
  const quote = calculateQuote(snap.typeId, snap.addons, snap.currency)
  const money = (value) => formatMoney(value, snap.currency)

  const handleType = useCallback((event) => {
    setProjectType(event.currentTarget.dataset.type)
  }, [])

  const handleAddon = useCallback((event) => {
    toggleAddon(event.currentTarget.dataset.addon)
  }, [])

  const handleCurrency = useCallback((event) => {
    setCurrency(event.currentTarget.dataset.currency)
  }, [])

  const handleSend = useCallback(() => {
    const current = getQuoteSnapshot()
    const q = calculateQuote(current.typeId, current.addons, current.currency)
    sendQuoteRequest({
      message: quoteToText(q),
      budgetIndex: budgetIndexFor(q.totalINR),
      service: SERVICE_FOR_TYPE[q.type.id] ?? 'Tech',
    })
    document.getElementById('contact')?.scrollIntoView()
  }, [])

  const handlePrint = useCallback(() => {
    /* The date is taken here, in the event, not during render — render must
       stay pure. flushSync commits it before the print dialog snapshots the
       page. */
    flushSync(() => {
      setPrintedAt(
        new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
    })
    window.print()
  }, [])

  const handleJump = useCallback(() => {
    document.getElementById('quote-summary')?.scrollIntoView()
  }, [])

  return (
    <Section id="pricing" className="py-24 sm:py-32">
      <SectionHeading
        align="center"
        eyebrow="Instant estimate"
        title={
          <>
            Build your project, get a <GradientText italic>price & timeline</GradientText>
            .
          </>
        }
        lead="Pick what you need — the price and timeline update instantly. Save the quote as a PDF, or send it straight to our team."
      />

      {/* ---- Project type -------------------------------------------- */}
      <div
        role="radiogroup"
        aria-label="Project type"
        className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {projectTypes.map((item) => (
          <TypeCard
            key={item.id}
            type={item}
            active={item.id === type.id}
            onSelect={handleType}
          />
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---- Configuration ----------------------------------------- */}
        <div>
          <div className="rounded-2xl border border-rule bg-snow-raised/85 p-5 shadow-lift backdrop-blur-md sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
              Included in the {type.label} base
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {type.included.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5 text-[13.5px] text-body"
                >
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-neon-soft text-neon-ink">
                    <Check className="size-2.5" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            {type.groups.map((group) => (
              <fieldset key={group.title} className="mt-8 min-w-0 border-0 p-0">
                <legend
                  className={`mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase ${
                    group.ai ? 'text-neon-ink' : 'text-muted'
                  }`}
                >
                  {group.title}
                  {group.ai ? (
                    <span className="rounded-full bg-gradient-to-r from-signal to-neon-mid px-1.5 py-px text-[9px] tracking-[0.12em] text-white">
                      AI
                    </span>
                  ) : null}
                </legend>
                <div className="grid gap-2.5 md:grid-cols-2">
                  {group.addons.map((item) => (
                    <AddonToggle
                      key={item.id}
                      item={item}
                      on={snap.addons.includes(item.id)}
                      currency={snap.currency}
                      monthly={quote.monthly}
                      onToggle={handleAddon}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {/* Mobile running total — the summary sits below a long list here,
              so the number stays in view while toggling. */}
          <button
            type="button"
            onClick={handleJump}
            className="sticky bottom-4 z-20 mt-4 flex w-full items-center justify-between rounded-2xl border border-signal/30 bg-snow-raised/95 px-5 py-3.5 text-left shadow-lift-lg backdrop-blur-md lg:hidden"
          >
            <span>
              <span className="block text-[11px] tracking-[0.16em] text-muted uppercase">
                Estimated total
              </span>
              <span className="font-display text-lg font-bold tabular-nums">
                <GradientText>{money(quote.total)}</GradientText>
                <span className="text-[12px] font-medium text-muted">
                  {priceSuffix(quote)}
                </span>
              </span>
            </span>
            <span className="text-[13px] font-semibold text-signal">View quote ↓</span>
          </button>
        </div>

        {/* ---- Summary -------------------------------------------------- */}
        <aside
          id="quote-summary"
          aria-label="Quote summary"
          className="rounded-2xl border border-rule bg-snow-raised p-5 shadow-lift-lg sm:p-6 lg:sticky lg:top-28"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              Your quote
            </p>
            <div
              role="radiogroup"
              aria-label="Currency"
              className="flex rounded-full border border-rule bg-snow p-0.5"
            >
              {currencies.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={snap.currency === code}
                  data-currency={code}
                  onClick={handleCurrency}
                  className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors duration-200 ${
                    snap.currency === code
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {code === 'INR' ? '₹ INR' : '$ USD'}
                </button>
              ))}
            </div>
          </div>

          <dl className="mt-5 space-y-2 font-mono text-[12.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-body">{type.label} base</dt>
              <dd className="text-ink tabular-nums">{money(quote.base)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-body">Add-ons ({quote.lines.length})</dt>
              <dd className="text-ink tabular-nums">{money(quote.addonsTotal)}</dd>
            </div>
          </dl>

          {quote.lines.length > 0 ? (
            <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto border-l-2 border-signal-soft pl-3 font-mono text-[11.5px] text-muted">
              {quote.lines.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {money(item.price[snap.currency])}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[12px] text-muted">
              No add-ons yet — switch some on to see the total move.
            </p>
          )}

          <div className="mt-5 border-t border-rule pt-4">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              Estimated total
            </p>
            <p
              aria-live="polite"
              className="mt-1 font-display text-[2rem] leading-tight tabular-nums"
            >
              <GradientText className="font-bold">{money(quote.total)}</GradientText>
              <span className="text-sm font-medium text-muted">{priceSuffix(quote)}</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-neon-soft px-2.5 py-1 font-mono text-[11px] text-neon-ink">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-neon-mid" />
              {describeTimeline(quote)}
            </p>
          </div>

          <div className="mt-6 grid gap-2.5">
            <button
              type="button"
              onClick={handleSend}
              className="gpu-hover rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-signal"
            >
              Send me this quote
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-full border border-rule-strong bg-snow-raised px-5 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-signal hover:text-signal"
            >
              Save as PDF
            </button>
            {quote.lines.length > 0 ? (
              <button
                type="button"
                onClick={clearAddons}
                className="mt-1 text-[12px] font-semibold text-muted underline underline-offset-4 hover:text-signal"
              >
                Clear add-ons
              </button>
            ) : null}
          </div>

          <p className="mt-5 text-[11.5px] leading-relaxed text-muted">
            Indicative estimate. Final scope & price confirmed on a quick call.
          </p>
        </aside>
      </div>

      <PrintableQuote quote={quote} printedAt={printedAt} />
    </Section>
  )
}
