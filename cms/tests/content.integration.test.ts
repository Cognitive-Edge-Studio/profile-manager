import assert from 'node:assert/strict'
import test from 'node:test'
import pg from 'pg'
import { getPayload, type Payload } from 'payload'
import { importContent, buildImport } from '../migration/import-content'
import { readSite, resolvedLink, mediaFor, textOf, grouped } from '../src/website/queries'
import { fixtureUploadPaths, removeFixtureUploads } from './helpers/uploads'

test('content import, published projection, and reference isolation', async t => {
  if (process.env.CMS_ENV !== 'local') throw new Error('Local tests only.')
  const original = new URL(process.env.DATABASE_URL!)
  assert.ok(['localhost','127.0.0.1'].includes(original.hostname))
  const name = `cms_content_test_${Date.now()}`, maintenanceURL = new URL(original); maintenanceURL.pathname = '/postgres'
  const maintenance = new pg.Client({ connectionString: maintenanceURL.toString() }); await maintenance.connect()
  await maintenance.query(`CREATE DATABASE "${name}" WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
  const testURL = new URL(original); testURL.pathname = `/${name}`; process.env.DATABASE_URL = testURL.toString(); process.env.CMS_ENV = 'test'
  let payload: Payload | undefined
  try {
    const { default: config } = await import('../src/payload.config')
    payload = await getPayload({ config })
    assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name, 'Stop before any mutation if this is not the disposable database')
    await payload.db.migrate()
    const cms = payload, privileged = { overrideAccess: true, context: { localBootstrap: true } }
    await t.test('dry run verifies every manuscript word without creating records', async () => {
      const report = await importContent(cms)
      assert.equal(report.entries.length, 15)
      assert.equal((await cms.count({ collection: 'pages', overrideAccess: true })).totalDocs, 0)
      const { entries } = await buildImport(cms)
      assert.equal(entries.filter(item => item.collection === 'services').length, 0, 'Do not recreate owner-deleted service pages')
      assert.ok(!entries.some(item => item.collection === 'pages' && item.data.pageKey === 'services'))
      assert.equal(entries.filter(item => item.collection === 'posts').length, 5)
      for (const entry of entries.filter(item => item.collection === 'posts')) assert.equal(entry.data.publishedAt, null)
    })
    await importContent(cms, { apply: true, uploadPrefix: name })
    const home = (await cms.find({ collection: 'pages', where: { pageKey: { equals: 'home' } }, draft: true, overrideAccess: true })).docs[0]
    const posts = (await cms.find({ collection: 'posts', draft: true, overrideAccess: true, limit: 100 })).docs
    await t.test('imports remain drafts, images private, and public projection empty', async () => {
      const site = await readSite(cms)
      assert.equal(site.pages.length, 0); assert.equal(site.posts.length, 0); assert.equal(site.media.length, 0); assert.equal(site.settings, null)
      assert.ok(posts.every(post => !post.publishedAt && post._status === 'draft'))
    })
    await t.test('repeated imports retain editorial changes, IDs, snapshots and update times', async () => {
      await cms.update({ collection: 'pages', id: home.id, draft: true, data: { heading: 'An edited heading' }, ...privileged })
      const before = await cms.findByID({ collection: 'pages', id: home.id, draft: true, overrideAccess: true })
      const counts = await Promise.all(['pages','services','posts','projects','media'].map(collection => cms.count({ collection: collection as any, overrideAccess: true })))
      const report = await importContent(cms, { apply: true })
      assert.ok(report.entries.every(entry => entry.action === 'retain'))
      const after = await cms.findByID({ collection: 'pages', id: home.id, draft: true, overrideAccess: true })
      assert.equal(after.heading, 'An edited heading'); assert.equal(after.updatedAt, before.updatedAt)
      assert.deepEqual(after.sourceSnapshot, before.sourceSnapshot)
      assert.deepEqual(await Promise.all(['pages','services','posts','projects','media'].map(collection => cms.count({ collection: collection as any, overrideAccess: true }))), counts)
    })
    const userDoc = await cms.create({ collection: 'users', data: { name: 'Fixture owner', email: 'fixture@example.test', password: 'fixture-password-only-for-disposable-db', role: 'admin' }, ...privileged })
    const user = { ...userDoc, collection: 'users' }
    await t.test('authenticated previews include drafts but never source snapshots or editorial notes', async () => {
      const site = await readSite(cms, user)
      assert.equal(site.pages.length, 5); assert.equal(site.posts.length, 5); assert.equal(site.services.length, 0); assert.equal(site.projects.length, 4); assert.equal(site.media.length, 3)
      const homeServices = site.pages.find(page => page.pageKey === 'home').sections.find((section: any) => section.template === 'services')
      const cards = grouped(homeServices.body).items.flatMap(category => grouped(category.nodes, 'h4').items)
      assert.equal(cards.length, 9, 'Preserve all original homepage service summaries without standalone pages')
      assert.ok(!JSON.stringify(site).includes('sourceSnapshot')); assert.ok(!JSON.stringify(site).includes('editorialNotes'))
      assert.equal(site.pages.find(page => page.id === home.id).heading, 'An edited heading')
      assert.equal(resolvedLink(site, site.settings.headerLinks[0])?.href, '/#services')
      await assert.rejects(readSite(cms, { role: 'admin' }), /authenticated editor/)
    })
    await cms.update({ collection: 'pages', id: home.id, data: { _status: 'published', heroImage: null }, user, overrideAccess: false })
    const settings = await cms.findGlobal({ slug: 'site-settings', draft: true, overrideAccess: true })
    await cms.updateGlobal({ slug: 'site-settings', data: { ...settings, headerLinks: [], headerAction: [], footerLinks: [], portrait: null, avatar: null, workspaceImage: null, _status: 'published' }, user, overrideAccess: false })
    await t.test('public reads retain published content while newer revisions stay private', async () => {
      await cms.update({ collection: 'pages', id: home.id, draft: true, data: { heading: 'Private newer draft' }, user, overrideAccess: false })
      await cms.updateGlobal({ slug: 'site-settings', draft: true, data: { name: 'Private profile draft' }, user, overrideAccess: false })
      const site = await readSite(cms)
      assert.equal(site.pages[0].heading, 'An edited heading'); assert.equal(site.settings?.name, settings.name)
      assert.ok(!JSON.stringify(site).includes('Private newer draft')); assert.equal(site.posts.length, 0)
      const link = { kind: 'internal', label: 'Go', page: { relationTo: 'pages', value: home.id }, fragment: 'services' }
      assert.equal(resolvedLink(site, link)?.href, '/#services')
      assert.equal(resolvedLink(site, { ...link, page: { relationTo: 'posts', value: posts[0].id } }), undefined)
      assert.equal(resolvedLink(site, { ...link, page: { relationTo: 'pages', value: 999999 } }), undefined)
      assert.equal(resolvedLink(site, { url: 'javascript:alert(1)' }), undefined)
      assert.equal(mediaFor(site, settings.avatar), undefined)
    })
    await t.test('explicit source update saves a draft and leaves the published revision intact', async () => {
      await importContent(cms, { apply: true, update: true })
      assert.equal((await readSite(cms)).pages[0].heading, 'An edited heading')
      assert.ok(textOf((await readSite(cms, user)).pages.find(page => page.id === home.id).introduction).startsWith("I'm Shibly"))
    })
  } finally {
    let files: string[] = []
    if (payload) {
      assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name)
      files = await fixtureUploadPaths(payload, name)
      await payload.destroy(); payload.db.pool?.on('error', (error: any) => { if (error.code !== '57P01' && error.message !== 'Connection terminated unexpectedly') throw error })
    }
    await maintenance.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()', [name])
    await maintenance.query(`DROP DATABASE "${name}"`); await maintenance.end()
    await removeFixtureUploads(files)
  }
})


