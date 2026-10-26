import { getPayload } from 'payload'
import { after } from 'next/server'
import { MAX_CONTACT_BYTES, checkContactToken, contactOriginAllowed, issueContactToken, validateContact } from '../../../domain/contact.mjs'
import { ContactFailure, contactNetwork, limitChallenge, storeInquiry } from '../../../contact-store'
import { processNotifications } from '../../../contact-notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30
const respond = (body: object, status = 200, extra: Record<string, string> = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra } })
async function cms() { const { default: config } = await import('../../../payload.config'); return getPayload({ config }) }
function allowed(request: Request, required = true) {
  if (!contactOriginAllowed(request.headers, process.env, required)) throw new ContactFailure(403, 'Open the form on this website to submit an inquiry.')
  if (process.env.CONTACT_SUBMISSIONS_ENABLED !== 'true') throw new ContactFailure(503, 'Online inquiries are currently unavailable. Please email directly.')
}
function failure(error: unknown) {
  if (error instanceof ContactFailure) return respond({ accepted: false, error: error.message }, error.status, error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {})
  // Database/provider errors must not log form bodies, addresses or SQL parameters.
  return respond({ accepted: false, error: 'Your inquiry could not be saved. Your details are still here. Please retry or email directly.' }, 503)
}
export async function GET(request: Request) {
  try {
    allowed(request, false)
    await limitChallenge(await cms(), contactNetwork(request.headers))
    return respond({ token: issueContactToken(), minimumWaitMs: 1500 })
  } catch (error) { return failure(error) }
}
export async function POST(request: Request) {
  try {
    allowed(request)
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return respond({ accepted: false, error: 'Use the website inquiry form.' }, 415)
    const length = request.headers.get('content-length')
    if (length && Number(length) > MAX_CONTACT_BYTES) throw new ContactFailure(413, 'This inquiry is too large. Shorten it and try again.')
    const token = checkContactToken(request.headers.get('x-contact-token'))
    if (token.error) return respond({ accepted: false, error: token.error, refreshToken: true }, 400)
    const reader = request.body?.getReader()
    if (!reader) throw new ContactFailure(400, 'Complete the inquiry form.')
    let size = 0
    const chunks: Uint8Array[] = []
    try {
      for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_CONTACT_BYTES) { await reader.cancel(); throw new ContactFailure(413, 'This inquiry is too large. Shorten it and try again.') }; chunks.push(value) }
    } finally { reader.releaseLock() }
    let input: any
    try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new ContactFailure(400, 'Complete the inquiry form using valid text.') }
    const parsed = validateContact(input)
    if (parsed.errors) return respond({ accepted: false, error: 'Check the highlighted fields. Your details are still here.', fields: parsed.errors }, 422)
    const payload = await cms()
    const saved = await storeInquiry(payload, parsed.data, parsed.idempotencyKey, token.nonce, contactNetwork(request.headers))
    if (saved.id) after(async () => { try { await processNotifications(payload, { onlyID: saved.id, limit: 1 }) } catch { /* Durable outbox remains available to the worker. */ } })
    return respond({ accepted: true }, 202)
  } catch (error) { return failure(error) }
}
