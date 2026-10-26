import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'

assert.equal(process.env.CMS_ENV, 'local', 'This update is for the local CMS only.')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
try {
  const pages = await payload.find({ collection: 'pages', where: { pageKey: { equals: 'blog' } }, draft: true, depth: 0, limit: 2, overrideAccess: true })
  assert.equal(pages.docs.length, 1, 'Update only the existing Blog page.')
  const blog = pages.docs[0], sections = structuredClone(blog.sections || [])
  const matches = sections.filter(section => section.sectionId === 'article-contact')
  assert.equal(matches.length, 1, 'The shared article CTA must already exist.')
  const heading = 'Hire Shibly as your developer'
  const oldCopy = 'Work directly with me to turn your idea into useful software or improve a product you already have.'
  const copy = 'Work directly with Shibly to turn your idea into useful software or improve a product you already have.'
  const beforeBody = JSON.stringify(matches[0].body)
  const replaceCopy = (node: any) => {
    if (node?.type === 'text' && typeof node.text === 'string') node.text = node.text.replace(oldCopy, copy)
    for (const child of node?.children || node?.root?.children || []) replaceCopy(child)
  }
  replaceCopy(matches[0].body)
  assert.ok(JSON.stringify(matches[0].body).includes(copy), 'The CTA must contain the requested third-person copy.')
  if (matches[0].heading !== heading || beforeBody !== JSON.stringify(matches[0].body)) {
    await mkdir('.local/backups', { recursive: true })
    await writeFile(`.local/backups/article-cta-${Date.now()}.json`, JSON.stringify({ id: blog.id, sections: blog.sections }, null, 2))
    const owner = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1, overrideAccess: true })).docs[0]
    assert.ok(owner)
    matches[0].heading = heading
    await payload.update({ collection: 'pages', id: blog.id, data: { sections, _status: 'draft' }, draft: true, overrideAccess: false, user: { ...owner, collection: 'users' } })
  }
  const saved = await payload.findByID({ collection: 'pages', id: blog.id, draft: true, depth: 0, overrideAccess: true })
  assert.equal(saved.sections?.find(section => section.sectionId === 'article-contact')?.heading, heading)
  assert.ok(JSON.stringify(saved.sections?.find(section => section.sectionId === 'article-contact')?.body).includes(copy))
  console.log('Updated the shared Blog draft CTA heading and third-person copy. No pages created or published.')
} finally { await payload.destroy() }
process.exit(0)
