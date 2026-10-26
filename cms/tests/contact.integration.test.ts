import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { getPayload, type Payload } from 'payload'
import { storeInquiry, ContactFailure } from '../src/contact-store'
import { contactMaintenance, processNotifications, retryNotification, resendNotification } from '../src/contact-notifications'

test('durable contact acceptance, private administration, rate limits, notification retries and retention', async t => {
  assert.equal(process.env.CMS_ENV, 'local')
  const source = new URL(process.env.DATABASE_URL!); assert.ok(['localhost', '127.0.0.1'].includes(source.hostname))
  const name = `cms_contact_test_${Date.now()}`, maintenanceURL = new URL(source); maintenanceURL.pathname = '/postgres'
  const maintenance = new pg.Client({ connectionString: maintenanceURL.toString() }); await maintenance.connect()
  await maintenance.query(`CREATE DATABASE "${name}" WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
  const url = new URL(source); url.pathname = '/' + name; process.env.DATABASE_URL = url.toString(); process.env.CMS_ENV = 'test'; process.env.SITE_URL = 'https://example.test'; process.env.CONTACT_NOTIFICATION_PROVIDER = 'disabled'
  let payload: Payload | undefined
  try {
    const { default: config } = await import('../src/payload.config'); payload = await getPayload({ config })
    assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name)
    await payload.db.migrate(); const cms = payload, pool = cms.db.pool!
    const owner = await cms.create({ collection: 'users', data: { name: 'Fixture owner', email: 'contact-owner@example.test', password: 'disposable-contact-fixture-password', role: 'admin' }, overrideAccess: true, context: { localBootstrap: true } })
    const user = { ...owner, collection: 'users' as const }
    const editorDoc = await cms.create({ collection: 'users', data: { name: 'Fixture editor', email: 'contact-editor@example.test', password: 'disposable-contact-editor-password', role: 'editor' }, user, overrideAccess: false })
    const editor = { ...editorDoc, collection: 'users' as const }
    await cms.create({ collection: 'pages', data: { title: 'Home', heading: 'Home', pageKey: 'home', _status: 'published' }, user, overrideAccess: false })
    const contact = await cms.create({ collection: 'pages', data: { title: 'Contact', heading: 'Contact', pageKey: 'contact', _status: 'published' }, user, overrideAccess: false })
    await cms.updateGlobal({ slug: 'site-settings', data: { name: 'Fixture owner', role: 'Engineer', email: 'contact@example.test', _status: 'published' }, user, overrideAccess: false })
    const data = { name: 'Fixture visitor', email: 'visitor@example.test', message: 'Private fixture inquiry with a reviewed calculator summary.', budget: 'Fixture budget', timeline: 'Fixture timeline', source: 'contact' }
    const key = randomUUID()
    let primaryID: number
    await t.test('concurrent identical retries create one inquiry, conflicting retries fail, and deleted receipts do not resurrect', async () => {
      const results = await Promise.all(Array.from({ length: 8 }, () => storeInquiry(cms, data, key, randomUUID(), 'fixture-network')))
      assert.equal(results.filter(result => !result.duplicate).length, 1); primaryID = results.find(result => result.id)!.id!
      assert.equal((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count, '1')
      await assert.rejects(storeInquiry(cms, { ...data, message: 'Different inquiry text.' }, key, randomUUID()), (error: any) => error instanceof ContactFailure && error.status === 409)
      const deletedKey = randomUUID(), stored = await storeInquiry(cms, { ...data, email: 'deleted@example.test' }, deletedKey, randomUUID())
      await cms.delete({ collection: 'inquiries', id: stored.id!, user, overrideAccess: false })
      assert.equal((await storeInquiry(cms, { ...data, email: 'deleted@example.test' }, deletedKey, randomUUID())).duplicate, true)
      assert.equal((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count, '1')
    })
    await t.test('notification failure never loses acceptance and administrators alone manage original submissions', async () => {
      const before = (await pool.query('SELECT updated_at FROM inquiries WHERE id=$1', [primaryID])).rows[0].updated_at
      await processNotifications(cms, { onlyID: primaryID, limit: 1 })
      const row = (await pool.query('SELECT * FROM inquiries WHERE id=$1', [primaryID])).rows[0]
      assert.equal(row.notification_status, 'failed'); assert.equal(row.notification_error, 'not-configured'); assert.equal(row.message, data.message)
      assert.equal(row.updated_at.getTime(), before.getTime(), 'Delivery bookkeeping must not invalidate the owner workflow form')
      await assert.rejects(cms.find({ collection: 'inquiries', overrideAccess: false }))
      await assert.rejects(cms.find({ collection: 'inquiries', user: editor, overrideAccess: false }))
      await assert.rejects(cms.create({ collection: 'inquiries', data: data as any, overrideAccess: false }))
      await cms.update({ collection: 'inquiries', id: primaryID, data: { status: 'read', notificationStatus: 'sent', message: 'Tampered' }, user, overrideAccess: false })
      const saved = await cms.findByID({ collection: 'inquiries', id: primaryID, user, overrideAccess: false })
      assert.equal(saved.status, 'read'); assert.equal(saved.message, data.message); assert.equal(saved.notificationStatus, 'failed'); assert.equal(saved.idempotencyKey, undefined); assert.equal(saved.notificationEnvelope, undefined)
    })
    await t.test('rate limits persist in PostgreSQL and store only keyed digests', async () => {
      for (let i = 0; i < 4; i++) await storeInquiry(cms, data, randomUUID(), randomUUID())
      await assert.rejects(storeInquiry(cms, data, randomUUID(), randomUUID()), (error: any) => error.status === 429 && error.retryAfter > 0)
      const counters = (await pool.query('SELECT key FROM contact_rate_limits')).rows
      assert.ok(counters.every(row => /^[a-f0-9]{64}$/.test(row.key)))
    })
    await t.test('local capture and concurrent workers cannot notify a saved inquiry twice', async () => {
      process.env.CONTACT_NOTIFICATION_PROVIDER = 'capture'; assert.equal(await retryNotification(cms, primaryID), true)
      const runs = await Promise.all([processNotifications(cms, { onlyID: primaryID }), processNotifications(cms, { onlyID: primaryID })])
      assert.equal(runs.reduce((sum, result) => sum + result.captured, 0), 1)
      assert.equal(await retryNotification(cms, primaryID), false)
    })
    await t.test('transient sends retry the same envelope/key, preserve privacy, then stop after provider acceptance', async () => {
      process.env.CONTACT_NOTIFICATION_PROVIDER = 'resend'; process.env.RESEND_API_KEY = 'fixture-not-a-real-key'; process.env.CONTACT_NOTIFICATION_FROM = 'sender@example.test'; process.env.CONTACT_NOTIFICATION_TO = 'recipient@example.test, second@example.test'
      const target = await storeInquiry(cms, { ...data, email: 'transport@example.test' }, randomUUID(), randomUUID())
      const sent: any[] = []
      const transport = async (envelope: any, key: string) => { sent.push({ envelope, key }); if (sent.length === 1) throw new Error('temporary'); return { id: 'fixture-provider-id' } }
      await processNotifications(cms, { onlyID: target.id, transport })
      assert.deepEqual(sent[0].envelope.to, ['recipient@example.test', 'second@example.test'])
      assert.equal((await processNotifications(cms, { onlyID: target.id, transport })).claimed, 0)
      process.env.CONTACT_NOTIFICATION_TO = 'changed@example.test'
      await pool.query(`UPDATE inquiries SET next_attempt_at = now() - interval '1 minute' WHERE id=$1`, [target.id])
      await Promise.all([processNotifications(cms, { onlyID: target.id, transport }), processNotifications(cms, { onlyID: target.id, transport })])
      assert.equal(sent.length, 2); assert.deepEqual(sent[0], sent[1]); assert.ok(!JSON.stringify(sent).includes(data.name)); assert.ok(!JSON.stringify(sent).includes(data.message)); assert.ok(!JSON.stringify(sent).includes('transport@example.test'))
      assert.equal((await pool.query('SELECT notification_status FROM inquiries WHERE id=$1', [target.id])).rows[0].notification_status, 'sent')
      assert.equal((await processNotifications(cms, { onlyID: target.id, transport })).claimed, 0)
      assert.equal(await retryNotification(cms, target.id!), false)
    })
    await t.test('ambiguous old attempts stop for review instead of re-sending after provider idempotency expires', async () => {
      const target = await storeInquiry(cms, { ...data, email: 'ambiguous@example.test' }, randomUUID(), randomUUID())
      await pool.query(`UPDATE inquiries SET first_send_at = now() - interval '25 hours' WHERE id=$1`, [target.id])
      let sent = false
      await processNotifications(cms, { onlyID: target.id, transport: async () => { sent = true; return { id: 'must-not-send' } } })
      assert.equal(sent, false); assert.equal(await retryNotification(cms, target.id!), false)
      assert.equal((await pool.query('SELECT notification_status FROM inquiries WHERE id=$1', [target.id])).rows[0].notification_status, 'review')
    })
    await t.test('email adapter uses the fixed provider endpoint/idempotency header and distinguishes transient failures', async () => {
      let status = 200, body: any = { id: 'fixture-provider-response' }
      const transport = t.mock.method(globalThis, 'fetch', async (url: any, options: any) => {
        assert.equal(url, 'https://api.resend.com/emails'); assert.equal(options.headers['Idempotency-Key'], 'fixture-key'); assert.ok(options.signal)
        return Response.json(body, { status })
      })
      try {
        assert.equal((await resendNotification({ from: 'sender@example.test', to: ['recipient@example.test'], subject: 'Fixture', text: 'A private dashboard link.' }, 'fixture-key')).id, 'fixture-provider-response')
        status = 429; await assert.rejects(resendNotification({}, 'fixture-key'), /temporary/)
        status = 401; await assert.rejects(resendNotification({}, 'fixture-key'), /rejected/)
        status = 200; body = {}; await assert.rejects(resendNotification({}, 'fixture-key'), /temporary/)
      } finally { transport.mock.restore() }
    })
    await t.test('scheduled deletion removes expired inquiries while preserving a brief duplicate-prevention receipt', async () => {
      process.env.CONTACT_NOTIFICATION_PROVIDER = 'disabled'
      const expiryKey = randomUUID(), expiryData = { ...data, email: 'expiry@example.test' }, target = await storeInquiry(cms, expiryData, expiryKey, randomUUID())
      await pool.query(`UPDATE inquiries SET expires_at = now() - interval '1 day' WHERE id=$1`, [target.id])
      const result = await contactMaintenance(cms)
      assert.equal(result.deletedExpired, 1); assert.equal((await pool.query('SELECT id FROM inquiries WHERE id=$1', [target.id])).rowCount, 0)
      assert.equal((await storeInquiry(cms, expiryData, expiryKey, randomUUID())).duplicate, true)
    })
    await t.test('unpublished forms fail closed without accepting new inquiries', async () => {
      await cms.update({ collection: 'pages', id: contact.id, data: { _status: 'draft' }, user, overrideAccess: false })
      await assert.rejects(storeInquiry(cms, { ...data, email: 'offline@example.test' }, randomUUID(), randomUUID()), (error: any) => error.status === 503)
    })
  } finally {
    if (payload) { assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name); await payload.destroy(); payload.db.pool?.on('error', (error: any) => { if (error.code !== '57P01' && error.message !== 'Connection terminated unexpectedly') throw error }) }
    assert.match(name, /^cms_contact_test_\d+$/); await maintenance.query(`DROP DATABASE "${name}" WITH (FORCE)`); await maintenance.end()
  }
})


