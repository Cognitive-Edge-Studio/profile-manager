import assert from 'node:assert/strict'
import test from 'node:test'
import pg from 'pg'
import sharp from 'sharp'
import { getPayload, type Payload } from 'payload'
import { readiness } from '../src/publishing'
import { routingSnapshot, activeRedirect } from '../src/routing'
import { fixtureUploadPaths, removeFixtureUploads } from './helpers/uploads'

const rich = (text: string) => ({ root: { type: 'root', version: 1, format: '' as const, indent: 0, direction: null, children: [{ type: 'paragraph', version: 1, format: '', indent: 0, direction: null, children: [{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }] }] } })
test('service publishing, required references, images and transactional slug redirects', async t => {
  assert.equal(process.env.CMS_ENV, 'local')
  const source = new URL(process.env.DATABASE_URL!); assert.ok(['localhost','127.0.0.1'].includes(source.hostname))
  const name = `cms_seo_test_${Date.now()}`, adminURL = new URL(source); adminURL.pathname = '/postgres'
  const maintenance = new pg.Client({ connectionString: adminURL.toString() }); await maintenance.connect()
  await maintenance.query(`CREATE DATABASE "${name}" WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
  const url = new URL(source); url.pathname = '/' + name; process.env.DATABASE_URL = url.toString(); process.env.CMS_ENV = 'test'; process.env.SITE_URL = 'https://example.test'
  let payload: Payload | undefined, files: string[] = []
  try {
    const { default: config } = await import('../src/payload.config')
    payload = await getPayload({ config }); assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name)
    await payload.db.migrate(); const cms = payload
    const owner = await cms.create({ collection: 'users', data: { name: 'Fixture owner', email: 'seo-fixture@example.test', password: 'disposable-fixture-password-only', role: 'admin' }, overrideAccess: true, context: { localBootstrap: true } })
    const user = { ...owner, collection: 'users' as const }
    const editorDoc = await cms.create({ collection: 'users', data: { name: 'Fixture editor', email: 'seo-editor@example.test', password: 'disposable-editor-password-only', role: 'editor' }, user, overrideAccess: false })
    const editor = { ...editorDoc, collection: 'users' as const }
    const home = await cms.create({ collection: 'pages', data: { title: 'Home', heading: 'Fixture homepage', pageKey: 'home', _status: 'published' }, user, overrideAccess: false })
    const about = await cms.create({ collection: 'pages', data: { title: 'About', heading: 'Fixture about page', pageKey: 'about', sections: [{ template: 'copy', sectionId: 'process', heading: 'Process', body: rich('Visible process copy.') }], _status: 'published' }, user, overrideAccess: false })
    await cms.updateGlobal({ slug: 'site-settings', data: { name: 'Fixture owner', role: 'Engineer', email: 'fixture@example.test', headerLinks: [{ label: 'Home', kind: 'internal', page: { relationTo: 'pages', value: home.id } }], _status: 'published' }, user, overrideAccess: false })
    const service = await cms.create({ collection: 'services', data: { title: 'Fixture service', slug: 'fixture-service', summary: 'A summary for an isolated test.', category: 'Application Development', _status: 'draft' }, draft: true, user, overrideAccess: false })
    await t.test('missing detail/review blocks publishing, including draft=true with published status', async () => {
      const report = await readiness(cms, 'services', service)
      assert.ok(report.issues.some(issue => issue.field === 'body' && issue.severity === 'error'))
      assert.ok(report.issues.some(issue => issue.field === 'detailsReviewed' && issue.severity === 'error'))
      await assert.rejects(cms.update({ collection: 'services', id: service.id, data: { _status: 'published' }, user, overrideAccess: false }))
      await assert.rejects(cms.update({ collection: 'services', id: service.id, draft: true, data: { _status: 'published' }, user, overrideAccess: false }))
      await cms.update({ collection: 'services', id: service.id, draft: true, data: { body: rich('Reviewed detail copy for a fixture service.'), detailsReviewed: true }, user: editor, overrideAccess: false })
      await assert.rejects(cms.update({ collection: 'services', id: service.id, data: { _status: 'published' }, user: editor, overrideAccess: false }))
    })
    const approved = { body: rich('Reviewed detail copy for a fixture service.'), detailsReviewed: true, _status: 'published' as const }
    await cms.update({ collection: 'services', id: service.id, data: approved, user, overrideAccess: false })
    await cms.updateGlobal({ slug: 'site-settings', data: { headerLinks: [{ label: 'Service', kind: 'internal', page: { relationTo: 'services', value: service.id } }], _status: 'published' }, user, overrideAccess: false })
    await t.test('draft slug changes do not redirect; published changes create one-hop redirects and restore old addresses', async () => {
      await cms.update({ collection: 'services', id: service.id, draft: true, data: { slug: 'fixture-service-two' }, user, overrideAccess: false })
      assert.equal((await cms.findByID({ collection: 'services', id: service.id, draft: false, overrideAccess: true })).slug, 'fixture-service')
      assert.equal((await cms.count({ collection: 'redirects', overrideAccess: true })).totalDocs, 0)
      await cms.update({ collection: 'services', id: service.id, data: { ...approved, slug: 'fixture-service-two' }, user, overrideAccess: false })
      let redirects = (await cms.find({ collection: 'redirects', overrideAccess: true, depth: 0 })).docs
      assert.equal(redirects.length, 1); assert.equal(redirects[0].from, '/services/fixture-service/'); assert.equal(redirects[0].to, '/services/fixture-service-two/')
      await cms.update({ collection: 'services', id: service.id, data: { ...approved, slug: 'fixture-service-three' }, user, overrideAccess: false })
      redirects = (await cms.find({ collection: 'redirects', overrideAccess: true, depth: 0 })).docs
      assert.equal(redirects.length, 2); assert.ok(redirects.every(redirect => redirect.to === '/services/fixture-service-three/'))
      await cms.update({ collection: 'services', id: service.id, data: { ...approved, slug: 'fixture-service' }, user, overrideAccess: false })
      redirects = (await cms.find({ collection: 'redirects', overrideAccess: true, depth: 0 })).docs
      assert.equal(redirects.length, 2); assert.ok(!redirects.some(redirect => redirect.from === '/services/fixture-service/')); assert.ok(redirects.every(redirect => redirect.to === '/services/fixture-service/'))
    })
    await t.test('redirect sources cannot shadow pages, form chains, or collide with a published slug', async () => {
      await cms.create({ collection: 'redirects', data: { from: '/services/reserved-address/', to: '/services/fixture-service/' }, user, overrideAccess: false })
      await assert.rejects(cms.update({ collection: 'services', id: service.id, data: { ...approved, slug: 'reserved-address' }, user, overrideAccess: false }))
      assert.equal((await cms.findByID({ collection: 'services', id: service.id, draft: false, overrideAccess: true })).slug, 'fixture-service')
      await assert.rejects(cms.create({ collection: 'redirects', data: { from: '/contact/', to: '/' }, user, overrideAccess: false }))
      await assert.rejects(cms.create({ collection: 'redirects', data: { from: '/chain/', to: '/services/reserved-address/' }, user, overrideAccess: false }))
      await assert.rejects(cms.create({ collection: 'redirects', data: { from: '/%61dmin/', to: '/' }, user, overrideAccess: false }))
    })
    await t.test('required links and fragments guard publication, unpublish, deletion and section edits', async () => {
      const action: any = { label: 'Process', kind: 'internal', page: { relationTo: 'pages', value: about.id }, fragment: 'missing', requiredForPublishing: true }
      await assert.rejects(cms.update({ collection: 'services', id: service.id, data: { ...approved, actions: [action] }, user, overrideAccess: false }))
      action.fragment = 'process'
      await cms.update({ collection: 'services', id: service.id, data: { ...approved, actions: [action] }, user, overrideAccess: false })
      await assert.rejects(cms.update({ collection: 'pages', id: about.id, data: { sections: [{ template: 'copy', heading: 'Changed', sectionId: 'changed' }] }, user, overrideAccess: false }))
      await assert.rejects(cms.update({ collection: 'pages', id: about.id, data: { _status: 'draft' }, user, overrideAccess: false }))
      await assert.rejects(cms.delete({ collection: 'pages', id: about.id, user, overrideAccess: false }))
      await cms.update({ collection: 'services', id: service.id, data: { ...approved, actions: [] }, user, overrideAccess: false })
      await cms.update({ collection: 'pages', id: about.id, data: { _status: 'draft' }, user, overrideAccess: false })
    })
    await t.test('private sharing images cannot be published, and required published image references prevent removal', async () => {
      const bytes = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#ffffff' } }).png().toBuffer()
      const image = await cms.create({ collection: 'media', data: { alt: 'Fixture image', visibility: 'private' }, file: { data: bytes, name: name + '-image.png', mimetype: 'image/png', size: bytes.length }, user, overrideAccess: false })
      await assert.rejects(cms.updateGlobal({ slug: 'site-settings', data: { meta: { image: image.id }, _status: 'published' }, user, overrideAccess: false }))
      await cms.update({ collection: 'media', id: image.id, data: { visibility: 'public' }, user, overrideAccess: false })
      await cms.updateGlobal({ slug: 'site-settings', data: { meta: { image: image.id }, _status: 'published' }, user, overrideAccess: false })
      const effective = await readiness(cms, 'services', await cms.findByID({ collection: 'services', id: service.id, overrideAccess: true }))
      assert.ok(effective.effective.image, 'The owner panel must resolve the published site sharing-image default')
      await assert.rejects(cms.update({ collection: 'media', id: image.id, data: { visibility: 'private' }, user, overrideAccess: false }))
      await assert.rejects(cms.delete({ collection: 'media', id: image.id, user, overrideAccess: false }))
      await cms.updateGlobal({ slug: 'site-settings', data: { meta: { image: null }, _status: 'published' }, user, overrideAccess: false })
      await cms.update({ collection: 'media', id: image.id, data: { visibility: 'private' }, user, overrideAccess: false })
    })
    await t.test('unpublished targets stop their managed redirects after required navigation is updated', async () => {
      await assert.rejects(cms.update({ collection: 'services', id: service.id, data: { _status: 'draft' }, user, overrideAccess: false }))
      await cms.updateGlobal({ slug: 'site-settings', data: { headerLinks: [], _status: 'published' }, user, overrideAccess: false })
      await cms.update({ collection: 'services', id: service.id, data: { _status: 'draft' }, user, overrideAccess: false })
      const snapshot = await routingSnapshot(cms)
      assert.ok(snapshot.redirects.filter(redirect => redirect.managedTarget).every(redirect => activeRedirect(redirect, snapshot) === undefined))
    })
  } finally {
    if (payload) { files = await fixtureUploadPaths(payload, name); await payload.destroy(); payload.db.pool?.on('error', (error: any) => { if (error.code !== '57P01' && error.message !== 'Connection terminated unexpectedly') throw error }) }
    assert.match(name, /^cms_seo_test_\d+$/)
    await maintenance.query(`DROP DATABASE "${name}" WITH (FORCE)`); await maintenance.end(); await removeFixtureUploads(files)
  }
})

