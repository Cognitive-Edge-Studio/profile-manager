import { getPayload } from 'payload'
import assert from 'node:assert/strict'
assert.equal(process.env.CMS_ENV, 'local')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const text = (node: any): string => typeof node?.text === 'string' ? node.text : (node?.children || []).map(text).join(' ')
try {
  const walk = (value: any, path: string, record: object, inHeading = false) => {
    if (Array.isArray(value)) return value.forEach((entry, i) => walk(entry, `${path}.${i}`, record, inHeading))
    if (!value || typeof value !== 'object') return
    if (value.type === 'heading' && text(value).includes('.')) console.log(JSON.stringify({ ...record, path, text: text(value) }))
    for (const [key, entry] of Object.entries(value)) {
      if (['sourceSnapshot', 'sourceId', 'editorialNotes'].includes(key)) continue
      if (['title', 'heading', 'socialTitle'].includes(key) && typeof entry === 'string' && entry.includes('.')) console.log(JSON.stringify({ ...record, path: path ? `${path}.${key}` : key, text: entry }))
      if (typeof entry === 'object') walk(entry, path ? `${path}.${key}` : key, record, inHeading || value.type === 'heading')
    }
  }
  for (const collection of ['pages', 'posts', 'projects', 'services'] as const) {
    for (const doc of (await payload.find({ collection, draft: true, depth: 0, pagination: false, limit: 100, overrideAccess: true })).docs) walk(doc, '', { collection, id: doc.id, title: doc.title })
  }
  walk(await payload.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: true }), '', { global: 'site-settings' })
} finally { await payload.destroy() }
process.exit(0)
