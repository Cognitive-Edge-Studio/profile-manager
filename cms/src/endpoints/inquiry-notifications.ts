import type { Endpoint } from 'payload'
import { isAdmin } from '../domain/contracts.mjs'
import { contactOriginAllowed, notificationConfig, retentionDays } from '../domain/contact.mjs'
import { notificationReasons, retryNotification, processNotifications } from '../contact-notifications'

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
export const inquiryNotifications: Endpoint[] = [{
  path: '/inquiry-notifications/:id', method: 'get', handler: async req => {
    if (!isAdmin(req.user)) return Response.json({ error: 'Administrator access required.' }, { status: 403, headers })
    const id = String(req.routeParams?.id || '')
    if (!/^\d+$/.test(id)) return Response.json({ error: 'Choose an inquiry.' }, { status: 400, headers })
    const result = await req.payload.db.pool!.query('SELECT notification_status, notification_attempts, notification_error, next_attempt_at, notified_at, expires_at FROM inquiries WHERE id = $1', [id])
    if (!result.rowCount) return Response.json({ error: 'Inquiry unavailable.' }, { status: 404, headers })
    const row = result.rows[0], worker = await req.payload.db.pool!.query('SELECT last_run_at FROM contact_worker_state WHERE id = 1')
    return Response.json({ status: row.notification_status, attempts: row.notification_attempts, reason: notificationReasons[row.notification_error] || null, nextAttemptAt: row.next_attempt_at, notifiedAt: row.notified_at, expiresAt: row.expires_at, provider: notificationConfig().provider, lastWorkerAt: worker.rows[0]?.last_run_at || null, retentionDays: retentionDays() }, { headers })
  },
}, {
  path: '/inquiry-notifications/:id/retry', method: 'post', handler: async req => {
    if (!isAdmin(req.user) || !contactOriginAllowed(req.headers)) return Response.json({ error: 'Administrator access from this website required.' }, { status: 403, headers })
    const id = Number(req.routeParams?.id)
    if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: 'Choose an inquiry.' }, { status: 400, headers })
    if (!await retryNotification(req.payload, id)) return Response.json({ error: 'Already accepted, processing, expired, or outside the safe retry window. Check the inquiry and email service before any manual resend.' }, { status: 409, headers })
    // This explicit admin retry is bounded; the persisted lease makes it safe
    // alongside scheduled workers. It never resubmits the visitor's inquiry.
    try { await processNotifications(req.payload, { onlyID: id, limit: 1 }) } catch { return Response.json({ queued: true, message: 'Retry saved. The worker can finish it.' }, { status: 202, headers }) }
    return Response.json({ queued: true }, { headers })
  },
}]
