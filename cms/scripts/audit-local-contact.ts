import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { readSite } from '../src/website/queries'

assert.equal(process.env.CMS_ENV, 'local')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const before = JSON.parse(await readFile('docs/slice5-local-import-state.json', 'utf8'))
const removed = await readFile('docs/service-page-removal.json', 'utf8').then(JSON.parse).catch(() => null)
const counts: Record<string, any> = {}
for (const collection of ['pages', 'services', 'projects', 'posts', 'media'] as const) {
  const docs = (await payload.find({ collection, limit: 1000, pagination: false, draft: true, depth: 0, overrideAccess: true, select: { sourceId: true, _status: true, visibility: true } as any })).docs
  counts[collection] = { records: docs.length, drafts: docs.filter((doc: any) => doc._status === 'draft').length, privateImages: docs.filter((doc: any) => doc.visibility === 'private').length }
  const expected = removed?.result === 'passed' && collection === 'pages' ? removed.remainingPages : removed?.result === 'passed' && collection === 'services' ? removed.remainingServicePages : before.counts[collection].imported
  assert.equal(docs.length, expected, 'Preserve the owner-reviewed content state, including requested service-page removal')
  assert.equal(collection === 'media' ? counts[collection].privateImages : counts[collection].drafts, docs.length)
}
const site = await readSite(payload)
assert.equal(site.pages.length + site.posts.length + site.services.length + site.projects.length + site.media.length, 0); assert.equal(site.settings, null)
const settings = await payload.findGlobal({ slug: 'site-settings', draft: true, overrideAccess: true, select: { _status: true } })
assert.equal(settings._status, 'draft')
const inquiries = await payload.count({ collection: 'inquiries', overrideAccess: true })
const expired = await payload.db.pool!.query('SELECT count(*) FROM inquiries WHERE expires_at <= now()')
const report = { result: 'passed', counts, settingsStatus: settings._status, publicProjectionEmpty: true, actualInquiryCount: inquiries.totalDocs, expiredInquiryCount: Number(expired.rows[0].count), noNewPublicPages: true, notificationRecipientConfigured: Boolean(process.env.CONTACT_NOTIFICATION_TO), notificationProvider: process.env.CONTACT_NOTIFICATION_PROVIDER || 'disabled', realEmailSentByVerification: false, note: 'Read-only local audit. All submissions, email transport simulations and deletion tests used disposable databases.' }
await writeFile('docs/slice6-local-state.json', JSON.stringify(report, null, 2) + '\n')
console.log(report)
await payload.destroy(); process.exit(0)
