import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { NOTIFICATION_WINDOW, notificationConfig } from './domain/contact.mjs'
import { siteOrigin } from './domain/seo.mjs'

const RETRIES = [60, 300, 900, 3600, 10800]
export const notificationReasons: Record<string, string> = {
  'not-configured': 'Email sending is not configured. The inquiry is safely stored; configure delivery, then retry.',
  temporary: 'The email service could not confirm acceptance. Automatic retries are scheduled while safe.',
  rejected: 'The email service rejected the request. Check its sender/recipient configuration before retrying.',
  expired: 'The safe retry window has ended. Check the email provider before any manual resend to avoid duplicate notifications.',
  attempts: 'Automatic retry attempts are exhausted. Check delivery and retry manually within the safe retry window.',
  legacy: 'This inquiry has no notification identity. Ask the developer to review it before sending a notification.',
}
type Transport = (envelope: any, key: string) => Promise<{ id: string }>
export async function resendNotification(envelope: any, key: string) {
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(envelope), signal: AbortSignal.timeout(8000) })
  if (!response.ok) { const error = new Error(response.status === 429 || response.status >= 500 ? 'temporary' : 'rejected'); throw error }
  const value = await response.json()
  if (typeof value.id !== 'string') throw new Error('temporary')
  return { id: value.id }
}
export async function processNotifications(payload: Payload, { limit = 5, onlyID, transport = resendNotification }: { limit?: number; onlyID?: number; transport?: Transport } = {}) {
  const pool = payload.db.pool!, result = { claimed: 0, accepted: 0, captured: 0, failed: 0 }
  // Delivery bookkeeping has its own timestamps. Do not touch Payload's
  // workflow updatedAt: a background send must not invalidate an owner's edit.
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const lease = randomUUID()
    const claim = await pool.query(`UPDATE inquiries SET notification_status = 'sending', lease_token = $1, lease_until = now() + interval '60 seconds', notification_attempts = notification_attempts + 1
      WHERE id = (SELECT id FROM inquiries WHERE ($2::integer IS NULL OR id = $2) AND expires_at > now() AND
        (((notification_status = 'pending' OR notification_status = 'failed') AND next_attempt_at <= now()) OR (notification_status = 'sending' AND lease_until < now()))
        ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`, [lease, onlyID || null])
    if (!claim.rowCount) break
    result.claimed++
    const row = claim.rows[0]
    const save = (status: string, reason: string | null, next: number | null, providerID?: string) => pool.query(`UPDATE inquiries SET notification_status = $1::text::enum_inquiries_notification_status, notification_error = $2, next_attempt_at = CASE WHEN $3::integer IS NULL THEN NULL ELSE now() + $3 * interval '1 second' END, notification_provider_id = COALESCE($4, notification_provider_id), notified_at = CASE WHEN $1::text IN ('sent','captured') THEN now() ELSE notified_at END, lease_until = NULL, lease_token = NULL WHERE id = $5 AND lease_token = $6`, [status, reason, next, providerID || null, row.id, lease])
    if (!row.notification_key) { await save('review', 'legacy', null); result.failed++; continue }
    if (row.first_send_at && Date.now() - new Date(row.first_send_at).getTime() >= NOTIFICATION_WINDOW) { await save('review', 'expired', null); result.failed++; continue }
    const config = notificationConfig()
    if (!config.ready) { await save('failed', 'not-configured', null); result.failed++; continue }
    if (config.provider === 'capture') {
      // No recipient, message body, email address, or outbound request is captured.
      await save('captured', null, null, `local-capture-${row.notification_key}`); result.captured++; continue
    }
    try {
      // Snapshot the envelope before sending: retries must keep the same content,
      // origin, sender and recipient even when deployment settings later change.
      const envelope = row.notification_envelope || { from: config.from, to: config.to, subject: `New website inquiry #${row.id}`, text: `A new inquiry is stored privately on your website. Sign in to review it:\n${siteOrigin()}/admin/collections/inquiries/${row.id}\n\nThis notification contains no visitor message or contact details.` }
      const prepared = await pool.query(`UPDATE inquiries SET notification_envelope = $1::jsonb, first_send_at = COALESCE(first_send_at, now()) WHERE id = $2 AND lease_token = $3 RETURNING id`, [JSON.stringify(envelope), row.id, lease])
      if (!prepared.rowCount) continue
      const sent = await transport(envelope, `website-inquiry/${row.notification_key}`)
      await save('sent', null, null, sent.id); result.accepted++
    } catch (error: any) {
      const reason = error.message === 'rejected' ? 'rejected' : row.notification_attempts >= 6 ? 'attempts' : 'temporary'
      await save('failed', reason, reason === 'temporary' ? RETRIES[Math.min(row.notification_attempts - 1, RETRIES.length - 1)] : null)
      result.failed++
    }
  }
  return result
}
export async function retryNotification(payload: Payload, id: number) {
  const result = await payload.db.pool!.query(`UPDATE inquiries SET notification_status = 'pending', next_attempt_at = now(), notification_error = NULL, notification_attempts = 0
    WHERE id = $1 AND notification_status IN ('pending','failed','sending') AND (lease_until IS NULL OR lease_until < now()) AND expires_at > now()
    AND (first_send_at IS NULL OR first_send_at > now() - interval '23 hours') RETURNING id`, [id])
  return Boolean(result.rowCount)
}
export async function contactMaintenance(payload: Payload) {
  const pool = payload.db.pool!
  const expired = await pool.query(`DELETE FROM inquiries WHERE id IN (SELECT id FROM inquiries WHERE expires_at <= now() AND (lease_until IS NULL OR lease_until < now()) ORDER BY expires_at LIMIT 100)`)
  await pool.query('DELETE FROM contact_rate_limits WHERE expires_at < now()')
  await pool.query('DELETE FROM contact_receipts WHERE expires_at < now()')
  const notifications = await processNotifications(payload)
  await pool.query(`INSERT INTO contact_worker_state (id,last_run_at) VALUES (1,now()) ON CONFLICT (id) DO UPDATE SET last_run_at = now()`)
  return { deletedExpired: expired.rowCount, ...notifications }
}


