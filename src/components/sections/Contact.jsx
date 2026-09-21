import { useCallback, useEffect, useId, useState, useSyncExternalStore } from 'react'
import { contact, serviceGroups } from '../../data/siteContent'
import {
  getQuoteRequestServerSnapshot,
  getQuoteRequestSnapshot,
  setContactStatus,
  subscribeQuoteRequest,
} from '../../state/stageStore'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  service: serviceGroups[0].title,
  budget: contact.budgetOptions[1],
  message: '',
  /* Honeypot — real users never see it, bots fill it. */
  company: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+()\d][\d\s\-()]{7,19}$/

/** Pure validator — no side effects, safe to call during render or submit. */
function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (values.phone.trim() !== '' && !PHONE_RE.test(values.phone.trim())) {
    errors.phone = 'Enter a valid phone number, or leave it blank.'
  }
  if (values.message.trim().length < 20) {
    errors.message = 'Tell us a little more — 20 characters minimum.'
  }
  return errors
}

/** How long the uplink sequence runs before the success card resolves. */
const UPLINK_MS = 2000

/**
 * Contact. The hub minimises out of frame across this section's timeline
 * window, so the form is the only thing competing for attention.
 *
 * Submit runs a four-state machine: idle -> invalid -> submitting -> sent.
 * While `submitting`, a disabled <fieldset> freezes every input at once
 * (one attribute, no per-field state), the button swaps to the processing
 * label, and a transform-only progress bar runs on the compositor. The form
 * and the success card are stacked in the same grid cell and crossfade, so
 * the section height never jumps.
 *
 * NOTE: the uplink is still a simulation — see the TODO in handleSubmit.
 * Nothing is transmitted anywhere yet.
 */
/** @param {{ planeSlot?: boolean }} props — reserve the paper plane's slot. */
export default function Contact({ planeSlot = false }) {
  const fieldId = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  /* "Send me this quote" from the calculator. This is React's documented
     "adjust state when an input changes" pattern: compare during render and
     set state right there, guarded by the nonce so it runs once per request.
     An effect would paint the stale form first and then correct it — and
     react-hooks/set-state-in-effect rightly forbids that. */
  const request = useSyncExternalStore(
    subscribeQuoteRequest,
    getQuoteRequestSnapshot,
    getQuoteRequestServerSnapshot,
  )
  const [appliedNonce, setAppliedNonce] = useState(request.nonce)
  if (request.nonce !== appliedNonce) {
    setAppliedNonce(request.nonce)
    setValues((previous) => ({
      ...previous,
      message: request.message,
      service: request.service ?? previous.service,
      budget: contact.budgetOptions[request.budgetIndex] ?? previous.budget,
    }))
    setErrors({})
    setStatus('idle')
  }

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault()
      /* Honeypot tripped — fail silently so the bot learns nothing. */
      if (values.company !== '') {
        setStatus('sent')
        return
      }
      const nextErrors = validate(values)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) {
        setStatus('invalid')
        return
      }
      // TODO(idmvalley): POST to the CRM intake endpoint here and resolve the
      // sequence on the response instead of on a timer. Validation, the
      // frozen-field state and the success card are all wired; only the
      // transport is absent, because no endpoint has been specified.
      setStatus('submitting')
    },
    [values],
  )

  /* Resolve the simulated uplink. setState runs inside the timer callback,
     never synchronously in the effect body, and the timer is cleared if the
     component unmounts mid-sequence. */
  useEffect(() => {
    if (status !== 'submitting') return undefined
    const timer = setTimeout(() => setStatus('sent'), UPLINK_MS)
    return () => clearTimeout(timer)
  }, [status])

  /* Publish the submit state to the 3D paper plane. Writing to an external
     store is exactly what an effect is for; no React state is set here. */
  useEffect(() => {
    setContactStatus(status)
  }, [status])

  const busy = status === 'submitting'
  const done = status === 'sent'

  const field =
    'w-full rounded-xl border-0 bg-white/95 px-4 py-3.5 text-[14.5px] text-ink outline-none transition-[box-shadow] duration-200 placeholder:text-muted/60 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.5)]'

  return (
    <Section id="contact" className="py-24 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Contact Us"
            title={
              <>
                Tell us what is <GradientText italic>slowing the team down</GradientText>.
              </>
            }
            lead="Send the shape of the problem and we will come back with a scope, a timeline and a number — usually within two working days."
          />

          <dl className="mt-10 space-y-6 border-t border-rule pt-8">
            <div>
              <dt className="text-[12px] font-semibold tracking-[0.2em] text-muted uppercase">
                Phone
              </dt>
              <dd className="mt-1.5">
                <a
                  href={contact.phoneHref}
                  className="font-display text-lg font-medium text-ink hover:text-signal"
                >
                  {contact.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold tracking-[0.2em] text-muted uppercase">
                Email
              </dt>
              <dd className="mt-1.5">
                <a
                  href={`mailto:${contact.email}`}
                  className="font-display text-lg font-medium text-ink hover:text-signal"
                >
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold tracking-[0.2em] text-muted uppercase">
                Studio
              </dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-body">
                {contact.address}
                <span className="mt-1 block text-muted">{contact.region}</span>
              </dd>
            </div>
          </dl>

          {/* Transparent window onto the WebGL canvas behind the page. The
              paper plane tracks this box every frame, so it lands here at any
              breakpoint without the 3D knowing anything about the layout. */}
          {planeSlot ? (
            <div
              data-plane-slot=""
              aria-hidden="true"
              className="pointer-events-none mt-8 aspect-[16/10] w-full max-w-sm"
            />
          ) : null}
        </div>

        {/* Form and success card share one grid cell so the crossfade never
            changes the section height. */}
        <div className="grid [&>*]:[grid-area:1/1]">
          <form
            noValidate
            onSubmit={handleSubmit}
            inert={done}
            className={`gpu-layer rounded-2xl border border-signal/20 bg-gradient-to-br from-signal to-signal-deep p-6 shadow-lift-lg backdrop-blur-md transition-[opacity,transform] duration-500 ease-out sm:p-8 ${
              done
                ? 'pointer-events-none scale-[0.985] opacity-0'
                : 'scale-100 opacity-100'
            }`}
          >
            {/* One disabled attribute freezes every control at once. */}
            <fieldset disabled={busy || done} className="m-0 min-w-0 border-0 p-0">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label
                    htmlFor={`${fieldId}-name`}
                    className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-white/80 uppercase"
                  >
                    Full Name
                  </label>
                  <input
                    id={`${fieldId}-name`}
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    autoComplete="name"
                    aria-invalid={errors.name ? 'true' : undefined}
                    aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
                    className={field}
                    placeholder="Enter your full name"
                  />
                  {errors.name ? (
                    <p
                      id={`${fieldId}-name-error`}
                      className="mt-1.5 text-[12.5px] text-red-600"
                    >
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor={`${fieldId}-email`}
                    className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-white/80 uppercase"
                  >
                    Email Address
                  </label>
                  <input
                    id={`${fieldId}-email`}
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    autoComplete="email"
                    aria-invalid={errors.email ? 'true' : undefined}
                    aria-describedby={errors.email ? `${fieldId}-email-error` : undefined}
                    className={field}
                    placeholder="example@email.com"
                  />
                  {errors.email ? (
                    <p
                      id={`${fieldId}-email-error`}
                      className="mt-1.5 text-[12.5px] text-red-600"
                    >
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor={`${fieldId}-phone`}
                    className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-white/80 uppercase"
                  >
                    Phone <span className="font-normal normal-case tracking-normal text-white/50">(optional)</span>
                  </label>
                  <input
                    id={`${fieldId}-phone`}
                    name="phone"
                    type="tel"
                    value={values.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    aria-invalid={errors.phone ? 'true' : undefined}
                    aria-describedby={errors.phone ? `${fieldId}-phone-error` : undefined}
                    className={field}
                    placeholder="+91 ..."
                  />
                  {errors.phone ? (
                    <p
                      id={`${fieldId}-phone-error`}
                      className="mt-1.5 text-[12.5px] text-red-600"
                    >
                      {errors.phone}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor={`${fieldId}-service`}
                    className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-white/80 uppercase"
                  >
                    Service Type
                  </label>
                  <select
                    id={`${fieldId}-service`}
                    name="service"
                    value={values.service}
                    onChange={handleChange}
                    className={field}
                  >
                    {serviceGroups.map((group) => (
                      <option key={group.id} value={group.title}>
                        {group.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`${fieldId}-budget`}
                    className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-white/80 uppercase"
                  >
                    Budget Range
                  </label>
                  <select
                    id={`${fieldId}-budget`}
                    name="budget"
                    value={values.budget}
                    onChange={handleChange}
                    className={field}
                  >
                    {contact.budgetOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`${fieldId}-message`}
                    className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-white/80 uppercase"
                  >
                    Additional Notes
                  </label>
                  <textarea
                    id={`${fieldId}-message`}
                    name="message"
                    rows={4}
                    value={values.message}
                    onChange={handleChange}
                    aria-invalid={errors.message ? 'true' : undefined}
                    aria-describedby={
                      errors.message ? `${fieldId}-message-error` : undefined
                    }
                    className={`${field} resize-y`}
                    placeholder="The process, the bottleneck, the deadline."
                  />
                  {errors.message ? (
                    <p
                      id={`${fieldId}-message-error`}
                      className="mt-1.5 text-[12.5px] text-red-600"
                    >
                      {errors.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Honeypot: off-screen, not hidden, so bots still parse it. */}
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor={`${fieldId}-company`}>Company</label>
                <input
                  id={`${fieldId}-company`}
                  name="company"
                  value={values.company}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
            </fieldset>

            <div className="mt-7">
              <button
                type="submit"
                disabled={busy || done}
                className={`gpu-hover w-full rounded-xl py-4 font-bold tracking-[0.08em] transition-[background-color,transform,box-shadow,opacity] duration-200 uppercase ${
                  busy
                    ? 'cursor-progress bg-white/20 font-mono text-[12px] tracking-[0.06em] text-white/70'
                    : 'bg-white text-signal shadow-lift hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lift-lg'
                }`}
              >
                {busy ? 'PROCESSING_SECURE_REQUEST // V1...' : 'Send Enquiry'}
              </button>
              <p aria-live="polite" className="mt-3 text-center text-[13px]">
                {status === 'invalid' ? (
                  <span className="text-red-300">Please fix the highlighted fields.</span>
                ) : null}
              </p>
            </div>

            {/* Uplink progress. Transform-only scaleX, so the whole bar runs
                on the compositor and never triggers layout. */}
            {busy ? (
              <div className="mt-5">
                <div className="h-1 overflow-hidden rounded-full bg-rule">
                  <div className="uplink-bar h-full w-full rounded-full bg-signal" />
                </div>
                <p className="mt-2.5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                  Establishing secure uplink…
                </p>
              </div>
            ) : null}

            <p className="mt-4 text-[12px] leading-relaxed text-white/50">
              Your details are used only to respond to this enquiry.
            </p>
          </form>

          {/* ---- Success card ------------------------------------------- */}
          <div
            role="status"
            inert={!done}
            className={`gpu-layer grid place-items-center rounded-2xl border border-signal/30 bg-snow-raised p-8 text-center shadow-lift-lg backdrop-blur-md transition-[opacity,transform] duration-500 ease-out sm:p-10 ${
              done
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-[1.015] opacity-0'
            }`}
          >
            <div className="max-w-sm">
              <span
                aria-hidden="true"
                className="mx-auto grid size-12 place-items-center rounded-full bg-signal-soft"
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none">
                  <path
                    d="m5 12.5 4.5 4.5L19 7.5"
                    stroke="#1d4ed8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <p className="mt-5 font-mono text-[11.5px] tracking-[0.18em] text-signal uppercase">
                Inquiry registered //
              </p>
              <h3 className="mt-3 font-display text-xl leading-snug font-semibold">
                A Technology Strategist Will Reach Out Shortly
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-body">
                Usually within two working days. If it is urgent, call{' '}
                <a
                  href={contact.phoneHref}
                  className="font-medium text-signal underline underline-offset-4"
                >
                  {contact.phone}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
