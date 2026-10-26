import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import { mkdir, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { cleanTitleDots, normalizeOwnerLinks } from '../src/domain/editorial.mjs'

assert.equal(process.env.CMS_ENV, 'local')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const apply = process.argv.includes('--apply')
try {
  const pages = (await payload.find({ collection: 'pages', draft: true, depth: 0, pagination: false, limit: 100, overrideAccess: true })).docs
  const home = pages.find(page => page.pageKey === 'home'), contact = pages.find(page => page.pageKey === 'contact')
  assert.ok(home && contact)
  assert.ok(home.sections?.some(section => section.sectionId === 'services'))
  const updates: any[] = []
  const editable = ['title', 'heading', 'eyebrow', 'introduction', 'body', 'sections', 'actions', 'meta', 'process', 'faqs', 'headerLinks', 'headerAction', 'footerLinks']
  const transform = (doc: any) => normalizeOwnerLinks(cleanTitleDots(doc), home.id, contact.id)
  for (const collection of ['pages', 'posts', 'projects', 'services'] as const) {
    const docs = collection === 'pages' ? pages : (await payload.find({ collection, draft: true, depth: 0, pagination: false, limit: 100, overrideAccess: true })).docs
    for (const doc of docs) {
      const normalized = transform(doc)
      const data = Object.fromEntries(editable.filter(key => key in doc && !isDeepStrictEqual((doc as any)[key], normalized[key])).map(key => [key, normalized[key]]))
      if (Object.keys(data).length) updates.push({ collection, id: doc.id, title: doc.title, before: doc, data })
    }
  }
  const settings = await payload.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: true })
  const normalizedSettings = transform(settings)
  const settingsData = Object.fromEntries(editable.filter(key => key in settings && !isDeepStrictEqual((settings as any)[key], normalizedSettings[key])).map(key => [key, normalizedSettings[key]]))
  console.log(JSON.stringify({ mode: apply ? 'apply-drafts' : 'dry-run', records: updates.map(({ collection, id, title, data }) => ({ collection, id, title, fields: Object.keys(data) })), settingsFields: Object.keys(settingsData) }, null, 2))
  if (apply && (updates.length || Object.keys(settingsData).length)) {
    const owner = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1, overrideAccess: true })).docs[0]
    assert.ok(owner)
    const user = { ...owner, collection: 'users' as const }
    await mkdir('.local/backups', { recursive: true })
    await writeFile(`.local/backups/editorial-updates-${Date.now()}.json`, JSON.stringify({ records: updates.map(({ collection, before }) => ({ collection, doc: before })), settings }, null, 2))
    for (const update of updates) {
      await payload.update({ collection: update.collection, id: update.id, data: { ...update.data, _status: 'draft' }, draft: true, user, overrideAccess: false })
      const saved: any = await payload.findByID({ collection: update.collection, id: update.id, draft: true, depth: 0, overrideAccess: true })
      assert.ok(isDeepStrictEqual(saved.sourceSnapshot, update.before.sourceSnapshot), 'Preserve the original source snapshot.')
      assert.ok(isDeepStrictEqual(transform(saved), saved), 'The update must be idempotent.')
    }
    if (Object.keys(settingsData).length) await payload.updateGlobal({ slug: 'site-settings', data: { ...settingsData, _status: 'draft' }, draft: true, user, overrideAccess: false })
    console.log('Saved requested headings and links as drafts. No pages created or published.')
  }
} finally { await payload.destroy() }
process.exit(0)
