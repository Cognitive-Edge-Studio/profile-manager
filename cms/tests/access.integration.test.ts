import assert from 'node:assert/strict'
import test from 'node:test'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import sharp from 'sharp'
import { getPayload, type Payload } from 'payload'

test('CMS roles, draft isolation, revisions and private administration on a disposable PostgreSQL database', async t => {
  if (process.env.CMS_ENV !== 'local') throw new Error('Integration tests must start from local configuration.')
  const originalURL = new URL(process.env.DATABASE_URL!)
  if (!['127.0.0.1', 'localhost'].includes(originalURL.hostname)) throw new Error('Integration tests require a loopback database.')
  const databaseName = `cms_access_test_${Date.now()}`
  const maintenanceURL = new URL(originalURL)
  maintenanceURL.pathname = '/postgres'
  const maintenance = new pg.Client({ connectionString: maintenanceURL.toString() })
  await maintenance.connect()
  await maintenance.query(`CREATE DATABASE "${databaseName}" WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
  const testURL = new URL(originalURL)
  testURL.pathname = `/${databaseName}`
  process.env.DATABASE_URL = testURL.toString()
  process.env.CMS_ENV = 'test'
  process.env.CMS_TEST_SCHEMA_PUSH = 'false'
  let payload: Payload | undefined
  try {
    const { default: config } = await import('../src/payload.config')
    payload = await getPayload({ config })
    await payload.db.migrate()
    const cms = payload
    const password = randomBytes(24).toString('base64url')

    await t.test('the empty-database first-user bypass cannot create a public administrator', async () => {
      await assert.rejects(cms.create({ collection: 'users', data: { name: 'Untrusted signup', email: 'outsider@example.test', password, role: 'admin' }, overrideAccess: true }), /Public account creation is disabled/)
      assert.equal((await cms.count({ collection: 'users', overrideAccess: true })).totalDocs, 0)
    })

    const adminDoc = await cms.create({ collection: 'users', data: { name: 'Test administrator', email: 'admin@example.test', password, role: 'admin' }, overrideAccess: true, context: { localBootstrap: true } })
    const admin = { ...adminDoc, collection: 'users' as const }
    const editorDoc = await cms.create({ collection: 'users', data: { name: 'Test editor', email: 'editor@example.test', password, role: 'editor' }, user: admin, overrideAccess: false })
    const editor = { ...editorDoc, collection: 'users' as const }
    const draft = await cms.create({ collection: 'pages', data: { title: 'Draft homepage', heading: 'Original approved heading', pageKey: 'home', _status: 'draft', editorialNotes: 'Private note' }, draft: true, user: admin, overrideAccess: false })

    await t.test('visitors cannot see drafts, versions, users, settings or inquiries', async () => {
      const docs = await cms.find({ collection: 'pages', draft: true, overrideAccess: false })
      assert.equal(docs.totalDocs, 0)
      await assert.rejects(cms.findVersions({ collection: 'pages', overrideAccess: false }))
      for (const collection of ['users', 'inquiries'] as const) await assert.rejects(cms.find({ collection, overrideAccess: false }))
      await assert.rejects(cms.findGlobal({ slug: 'site-settings', draft: true, overrideAccess: false }))
      await assert.rejects(cms.create({ collection: 'pages', data: { title: 'Unauthorized', pageKey: 'about', heading: 'Unauthorized' }, overrideAccess: false }))
    })

    await t.test('administrators publish content; public fields exclude source snapshots and notes', async () => {
      await cms.update({ collection: 'pages', id: draft.id, data: { title: 'Published homepage', _status: 'published' }, user: admin, overrideAccess: false })
      const result = await cms.find({ collection: 'pages', overrideAccess: false })
      assert.equal(result.totalDocs, 1)
      assert.equal(result.docs[0].title, 'Published homepage')
      assert.equal(result.docs[0].editorialNotes, undefined)
      assert.equal(result.docs[0].sourceSnapshot, undefined)
    })

    await t.test('editors cannot publish, unpublish via a direct update, delete, or change roles', async () => {
      await assert.rejects(cms.update({ collection: 'pages', id: draft.id, data: { _status: 'published' }, user: editor, overrideAccess: false }))
      await assert.rejects(cms.update({ collection: 'pages', id: draft.id, data: { _status: 'draft' }, user: editor, overrideAccess: false }))
      await assert.rejects(cms.delete({ collection: 'pages', id: draft.id, user: editor, overrideAccess: false }))
      const updated = await cms.update({ collection: 'users', id: editor.id, data: { role: 'admin', name: 'Renamed editor' }, user: editor, overrideAccess: false })
      assert.equal(updated.role, 'editor')
      await assert.rejects(cms.update({ collection: 'users', id: admin.id, data: { name: 'Other account' }, user: editor, overrideAccess: false }))
    })

    await t.test('an editor can save a draft revision without changing the published version', async () => {
      await cms.update({ collection: 'pages', id: draft.id, data: { title: 'Unpublished editor revision', _status: 'draft' }, draft: true, user: editor, overrideAccess: false })
      const publicDoc = await cms.findByID({ collection: 'pages', id: draft.id, overrideAccess: false })
      const draftDoc = await cms.findByID({ collection: 'pages', id: draft.id, draft: true, user: editor, overrideAccess: false })
      assert.equal(publicDoc.title, 'Published homepage')
      assert.equal(draftDoc.title, 'Unpublished editor revision')
      const anonymousDraftQuery = await cms.find({ collection: 'pages', draft: true, overrideAccess: false })
      assert.ok(anonymousDraftQuery.docs.every(doc => doc.title !== 'Unpublished editor revision'))
    })

    await t.test('restoring a published version cannot elevate editor publishing permissions', async () => {
      const versions = await cms.findVersions({ collection: 'pages', user: admin, overrideAccess: false, where: { parent: { equals: draft.id } }, limit: 30 })
      const publishedVersion = versions.docs.find(doc => doc.version._status === 'published')!
      assert.ok(publishedVersion)
      await assert.rejects(cms.restoreVersion({ collection: 'pages', id: publishedVersion.id, user: editor, overrideAccess: false }))
      await cms.restoreVersion({ collection: 'pages', id: publishedVersion.id, user: admin, overrideAccess: false })
      assert.equal((await cms.findByID({ collection: 'pages', id: draft.id, overrideAccess: false })).title, 'Published homepage')
    })

    await t.test('the last administrator cannot be deleted or demoted', async () => {
      await assert.rejects(cms.update({ collection: 'users', id: admin.id, data: { role: 'editor' }, user: admin, overrideAccess: false }), /at least one administrator/)
      await assert.rejects(cms.delete({ collection: 'users', id: admin.id, user: admin, overrideAccess: false }), /at least one administrator/)
    })

    await t.test('section anchors, page addresses and redirects are validated server-side', async () => {
      await assert.rejects(cms.create({ collection: 'services', data: { title: 'Bad address', slug: 'admin', category: 'Application Development', summary: 'Test summary', _status: 'published' }, user: admin, overrideAccess: false }))
      await assert.rejects(cms.update({ collection: 'pages', id: draft.id, data: { sections: [{ template: 'copy', heading: 'One', sectionId: 'same' }, { template: 'copy', heading: 'Two', sectionId: 'same' }] }, user: admin, overrideAccess: false }), /unique/)
      await assert.rejects(cms.create({ collection: 'redirects', data: { from: '/same/', to: '/same/' }, user: admin, overrideAccess: false }))
      await assert.rejects(cms.create({ collection: 'redirects', data: { from: '/old/', to: '/new/' }, user: editor, overrideAccess: false }))
    })

    await t.test('private images stay private and only administrators can make them public', async () => {
      const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }).png().toBuffer()
      const media = await cms.create({ collection: 'media', data: { alt: 'Disposable test image', visibility: 'private' }, file: { data: bytes, name: 'access-test.png', mimetype: 'image/png', size: bytes.length }, user: admin, overrideAccess: false })
      try {
        assert.equal((await cms.find({ collection: 'media', overrideAccess: false })).totalDocs, 0)
        const attempted = await cms.update({ collection: 'media', id: media.id, data: { visibility: 'public' }, user: editor, overrideAccess: false })
        assert.equal(attempted.visibility, 'private')
        await cms.update({ collection: 'media', id: media.id, data: { visibility: 'public' }, user: admin, overrideAccess: false })
        assert.equal((await cms.find({ collection: 'media', overrideAccess: false })).totalDocs, 1)
      } finally { await cms.delete({ collection: 'media', id: media.id, user: admin, overrideAccess: false }) }
    })
  } finally {
    await payload?.destroy()
    // Payload keeps pg clients after destroy. FORCE disconnects only this run's
    // disposable database; PostgreSQL reports the expected shutdown as 57P01.
    payload?.db.pool?.on('error', (error: any) => { if (error.code !== '57P01' && error.message !== 'Connection terminated unexpectedly') throw error })
    // Drop only the uniquely named test database created by this test run.
    assert.match(databaseName, /^cms_access_test_\d+$/)
    await maintenance.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
    await maintenance.end()
    process.env.DATABASE_URL = originalURL.toString()
    process.env.CMS_ENV = 'local'
  }
})

