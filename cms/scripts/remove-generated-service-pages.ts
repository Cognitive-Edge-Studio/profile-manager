import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { grouped, textOf } from '../src/website/queries'
import { splitSections, slugify } from '../src/domain/contracts.mjs'
import { buildImport } from '../migration/import-content'

assert.equal(process.env.CMS_ENV, 'local', 'Run only against the local CMS.')
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(process.env.DATABASE_URL!).hostname))
const { default: config } = await import('../src/payload.config')
const cms = await getPayload({ config })
const apply = process.argv.includes('--apply')
try {
  const imported = await buildImport(cms)
  const expected = new Set(imported.groups.flatMap((group: any) => splitSections(group.body, 4).items.map((item: any) => 'service:' + slugify(item.title))))
  const services: any[] = (await cms.find({ collection: 'services', limit: 1000, pagination: false, draft: true, depth: 0, overrideAccess: true, sort: 'displayOrder' })).docs.filter(doc => expected.has(doc.sourceId || ''))
  const pillar: any = (await cms.find({ collection: 'pages', where: { sourceId: { equals: 'page:services' } }, draft: true, depth: 0, overrideAccess: true })).docs[0]
  const home: any = (await cms.find({ collection: 'pages', where: { pageKey: { equals: 'home' } }, draft: true, depth: 0, overrideAccess: true })).docs[0]
  assert.ok(home, 'Retain the existing homepage.')
  const sectionIndex = home.sections?.findIndex((section: any) => section.template === 'services')
  assert.ok(sectionIndex >= 0, 'The existing homepage service section must be present.')
  const removed = new Set(services.map(doc => String(doc.id)))
  const paths = new Set(['/services/', ...services.map(doc => `/services/${doc.slug}/`)])
  const target = (ref: any) => ref?.relationTo === 'services' ? removed.has(String(typeof ref.value === 'object' ? ref.value?.id : ref.value)) : ref?.relationTo === 'pages' && pillar ? String(typeof ref.value === 'object' ? ref.value?.id : ref.value) === String(pillar.id) : false
  const homepageRef = { relationTo: 'pages', value: home.id }
  function obsoleteURL(value: string) {
    try { const base = process.env.SITE_URL || process.env.CMS_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'; const url = new URL(value, base); return ['localhost', '127.0.0.1', new URL(base).hostname].includes(url.hostname) && paths.has(url.pathname.replace(/\/$/, '') + '/') } catch { return false }
  }
  function clean(value: any): any {
    if (Array.isArray(value)) return value.map(clean)
    if (!value || typeof value !== 'object') return value
    const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, key === 'related' && Array.isArray(entry) ? entry.filter(ref => !target(ref)) : clean(entry)])) as any
    for (const field of ['page', 'doc']) if (target(value[field])) { result[field] = homepageRef; result.fragment = 'services' }
    if (typeof value.url === 'string' && obsoleteURL(value.url)) result.url = '/#services'
    return result
  }
  const records: any[] = []
  for (const collection of ['pages', 'posts', 'projects'] as const) {
    const docs = (await cms.find({ collection, draft: true, limit: 1000, pagination: false, depth: 0, overrideAccess: true })).docs
    for (const doc of docs) if (!(collection === 'pages' && pillar && doc.id === pillar.id)) records.push({ collection, doc })
  }
  const settings: any = await cms.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: true })
  const report: any = { action: apply ? 'apply' : 'dry-run', pillar: pillar ? { id: pillar.id, title: pillar.title } : null, servicePages: services.map(doc => ({ id: doc.id, title: doc.title, path: `/services/${doc.slug}/` })), homepageSummaryCount: services.length || grouped(home.sections[sectionIndex].body).items.reduce((sum: number, group: any) => sum + grouped(group.nodes, 'h4').items.length, 0), recreatedByImporter: false }
  console.log(JSON.stringify(report, null, 2))
  if (!apply || (!pillar && !services.length)) { process.exitCode = 0; }
  else {
    assert.ok([...records.map(item => item.doc), ...services, ...(pillar ? [pillar] : []), settings].every(doc => doc._status === 'draft'), 'Review publication state before altering live content.')
    const owner = (await cms.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1, overrideAccess: true })).docs[0]
    assert.ok(owner); const user = { ...owner, collection: 'users' as const }
    const backup = `.local/backups/removed-service-pages-${Date.now()}.json`
    await mkdir('.local/backups', { recursive: true })
    await writeFile(backup, JSON.stringify({ services, pillar, records, settings }, null, 2))
    const text = (value: string) => ({ type: 'text', version: 1, text: value, format: 0, style: '', mode: 'normal', detail: 0 })
    const node = (type: string, value: string, tag?: string) => ({ type, version: 1, format: '', indent: 0, direction: null, ...(tag ? { tag } : {}), children: [text(value)] })
    const sections = structuredClone(home.sections)
    if (services.length) {
      const original = sections[sectionIndex].body
      const intro = grouped(original).intro
      const children = [...intro]
      for (const category of [...new Set(services.map(doc => doc.category))]) {
        children.push(node('heading', category, 'h3'))
        for (const service of services.filter(doc => doc.category === category)) {
          children.push(node('heading', service.title, 'h4'), node('paragraph', service.summary))
          if (service.heroImage) children.push({ type: 'upload', version: 3, relationTo: 'media', value: service.heroImage, fields: null })
        }
      }
      sections[sectionIndex].body = { ...original, root: { ...original.root, children } }
      for (const service of services) assert.ok(textOf(sections[sectionIndex].body).includes(service.title) && textOf(sections[sectionIndex].body).includes(service.summary), 'Keep every homepage service title and summary.')
    }
    const updates: any[] = []
    for (const { collection, doc } of records) {
      const fields: any = {}
      for (const key of ['actions', 'related', 'sections', 'body', 'introduction']) if (doc[key] !== undefined) fields[key] = clean(collection === 'pages' && doc.id === home.id && key === 'sections' ? sections : doc[key])
      if (Object.keys(fields).some(key => JSON.stringify(fields[key]) !== JSON.stringify(doc[key]))) { await cms.update({ collection, id: doc.id, data: fields, draft: true, user, overrideAccess: false }); updates.push({ collection, id: doc.id }) }
    }
    const navigation: any = {}
    for (const key of ['headerLinks', 'footerLinks', 'headerAction']) navigation[key] = clean(settings[key] || [])
    if (Object.keys(navigation).some(key => JSON.stringify(navigation[key]) !== JSON.stringify(settings[key] || []))) await cms.updateGlobal({ slug: 'site-settings', data: navigation, draft: true, user, overrideAccess: false })
    for (const service of services) await cms.delete({ collection: 'services', id: service.id, user, overrideAccess: false })
    if (pillar) await cms.delete({ collection: 'pages', id: pillar.id, user, overrideAccess: false })
    assert.equal((await cms.find({ collection: 'services', where: { sourceId: { in: [...expected] } }, draft: true, overrideAccess: true })).totalDocs, 0)
    assert.equal((await cms.find({ collection: 'pages', where: { sourceId: { equals: 'page:services' } }, draft: true, overrideAccess: true })).totalDocs, 0)
    const retained: any = await cms.findByID({ collection: 'pages', id: home.id, draft: true, overrideAccess: true })
    const cards = grouped(retained.sections[sectionIndex].body).items.flatMap(group => grouped(group.nodes, 'h4').items)
    assert.equal(cards.length, report.homepageSummaryCount)
    report.result = 'passed'; report.updatedReferences = updates; report.privateBackup = backup; report.remainingPages = (await cms.count({ collection: 'pages', overrideAccess: true })).totalDocs; report.remainingServicePages = (await cms.count({ collection: 'services', overrideAccess: true })).totalDocs
    await writeFile('docs/service-page-removal.json', JSON.stringify(report, null, 2) + '\n')
    console.log('Generated service pages removed. Original homepage summaries retained. Nothing was published.')
  }
} finally { await cms.destroy() }
process.exit(process.exitCode || 0)

