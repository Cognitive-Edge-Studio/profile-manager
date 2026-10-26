import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export const MAX_CONTACT_BYTES = 32768
export const CONTACT_TOKEN_AGE = 60 * 60 * 1000
export const CONTACT_DELAY = 1500
export const NOTIFICATION_WINDOW = 23 * 60 * 60 * 1000
export const CONTACT_LIMITS = { name: 120, email: 254, message: 8000, budget: 150, timeline: 150 }
export const contactDigest = (value, secret = process.env.PAYLOAD_SECRET) => createHmac('sha256', secret).update(value).digest('hex')
export function equalSecret(a, b) { const left = Buffer.from(String(a)), right = Buffer.from(String(b)); return left.length === right.length && timingSafeEqual(left, right) }
export function contactOrigins(env = process.env) {
  const values = [env.SITE_URL, env.CMS_SERVER_URL, env.NEXT_PUBLIC_SERVER_URL].filter(Boolean)
  if (env.CMS_ENV === 'local') values.push('http://127.0.0.1:3000', 'http://localhost:3000')
  return new Set(values.map(value => new URL(value).origin))
}
export function contactOriginAllowed(headers, env = process.env, requireOrigin = true) {
  if (headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = headers.get('origin')
  if (!origin) return !requireOrigin
  return contactOrigins(env).has(origin)
}
export function issueContactToken(now = Date.now(), secret = process.env.PAYLOAD_SECRET) {
  const value = Buffer.from(JSON.stringify({ at: now, nonce: randomUUID() })).toString('base64url')
  return value + '.' + contactDigest(value, secret)
}
export function checkContactToken(token, now = Date.now(), secret = process.env.PAYLOAD_SECRET) {
  if (typeof token !== 'string' || token.length > 400) return { error: 'Refresh the form and try again.' }
  const [value, signature, extra] = token.split('.')
  if (!value || !signature || extra || !equalSecret(signature, contactDigest(value, secret))) return { error: 'Refresh the form and try again.' }
  try {
    const data = JSON.parse(Buffer.from(value, 'base64url').toString())
    const age = now - data.at
    if (!Number.isSafeInteger(data.at) || !/^[0-9a-f-]{36}$/.test(data.nonce) || age < 0 || age > CONTACT_TOKEN_AGE) return { error: 'This form has expired. Try again to refresh it.' }
    if (age < CONTACT_DELAY) return { error: 'Please wait a moment, then try again.' }
    return { nonce: data.nonce }
  } catch { return { error: 'Refresh the form and try again.' } }
}
export function validateContact(value) {
  const errors = {}
  const fields = new Set([...Object.keys(CONTACT_LIMITS), 'source', 'website', 'idempotencyKey'])
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !fields.has(key))) return { errors: { form: 'Send only the supported inquiry fields.' } }
  const data = {}
  for (const [key, max] of Object.entries(CONTACT_LIMITS)) {
    const input = value[key] ?? ''
    if (typeof input !== 'string' || input.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input) || (key !== 'message' && /[\r\n]/.test(input))) errors[key] = `Use plain text, up to ${max} characters.`
    else data[key] = input.trim().replace(/\r\n/g, '\n')
  }
  if (!data.name) errors.name = 'Enter your name.'
  if (!data.email || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email = 'Enter a valid email address.'
  if (!data.message || data.message.length < 10) errors.message = 'Describe your project in at least 10 characters.'
  if (!['home', 'contact'].includes(value.source)) errors.form = 'Choose a supported contact form.'
  if (typeof value.website !== 'string' || value.website !== '') errors.form = 'The inquiry could not be accepted. Email directly if this continues.'
  if (typeof value.idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.idempotencyKey)) errors.form = 'Refresh the form and try again.'
  return Object.keys(errors).length ? { errors } : { data: { ...data, email: data.email.toLowerCase(), source: value.source }, idempotencyKey: value.idempotencyKey }
}
export function retentionDays(env = process.env) { const days = Number(env.CONTACT_RETENTION_DAYS || 180); if (!Number.isInteger(days) || days < 7 || days > 365) throw new Error('CONTACT_RETENTION_DAYS must be between 7 and 365.'); return days }
export const contactPrivacy = (env = process.env) => `Your details and message are stored privately to respond to your inquiry and scheduled for deletion after ${retentionDays(env)} days. Notification emails contain only a link to the private dashboard. Please avoid sending passwords or sensitive personal information.`
export function notificationConfig(env = process.env) {
  const provider = env.CONTACT_NOTIFICATION_PROVIDER || 'disabled'
  if (provider === 'capture' && ['local', 'test'].includes(env.CMS_ENV)) return { provider, ready: true }
  if (provider !== 'resend' || !env.RESEND_API_KEY || !env.CONTACT_NOTIFICATION_FROM || !env.CONTACT_NOTIFICATION_TO) return { provider: 'disabled', ready: false }
  const recipients = env.CONTACT_NOTIFICATION_TO.split(',').map(value => value.trim().toLowerCase())
  const email = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/
  if (/[\r\n]/.test(env.CONTACT_NOTIFICATION_TO) || recipients.length > 50 || [env.CONTACT_NOTIFICATION_FROM, ...recipients].some(value => value.length > 254 || !email.test(value))) return { provider: 'disabled', ready: false }
  return { provider, ready: true, from: env.CONTACT_NOTIFICATION_FROM, to: [...new Set(recipients)] }
}
