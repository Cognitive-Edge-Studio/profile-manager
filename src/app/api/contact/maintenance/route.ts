import { getPayload } from 'payload'
import { equalSecret } from '../../../../domain/contact.mjs'
import { contactMaintenance } from '../../../../contact-notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  const secret = process.env.CONTACT_WORKER_SECRET
  if (!secret || secret.length < 32 || !equalSecret(request.headers.get('authorization'), 'Bearer ' + secret)) return Response.json({ error: 'Not authorized.' }, { status: 403, headers })
  try {
    const { default: config } = await import('../../../../payload.config')
    return Response.json(await contactMaintenance(await getPayload({ config })), { headers })
  } catch { return Response.json({ error: 'Contact maintenance is temporarily unavailable.' }, { status: 503, headers }) }
}
