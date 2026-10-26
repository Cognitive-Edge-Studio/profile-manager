'use client'
import { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const labels: Record<string, string> = { pending: 'Pending', sending: 'Processing', sent: 'Email service accepted', captured: 'Captured locally — no email sent', failed: 'Notification failed; inquiry safely stored', review: 'Needs delivery review' }
export function InquiryNotification() {
  const { id } = useDocumentInfo()
  const [report, setReport] = useState<any>(null), [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function load() {
    if (!id) return
    setBusy(true); setError('')
    try { const response = await fetch(`/api/inquiry-notifications/${id}`, { cache: 'no-store' }); if (!response.ok) throw new Error('Notification status is temporarily unavailable. Try checking again.'); setReport(await response.json()) } catch (error: any) { setError(error.message) } finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [id])
  async function retry() {
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/inquiry-notifications/${id}/retry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Retry could not be queued.') }
      await load()
    } catch (error: any) { setError(error.message) } finally { setBusy(false) }
  }
  const date = (value: string) => value ? new Date(value).toLocaleString() : 'Not recorded'
  return <section style={{ padding: '1.25rem', border: '1px solid var(--theme-elevation-150)', borderRadius: 8, marginBottom: '1.5rem', lineHeight: 1.6 }}>
    <h3 style={{ marginTop: 0 }}>Inquiry saved privately</h3><p>Notification delivery is separate from saving this inquiry. No reply is sent when you change its workflow status.</p>
    {report && <><p><strong>{labels[report.status] || report.status}</strong></p>{report.reason && <p>{report.reason}</p>}<p>Attempts: {report.attempts || 0}{report.nextAttemptAt && <> · Next attempt: {date(report.nextAttemptAt)}</>}</p>{report.notifiedAt && <p>Service acceptance / local capture: {date(report.notifiedAt)}. Service acceptance does not confirm inbox delivery.</p>}<p>Scheduled deletion: {date(report.expiresAt)}. A developer must keep the contact worker running. Last completed worker run: {date(report.lastWorkerAt)}.</p>{report.provider === 'disabled' && <p>Email sending is disabled until a developer configures a verified sender and delivery service. You can still read and manage stored inquiries here.</p>}</>}
    <button type="button" disabled={busy || !id} onClick={load}>{busy ? 'Checking…' : 'Check notification status'}</button>{' '}
    {report && ['failed', 'pending'].includes(report.status) && <button type="button" disabled={busy} onClick={retry}>Retry notification</button>}
    {error && <p role="alert">{error}</p>}
  </section>
}
