import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import type { Payload } from 'payload'
import { contactDigest, retentionDays } from './domain/contact.mjs'

export class ContactFailure extends Error { constructor(public status: number, message: string, public retryAfter?: number) { super(message) } }
export async function limited(client: Pick<PoolClient, 'query'>, scope: string, identity: string, max: number, seconds: number) {
  const result = await client.query(`INSERT INTO contact_rate_limits (key, hits, expires_at) VALUES ($1, 1, now() + $2 * interval '1 second')
    ON CONFLICT (key) DO UPDATE SET hits = CASE WHEN contact_rate_limits.expires_at <= now() THEN 1 ELSE contact_rate_limits.hits + 1 END,
    expires_at = CASE WHEN contact_rate_limits.expires_at <= now() THEN now() + $2 * interval '1 second' ELSE contact_rate_limits.expires_at END
    RETURNING hits, GREATEST(1, EXTRACT(EPOCH FROM expires_at - now())::integer) AS retry`, [contactDigest(scope + ':' + identity), seconds])
  if (result.rows[0].hits > max) throw new ContactFailure(429, 'Too many attempts. Please wait before trying again, or email directly.', result.rows[0].retry)
}
export function contactNetwork(headers: Headers) {
  // Only use a forwarding header when deployment guarantees it is overwritten
  // by its trusted edge. Never trust visitor-supplied X-Forwarded-For by default.
  const name = process.env.CONTACT_TRUSTED_IP_HEADER
  return name ? headers.get(name)?.split(',')[0]?.trim().slice(0, 100) : undefined
}
export async function limitChallenge(payload: Payload, network?: string) {
  const client = await payload.db.pool!.connect()
  try { await limited(client, 'challenge-global', 'site', 300, 3600); if (network) await limited(client, 'challenge-network', network, 60, 3600) } finally { client.release() }
}
export async function storeInquiry(payload: Payload, data: any, idempotencyKey: string, nonce: string, network?: string) {
  const client = await payload.db.pool!.connect(), key = contactDigest('receipt:' + idempotencyKey), hash = contactDigest(JSON.stringify(data))
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(6106, hashtext($1))', [key])
    const existing = await client.query('SELECT payload_hash FROM contact_receipts WHERE key = $1 AND expires_at > now() UNION ALL SELECT payload_hash FROM inquiries WHERE idempotency_key = $1 LIMIT 1', [key])
    if (existing.rowCount) {
      if (existing.rows[0].payload_hash !== hash) throw new ContactFailure(409, 'This retry differs from the previous inquiry. Edit the form to start a new submission.')
      await client.query('COMMIT'); return { duplicate: true }
    }
    // Published configuration is checked in SQL in the same acceptance transaction.
    const site = await client.query(`SELECT 1 FROM site_settings WHERE _status = 'published'`)
    const page = await client.query(`SELECT 1 FROM pages WHERE page_key = $1 AND _status = 'published'`, [data.source === 'home' ? 'home' : 'contact'])
    if (!site.rowCount || !page.rowCount) throw new ContactFailure(503, 'Online inquiries are currently unavailable. Please email directly.')
    await limited(client, 'submit-global', 'site', 50, 3600)
    await limited(client, 'submit-email', data.email, 5, 3600)
    await limited(client, 'submit-token', nonce, 3, 3600)
    if (network) await limited(client, 'submit-network', network, 10, 3600)
    const result = await client.query(`INSERT INTO inquiries (name, email, message, budget, timeline, source, idempotency_key, payload_hash, notification_key, notification_status, status, expires_at, next_attempt_at, notification_attempts, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending','new',now() + $10 * interval '1 day',now(),0,now(),now()) RETURNING id`, [data.name, data.email, data.message, data.budget, data.timeline, data.source, key, hash, randomUUID(), retentionDays()])
    await client.query(`INSERT INTO contact_receipts (key, payload_hash, expires_at) VALUES ($1,$2,now() + interval '7 days') ON CONFLICT (key) DO UPDATE SET payload_hash = EXCLUDED.payload_hash, expires_at = EXCLUDED.expires_at`, [key, hash])
    await client.query('COMMIT')
    return { duplicate: false, id: result.rows[0].id as number }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

