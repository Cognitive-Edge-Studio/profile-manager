import { getPayload } from 'payload'
import assert from 'node:assert/strict'
assert.equal(process.env.CMS_ENV, 'local')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const text = (node: any): string => typeof node?.text === 'string' ? node.text : (node?.children || []).map(text).join(' ')
try {
  for (const collection of ['pages', 'posts'] as const) {
    const docs = (await payload.find({ collection, draft: true, depth: 0, pagination: false, limit: 100, overrideAccess: true })).docs
    for (const doc of docs) {
      const walk = (value: any, path: string) => {
        if (Array.isArray(value)) return value.forEach((entry, i) => walk(entry, `${path}.${i}`))
        if (!value || typeof value !== 'object') return
        const lexical = ['link', 'autolink'].includes(value.type)
        const action = typeof value.kind === 'string' && typeof value.label === 'string'
        if (lexical || action) {
          const label = lexical ? text(value) : value.label, fields = lexical ? value.fields || { url: value.url } : value
          if (/services|contact|quer(?:y|ies)|inquir(?:y|ies)|get in touch|talk|discuss|message|tell me/i.test(label) || /services|contact|inquiry|query|shibly/i.test(fields.url || '')) console.log(JSON.stringify({ collection, id: doc.id, title: doc.title, path, label, fields }))
        }
        for (const [key, entry] of Object.entries(value)) if (!['sourceSnapshot', 'sourceId', 'editorialNotes', 'meta'].includes(key)) walk(entry, path ? `${path}.${key}` : key)
      }
      walk(doc, '')
    }
  }
  const settings = await payload.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: true })
  console.log(JSON.stringify({ settingsLinks: { headerLinks: settings.headerLinks, headerAction: settings.headerAction, footerLinks: settings.footerLinks } }))
} finally { await payload.destroy() }
process.exit(0)
