import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'

assert.equal(process.env.CMS_ENV, 'local', 'Update only the local CMS.')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
try {
  const result = await payload.find({ collection: 'pages', where: { pageKey: { equals: 'blog' } }, draft: true, depth: 0, limit: 2, overrideAccess: true })
  assert.equal(result.docs.length, 1)
  const blog = result.docs[0], sections = structuredClone(blog.sections || [])
  const matching = sections.filter(section => section.sectionId === 'article-contact')
  assert.equal(matching.length, 1, 'The shared blog CTA must already exist.')
  const cta = matching[0], before = cta.actions || []
  const actions = before.filter(action => action.label?.trim().toLowerCase() !== 'book a meeting')
  assert.ok(actions.some(action => action.label === 'Contact me'), 'Retain the existing contact action.')
  if (actions.length !== before.length) {
    await mkdir('.local/backups', { recursive: true })
    await writeFile(`.local/backups/article-booking-${Date.now()}.json`, JSON.stringify({ id: blog.id, sections: blog.sections }, null, 2))
    const owner = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1, overrideAccess: true })).docs[0]
    assert.ok(owner)
    cta.actions = actions
    await payload.update({ collection: 'pages', id: blog.id, data: { sections, _status: 'draft' }, draft: true, user: { ...owner, collection: 'users' }, overrideAccess: false })
  }
  const saved = await payload.findByID({ collection: 'pages', id: blog.id, draft: true, depth: 0, overrideAccess: true })
  const updated = saved.sections?.find(section => section.sectionId === 'article-contact')
  assert.equal(updated?.heading, cta.heading)
  assert.deepEqual(updated?.actions?.map(action => action.label), actions.map(action => action.label))
  console.log('Removed Book a meeting from the shared Blog draft CTA; Contact me retained. No pages created or published.')
} finally { await payload.destroy() }
process.exit(0)
