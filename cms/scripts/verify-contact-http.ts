import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import type { Payload } from 'payload'

export async function verifyContact({ payload, user, base, headers, name, login }: { payload: Payload; user: any; base: string; headers: Record<string, string>; name: string; login: { email: string; password: string } }) {
  assert.match(name, /^cms_http_test_\d+$/)
  const pool = payload.db.pool!
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, name)
  const checks: string[] = []
  const challenge = await fetch(base + '/api/contact'); assert.equal(challenge.status, 200); assert.ok(challenge.headers.get('cache-control')?.includes('no-store'))
  const { token } = await challenge.json(); assert.equal(typeof token, 'string')
  await new Promise(resolve => setTimeout(resolve, 1700))
  const form = { name: 'HTTP fixture visitor', email: 'http-visitor@example.test', message: 'PRIVATE_HTTP_INQUIRY_SENTINEL: reviewed calculator summary and project details.', budget: 'Fixture budget', timeline: 'Fixture timeline', source: 'contact', website: '', idempotencyKey: randomUUID() }
  const submit = (body: any = form, extra: Record<string, string> = {}, raw?: string) => fetch(base + '/api/contact', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'X-Contact-Token': token, ...extra }, body: raw ?? JSON.stringify(body) })
  assert.equal((await submit(form, { Origin: 'https://untrusted.example' })).status, 403)
  assert.equal((await submit(form, { 'X-Contact-Token': 'invalid' })).status, 400)
  assert.equal((await submit(form, { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await submit(form, {}, '{')).status, 400)
  assert.equal((await submit(form, {}, 'a'.repeat(32769))).status, 413)
  for (const change of [{ email: 'invalid' }, { role: 'admin' }, { website: 'spam' }, { message: 'short' }, { budget: 'x'.repeat(151) }]) assert.equal((await submit({ ...form, ...change })).status, 422)
  assert.equal((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count, '0')
  checks.push('Origin, content type, token, malformed/oversized body, unknown fields, honeypot and field validation reject without saving')
  const submissions = await Promise.all(Array.from({ length: 6 }, () => submit()))
  assert.ok(submissions.every(response => response.status === 202))
  for (const response of submissions) assert.deepEqual(await response.json(), { accepted: true })
  const stored = (await pool.query('SELECT * FROM inquiries')).rows
  assert.equal(stored.length, 1); const inquiryID = stored[0].id
  assert.equal(stored[0].message, form.message); assert.equal(stored[0].budget, form.budget); assert.equal(stored[0].timeline, form.timeline)
  assert.equal((await submit({ ...form, message: 'Conflicting changed inquiry.' })).status, 409)
  assert.equal((await submit({ ...form, source: 'home', email: 'http-home@example.test', idempotencyKey: randomUUID() })).status, 202)
  assert.equal((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count, '2')
  checks.push('Concurrent retries create one durable inquiry; conflicting reuse returns 409; both finalized form sources save their existing fields')
  for (let attempt = 0; attempt < 30; attempt++) {
    if ((await pool.query('SELECT notification_status FROM inquiries WHERE id=$1', [inquiryID])).rows[0].notification_status === 'failed') break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.equal((await pool.query('SELECT notification_error FROM inquiries WHERE id=$1', [inquiryID])).rows[0].notification_error, 'not-configured')
  for (const path of ['/api/inquiries', `/api/inquiries/${inquiryID}`, `/api/inquiry-notifications/${inquiryID}`]) assert.equal((await fetch(base + path)).status, 403)
  const ownerRead = await fetch(`${base}/api/inquiries/${inquiryID}`, { headers }); assert.equal(ownerRead.status, 200)
  const ownerDoc = await ownerRead.json(); assert.equal(ownerDoc.message, form.message); assert.equal(ownerDoc.idempotencyKey, undefined); assert.equal(ownerDoc.notificationEnvelope, undefined)
  const workflow = await fetch(`${base}/api/inquiries/${inquiryID}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'read', notificationStatus: 'sent', message: 'Tampered original inquiry' }) })
  assert.equal(workflow.status, 200)
  const current = (await pool.query('SELECT * FROM inquiries WHERE id=$1', [inquiryID])).rows[0]; assert.equal(current.status, 'read'); assert.equal(current.message, form.message); assert.equal(current.notification_status, 'failed')
  const retry = await fetch(`${base}/api/inquiry-notifications/${inquiryID}/retry`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' }); assert.equal(retry.status, 200)
  assert.equal((await fetch(base + '/api/contact/maintenance', { method: 'POST' })).status, 403)
  checks.push('Disabled email produces visible retryable notification failure after acceptance; private inquiry/status APIs deny visitors; owner workflow cannot falsify delivery or edit original input')
  // Simulate storage failure only inside the guarded disposable database.
  await pool.query('ALTER TABLE contact_receipts RENAME TO contact_receipts_fixture_unavailable')
  try { const response = await submit({ ...form, email: 'outage@example.test', idempotencyKey: randomUUID() }); assert.equal(response.status, 503); assert.equal((await response.json()).accepted, false) }
  finally { await pool.query('ALTER TABLE contact_receipts_fixture_unavailable RENAME TO contact_receipts') }
  assert.equal((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count, '2')
  const home = await (await fetch(base + '/')).text(), contact = await (await fetch(base + '/contact/')).text()
  for (const html of [home, contact]) { assert.ok(!html.includes(form.message)); assert.ok(!html.includes(form.email)); assert.ok(!html.includes('RESEND_API_KEY')); assert.ok(!html.includes('Opens an email draft.')) }
  checks.push('Storage failures never return acceptance; form message/contact details and provider secrets are absent from public HTML')
  await payload.updateGlobal({ slug: 'site-settings', data: { homeFormHeading: 'Fixture inquiry form', nameLabel: 'Your full name', formHelp: 'Fixture helper text for the existing inquiry form.', acceptedMessage: 'Fixture next step: the owner will review this inquiry.', _status: 'published' }, user, overrideAccess: false })
  assert.ok((await (await fetch(base + '/')).text()).includes('Fixture inquiry form'))
  assert.ok((await (await fetch(base + '/contact/')).text()).includes('Your full name'))
  checks.push('Published owner form labels/help/next-step copy refresh on existing homepage and Contact routes without creating new pages')
  if (process.argv.includes('--browser')) {
    const signal = '.local/slice6-browser-ready.json'
    await writeFile(signal, JSON.stringify({ base, contactURL: base + '/contact/', homeURL: base + '/', adminURL: `${base}/admin/collections/inquiries/${inquiryID}`, ...login, reviewed: false }))
    for (let attempt = 0; attempt < 600; attempt++) { if (JSON.parse(await readFile(signal, 'utf8')).reviewed === true) break; await new Promise(resolve => setTimeout(resolve, 1000)) }
    await unlink(signal)
  }
  await writeFile('docs/slice6-http-checks.json', JSON.stringify({ result: 'passed', scope: 'Production build, loopback server, disposable UTF8 database. Outbound email disabled. No actual owner content was published and no new public pages were added.', checks }, null, 2) + '\n')
  console.log('Slice 6 contact HTTP checks passed without sending real email.')
}
