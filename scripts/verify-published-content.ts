import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'
import { getPayload, type Payload } from 'payload'
import { importContent, buildImport } from '../migration/import-content'
import { fixtureUploadPaths, removeFixtureUploads } from '../tests/helpers/uploads'
import { verifySEO } from './verify-seo-http'
import { verifyContact } from './verify-contact-http'

if (process.env.CMS_ENV !== 'local') throw new Error('Local verification only.')
const originalURL = new URL(process.env.DATABASE_URL!)
assert.ok(['localhost', '127.0.0.1'].includes(originalURL.hostname))
const name = `cms_http_test_${Date.now()}`, maintenanceURL = new URL(originalURL); maintenanceURL.pathname = '/postgres'
const maintenance = new pg.Client({ connectionString: maintenanceURL.toString() }); await maintenance.connect()
await maintenance.query(`CREATE DATABASE "${name}" WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
const testURL = new URL(originalURL); testURL.pathname = `/${name}`; process.env.DATABASE_URL = testURL.toString(); process.env.CMS_ENV = 'test'
// Fixture browser sessions must never authenticate against the actual local CMS.
process.env.PAYLOAD_SECRET = randomBytes(48).toString('base64url')
const base = 'http://127.0.0.1:3002'
const seoMode = process.argv.includes('--seo')
const contactMode = process.argv.includes('--contact')
if (seoMode) process.env.SITE_URL = 'https://example.test'
let payload: Payload | undefined, server: ReturnType<typeof spawn> | undefined
const log: string[] = []
let testFiles: string[] = []
const visible = (html: string) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
try {
  const { default: config } = await import('../src/payload.config')
  payload = await getPayload({ config })
  assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name, 'The HTTP fixture must use its disposable database before any write')
  await payload.db.migrate(); await importContent(payload, { apply: true, uploadPrefix: name })
  const password = randomBytes(24).toString('base64url')
  const owner = await payload.create({ collection: 'users', data: { name: 'HTTP fixture owner', email: 'http-fixture@example.test', password, role: 'admin' }, overrideAccess: true, context: { localBootstrap: true } })
  const user = { ...owner, collection: 'users' as const }
  const serverOrigin = seoMode ? 'https://example.test' : base
  server = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3002'], { cwd: process.cwd(), env: { ...process.env, CMS_ENV: seoMode ? 'production' : 'local', PUBLIC_INDEXING_ENABLED: seoMode ? 'true' : 'false', CMS_SERVER_URL: serverOrigin, NEXT_PUBLIC_SERVER_URL: serverOrigin, CONTACT_SUBMISSIONS_ENABLED: contactMode ? 'true' : 'false', CONTACT_NOTIFICATION_PROVIDER: 'disabled', RESEND_API_KEY: '', CONTACT_NOTIFICATION_TO: '', CONTACT_WORKER_SECRET: '', CONTACT_TRUSTED_IP_HEADER: '' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout?.on('data', chunk => { log.push(chunk.toString()) }); server.stderr?.on('data', chunk => { log.push(chunk.toString()) })
  let ready = false
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch(base); if (response.status === 404) { ready = true; break } } catch {}
    if (server.exitCode !== null) throw new Error('Fixture server stopped: ' + log.join('').slice(-2500))
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert.ok(ready, 'Draft-only homepage must be unavailable')
  const login = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: serverOrigin }, body: JSON.stringify({ email: owner.email, password }) })
  assert.equal(login.status, 200)
  const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
  const headers = { Cookie: cookie, Origin: seoMode ? serverOrigin : 'http://127.0.0.1:3000' }
  const pages = (await payload.find({ collection: 'pages', draft: true, limit: 100, depth: 0, overrideAccess: true })).docs
  const home = pages.find(page => page.pageKey === 'home')!, about = pages.find(page => page.pageKey === 'about')!
  const previewURL = `${base}/preview?collection=pages&id=${home.id}`
  assert.equal((await fetch(previewURL, { redirect: 'manual' })).status, 307)
  const privatePreview = await fetch(previewURL, { headers, redirect: 'manual' })
  assert.equal(privatePreview.status, 200)
  assert.ok(privatePreview.headers.get('cache-control')?.includes('no-store'))
  assert.ok((await privatePreview.text()).includes('full-stack developer building'))
  const media = (await payload.find({ collection: 'media', depth: 0, limit: 100, overrideAccess: true })).docs
  const mediaURL = new URL(new URL(media[0].url!, base).pathname, base)
  assert.ok((await fetch(mediaURL)).status >= 400, 'Private original images cannot be fetched anonymously')
  assert.equal((await fetch(mediaURL, { headers })).status, 200)
  for (const file of media) await payload.update({ collection: 'media', id: file.id, data: { visibility: 'public' }, user, overrideAccess: false })
  const { rich: fixtureRich } = await buildImport(payload)
  for (const collection of ['pages', 'posts', 'services', 'projects'] as const) {
    const docs = (await payload.find({ collection, draft: true, limit: 100, depth: 0, overrideAccess: true })).docs
    for (const doc of docs) await payload.update({ collection, id: doc.id, data: { _status: 'published', ...(collection === 'services' ? { body: fixtureRich('Reviewed detail copy used only in this disposable fixture.'), detailsReviewed: true } : {}) }, user, overrideAccess: false })
  }
  const settings = await payload.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: true })
  await payload.updateGlobal({ slug: 'site-settings', data: { ...settings, _status: 'published' }, user, overrideAccess: false })
  for (const file of media) await payload.update({ collection: 'media', id: file.id, data: { visibility: 'public' }, user, overrideAccess: false })
  const parity = spawn(process.execPath, [resolve('scripts/verify-website.mjs')], { env: { ...process.env, SITE_TEST_BASE_URL: base, CONTENT_FIXTURE_TEST: 'true' }, windowsHide: true, stdio: 'inherit' })
  const [code] = await once(parity, 'exit'); assert.equal(code, 0, 'Published content must pass the original ten-route/manuscript checks')
  const { rich } = await buildImport(payload)
  const sections: any[] = structuredClone(home.sections || [])
  sections[0].heading = 'CMS edited section'; sections[0].sectionId = 'edited-section'
  sections[0].body = rich('## Editable heading\n\n[Edited anchor text](https://example.com/edited) with **bold** and *emphasis*.')
  sections[0].actions = [{ label: 'Edited internal button', kind: 'internal', page: { relationTo: 'pages', value: about.id }, fragment: 'purpose' }]
  sections[0].image = media[0].id; sections[0].imageAlt = 'Context-specific image description'
  ;[sections[0], sections[4]] = [sections[4], sections[0]]
  const change: any = { heading: 'Draft-only edited heading', sections, editorialNotes: 'PRIVATE_EDITORIAL_SENTINEL', actions: [{ label: 'Edited external button', kind: 'external', url: 'https://example.com/sponsor', newTab: true, relationship: 'sponsored' }] }
  await payload.update({ collection: 'pages', id: home.id, draft: true, data: change, user, overrideAccess: false })
  const publicBefore = await (await fetch(`${base}/?draft=true`, { headers })).text()
  assert.ok(!publicBefore.includes('Draft-only edited heading'), 'Even signed-in public requests must exclude draft revisions')
  const draft = await (await fetch(previewURL, { headers })).text()
  const draftVisible = visible(draft)
  for (const text of ['Draft-only edited heading', 'CMS edited section', 'Edited anchor text', 'Editable heading', 'Context-specific image description']) assert.ok(draftVisible.includes(text), `Draft preview: ${text}`)
  assert.ok(draftVisible.includes('href="https://example.com/edited"'))
  assert.ok(/href="https:\/\/example.com\/sponsor"[^>]*rel="[^"]*sponsored/.test(draftVisible) || /rel="[^"]*sponsored[^>]*href="https:\/\/example.com\/sponsor"/.test(draftVisible))
  assert.ok(draftVisible.includes(`/preview?collection=pages&amp;id=${about.id}#purpose`))
  assert.ok(draftVisible.indexOf('id="faqs"') < draftVisible.indexOf('id="edited-section"'), 'CMS section ordering must render')
  assert.ok(!draft.includes('PRIVATE_EDITORIAL_SENTINEL'), 'Private fields must stay out of HTML and RSC')
  await payload.update({ collection: 'pages', id: home.id, data: { ...change, _status: 'published' }, user, overrideAccess: false })
  const publicAfter = await (await fetch(base)).text()
  assert.ok(visible(publicAfter).includes('Draft-only edited heading')); assert.ok(visible(publicAfter).includes('href="/about/#purpose"'))
  assert.ok(!publicAfter.includes('PRIVATE_EDITORIAL_SENTINEL'))
  await payload.updateGlobal({ slug: 'site-settings', data: { headerLinks: settings.headerLinks?.map((link, i) => ({ ...link, label: i === 0 ? 'Edited navigation text' : link.label })), footerText: 'Edited footer text', _status: 'published' }, user, overrideAccess: false })
  const shell = visible(await (await fetch(base)).text())
  assert.ok(shell.includes('Edited navigation text')); assert.ok(shell.includes('Edited footer text'))
  const post = (await payload.find({ collection: 'posts', limit: 1, overrideAccess: true })).docs[0]
  await payload.update({ collection: 'posts', id: post.id, data: { _status: 'draft' }, user, overrideAccess: false })
  assert.equal((await fetch(`${base}/blog/${post.slug}/`)).status, 404)
  const listing = visible(await (await fetch(`${base}/blog/`)).text()); assert.ok(!listing.includes(post.title.replaceAll('&', '&amp;')))
  if (seoMode) await verifySEO({ payload, user, base, headers, rich, name })
  if (contactMode) await verifyContact({ payload, user, base, headers, name, login: { email: owner.email, password } })
  await writeFile('docs/slice4-publishing-checks.json', JSON.stringify({ result: 'passed', database: 'Disposable UTF8 fixture; removed after verification.', checks: ['draft-only public 404', 'authenticated full-design preview', 'private preview cache headers', 'private/public image access', 'ten published routes and complete manuscripts', 'signed-in public requests exclude drafts', 'edited headings, emphasis, anchor text, internal buttons and fragments', 'section order and image-description override', 'private editorial field isolation from HTML/RSC', 'published updates on next request', 'unpublished article 404 and listing removal'] }, null, 2) + '\n')
  console.log('Slice 4 HTTP lifecycle passed in a disposable database.')
} finally {
  await writeFile('.local/content-fixture-server.log', log.join(''))
  if (server && server.exitCode === null) { server.kill(); await once(server, 'exit') }
  if (payload) {
    assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name)
    testFiles = await fixtureUploadPaths(payload, name)
    await payload.destroy(); payload.db.pool?.on('error', (error: any) => { if (error.code !== '57P01' && error.message !== 'Connection terminated unexpectedly') throw error })
  }
  assert.match(name, /^cms_http_test_\d+$/)
  await maintenance.query(`DROP DATABASE "${name}" WITH (FORCE)`); await maintenance.end()
  await removeFixtureUploads(testFiles)
}
process.exit(0)


