'use client'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check, Send, ArrowUpRight } from 'lucide-react'
import { Link, useWebsiteRuntime } from './runtime'
import { Button } from './components/ui/button'
import { Input, Textarea } from './components/ui/input'
import { CalendlyLink } from './contact-links'
function Eyebrow({ children }: { children: React.ReactNode }) { return <p className="eyebrow">{children}</p> }
export function InquiryForm({ home = false, heading }: { home?: boolean; heading?: string }) {
  const id = useId()
  const runtime = useWebsiteRuntime()
  const copy = runtime.form
  const profile = runtime.profile
  const calculatorSummary = !home ? runtime.summary.slice(0, 7800) : ''
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const disabled = runtime.contact.preview || !runtime.contact.enabled
  const email = profile.email
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const busy = useRef(false), token = useRef<{ value: string; at: number } | null>(null), attempt = useRef<{ key: string; content: string } | null>(null), errorBox = useRef<HTMLDivElement>(null)
  async function prepare(signal?: AbortSignal) {
    if (token.current && Date.now() - token.current.at < 50 * 60 * 1000) return token.current
    const response = await fetch('/api/contact', { cache: 'no-store', credentials: 'omit', signal: signal || AbortSignal.timeout(8000) })
    const data = await response.json()
    if (!response.ok || typeof data.token !== 'string') throw new Error(data.error || 'The form is temporarily unavailable. Please retry or email directly.')
    token.current = { value: data.token, at: Date.now() }; return token.current
  }
  useEffect(() => {
    setReady(true)
    if (disabled) return
    const controller = new AbortController()
    void prepare(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [disabled])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || disabled) return
    const form = event.currentTarget
    const values = new FormData(form)
    const payload = { name: String(values.get('name') || ''), email: String(values.get('email') || ''), message: String(values.get('message') || ''), budget: String(values.get('budget') || ''), timeline: String(values.get('timeline') || ''), source: home ? 'home' : 'contact', website: String(values.get('website') || '') }
    const content = JSON.stringify(payload)
    if (!attempt.current || attempt.current.content !== content) attempt.current = { key: crypto.randomUUID(), content }
    busy.current = true; setState('sending'); setFields({}); setError('')
    try {
      const challenge = await prepare(), wait = Math.max(0, 1600 - (Date.now() - challenge.at))
      if (wait) await new Promise(resolve => setTimeout(resolve, wait))
      const response = await fetch('/api/contact', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Contact-Token': challenge.value }, body: JSON.stringify({ ...payload, idempotencyKey: attempt.current.key }), signal: AbortSignal.timeout(20000) })
      const result = await response.json()
      if (!response.ok || result.accepted !== true) {
        if (result.refreshToken) token.current = null
        const problems = result.fields && typeof result.fields === 'object' ? Object.fromEntries(Object.entries(result.fields).filter(([, value]) => typeof value === 'string')) as Record<string, string> : {}
        setFields(problems)
        const retry = response.headers.get('retry-after')
        throw new Error((result.error || 'Your inquiry could not be saved.') + (retry ? ` Try again in about ${Math.ceil(Number(retry) / 60)} minute(s).` : ''))
      }
      setState('success'); form.reset()
      const message = form.elements.namedItem('message') as HTMLTextAreaElement | null
      if (message) message.value = ''
      if (!home) runtime.setSummary('')
      attempt.current = null
    } catch (error: any) {
      setState('error')
      setError(`${error.name === 'TimeoutError' || error.name === 'TypeError' ? 'A connection problem prevented confirmation. Retry the unchanged form to check safely for your saved inquiry.' : error.message} Your details are still here. You can also email ${email}.`)
      requestAnimationFrame(() => errorBox.current?.focus())
    } finally { busy.current = false }
  }
  const fieldError = (name: string) => fields[name] ? <small id={`${id}-${name}-error`} className="contact-field-error">{fields[name]}</small> : null
  const attributes = (name: string) => ({ 'aria-invalid': Boolean(fields[name]) || undefined, 'aria-describedby': fields[name] ? `${id}-${name}-error` : undefined })
  return <div className="inquiry-form"><div className="form-title">{home ? <p className="home-inquiry-title">{copy.homeFormHeading || 'Inquiry form'}</p> : <div><Eyebrow>Project inquiry</Eyebrow><h2>{heading || copy.formHeading || 'Send me a message'}</h2></div>}<Send size={20} /></div>
    {copy.formHelp && <p className="form-delivery-note">{copy.formHelp}</p>}
    {calculatorSummary && <div className="calculator-inquiry-note">Your calculator summary is ready below. Review and edit it before sending. <Link to="/tools/mvp-cost-calculator/">Return to your plan</Link></div>}
    {disabled && <p className="form-delivery-note">{runtime.contact.preview ? 'Preview only: submissions are disabled. Test the reviewed published form before launch.' : 'Online inquiries are currently unavailable.'} You can email <a href={`mailto:${email}`}>{email}</a>.</p>}
    <form method="post" onSubmit={submit} onChange={() => { if (!busy.current) { setState('idle'); setFields({}); setError('') } }} aria-busy={state === 'sending'}>
      <fieldset disabled={state === 'sending'} className="contact-fields">
        <div className="inquiry-honeypot" aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this field empty<Input id={`${id}-website`} name="website" autoComplete="off" tabIndex={-1} /></label></div>
        <div className="form-row"><label htmlFor={`${id}-name`}>{copy.nameLabel || 'Your name'} <span>*</span><Input id={`${id}-name`} name="name" autoComplete="name" placeholder="Your name" required maxLength={120} {...attributes('name')} />{fieldError('name')}</label><label htmlFor={`${id}-email`}>{copy.emailLabel || 'Email address'} <span>*</span><Input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} {...attributes('email')} />{fieldError('email')}</label></div>
        <label htmlFor={`${id}-message`}>{home ? copy.homeMessageLabel || 'Tell me about the project' : copy.messageLabel || 'About your project'} <span>*</span><Textarea id={`${id}-message`} name="message" defaultValue={calculatorSummary} placeholder={copy.messagePlaceholder || "I'd like to build or improve… It's for… I need help with…"} required minLength={10} maxLength={8000} rows={5} {...attributes('message')} />{fieldError('message')}</label>
        {home && <label htmlFor={`${id}-timeline`}>{copy.timelineLabel || 'Preferred timeline'} <span className="optional">Optional</span><Input id={`${id}-timeline`} name="timeline" placeholder="When would you like to get started?" maxLength={150} {...attributes('timeline')} />{fieldError('timeline')}</label>}
        <label htmlFor={`${id}-budget`}>{copy.budgetLabel || 'Budget range'} <span className="optional">Optional</span><Input id={`${id}-budget`} name="budget" placeholder="A rough range, if you have one" maxLength={150} {...attributes('budget')} /><small>{copy.budgetHelp}</small>{fieldError('budget')}</label>
      </fieldset>
      <p className="form-delivery-note contact-privacy">{runtime.contact.privacy}</p>
      <div className="inquiry-actions"><Button type="submit" disabled={!ready || disabled || state === 'sending'}>{state === 'sending' ? 'Saving…' : copy.submitLabel || 'Send your message'}<ArrowUpRight size={17} /></Button>{!home && <CalendlyLink url={profile.calendly} />}</div>
      {state === 'sending' && <p role="status" className="form-delivery-note">Saving your inquiry. Please keep this page open.</p>}
      {state === 'success' && <div role="status" className="form-status"><Check size={18} /><div><strong>Message received and saved</strong><p>{copy.acceptedMessage}</p><p>Please do not send the same inquiry again.</p></div></div>}
      {state === 'error' && <div ref={errorBox} role="alert" tabIndex={-1} className="form-error">{error}{fields.form && <p>{fields.form}</p>}</div>}
      <noscript><p className="form-delivery-note">This form needs JavaScript. Please email <a href={`mailto:${email}`}>{email}</a> instead.</p></noscript>
    </form>
  </div>
}


