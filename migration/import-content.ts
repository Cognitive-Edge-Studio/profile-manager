import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import type { Payload } from 'payload'
import { convertMarkdownToLexical, type SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'
import { profile, paragraphs, beforeAction } from '../src/content/approved'
import { splitSections, slugify, SECTION_ANCHORS } from '../src/domain/contracts.mjs'
import { pageMetadata } from './original-metadata'
import { normalizeImportedEditorial } from '../src/domain/editorial.mjs'

type Entry = { collection: 'pages' | 'posts' | 'services' | 'projects'; data: any }
const normalized = (value: string) => value.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase()
export const lexicalText = (node: any): string => typeof node?.text === 'string' ? node.text : (node?.children || node?.root?.children || []).map(lexicalText).join(' ')
const markdownText = (value: string) => value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split('\n').filter(line => !/^\|[\s:|\-]+\|$/.test(line) && !/^---+$/.test(line)).map(line => line.replace(/^(?:#{1,4}\s+|>\s?|[-*]\s+|\d+\.\s+)/, '')).join('\n').replace(/\*|`/g, '')

export async function buildImport(payload: Payload) {
  const approved = JSON.parse(await readFile(new URL('../src/content/approved.json', import.meta.url), 'utf8'))
  const posts = JSON.parse(await readFile(new URL('../src/content/blog.json', import.meta.url), 'utf8'))
  const editorConfig = (payload.config.editor as unknown as { editorConfig: SanitizedServerEditorConfig }).editorConfig
  const rich = (markdown: string) => {
    const value = convertMarkdownToLexical({ editorConfig, markdown })
    assert.equal(normalized(lexicalText(value)), normalized(markdownText(markdown)), 'Markdown conversion must preserve every visible word in order')
    return value
  }
  const entries: Entry[] = []
  const templates: Record<string, string[]> = { home: ['copy', 'services', 'projects', 'process', 'faqs', 'contact'], about: ['purpose', 'technology', 'benefits', 'interests', 'cta'], contact: ['copy', 'contact', 'cta'] }
  const labels: Record<string, string[]> = { home: ['About Me', 'My services', 'Case Studies', 'Collaboration Process', 'FAQs', 'Contact Me'], about: ['A person behind the work', 'Background', 'Working together', 'Looking ahead', 'A conversation'], contact: ['The next step', 'Project inquiry', 'A conversation'] }
  for (const [key, page] of Object.entries(approved) as [string, any][]) {
    const intro = paragraphs(page.intro)
    const introduction = key === 'home' ? intro[1] : key === 'about' ? intro.slice(1, 3).join('\n\n') : intro.slice(1, 3).join('\n\n')
    const sections = page.sections.map((section: any, index: number) => {
      let body = beforeAction(section.body)
      if (key === 'home' && index === 5) body = paragraphs(body).slice(0, 2).join('\n\n')
      if (key === 'about' && index === 4) body = body.replace(/\n\n\*\*Discuss your project\*\*\s*$/, '')
      if (key === 'contact' && index === 1) body = '' // Source-only form scaffold is retained in the snapshot.
      let note: string | undefined
      if (key === 'home' && index === 2) body = splitSections(body).intro
      if (key === 'home' && index === 3) {
        const mark = body.indexOf('**Maintenance')
        if (mark >= 0) { note = body.slice(mark); body = body.slice(0, mark).trim() }
      }
      return { sourceId: `approved:${key}:section:${index}`, template: templates[key][index], eyebrow: labels[key][index], sectionId: SECTION_ANCHORS[key as keyof typeof SECTION_ANCHORS][index], heading: section.title, body: rich(body), ...(note ? { note: rich(note) } : {}) }
    })
    entries.push({ collection: 'pages', data: { sourceId: `approved:${key}`, sourceSnapshot: { intro: page.intro, sections: page.sections }, title: key === 'home' ? 'Home' : key === 'about' ? 'About Me' : 'Contact', pageKey: key, heading: intro[0].replace(/^# /, ''), eyebrow: key === 'home' ? profile.role : key === 'about' ? 'About Me' : "Let's talk", introduction: rich(introduction), sections: key === 'contact' ? sections.slice(0, 2) : sections, ...(key === 'home' ? { tools: intro.slice(4, 7).join(' · ').split(' · ').map(name => ({ name })) } : {}), meta: pageMetadata(key as 'home' | 'about' | 'contact'), _status: 'draft' } })
  }
  for (const key of ['blog', 'calculator'] as const) entries.push({ collection: 'pages', data: { sourceId: `page:${key}`, sourceSnapshot: { source: key === 'blog' ? 'src/blog.tsx' : 'src/mvp-calculator.tsx', metadata: pageMetadata(key) }, pageKey: key, title: key === 'blog' ? 'Blog' : 'MVP cost calculator', heading: key === 'blog' ? 'Blog' : 'MVP cost calculator', eyebrow: key === 'blog' ? 'The journal' : 'A little help with your next idea', introduction: rich(key === 'blog' ? '' : 'Describe what you want to build and add the costs you know. See your budget, try a smaller version, and find out what you still need to check.'), meta: pageMetadata(key), _status: 'draft' } })
  const blog = entries.find(entry => entry.data.pageKey === 'blog')!
  blog.data.sections = [
    { sourceId: 'blog:article-contact', template: 'copy', sectionId: 'article-contact', heading: 'Hire Shibly as your developer', body: rich('Work directly with Shibly to turn your idea into useful software or improve a product you already have.') },
    { sourceId: 'blog:budget-tool', template: 'cta', sectionId: 'budget-tool', heading: 'Plan your first-release budget', body: rich('Organize your scope, supplied estimates, and running costs.') },
  ]
  const groups = splitSections(beforeAction(approved.home.sections[1].body)).items
  // Homepage summaries remain editable within Home. Standalone service pages
  // are created only by the owner, never by this importer.
  for (const [index, project] of splitSections(approved.home.sections[2].body).items.entries()) entries.push({ collection: 'projects', data: { sourceId: `project:${slugify(project.title)}`, sourceSnapshot: project, title: project.title, slug: slugify(project.title), body: rich(project.body), displayOrder: index, _status: 'draft' } })
  for (const post of posts) entries.push({ collection: 'posts', data: { sourceId: `post:${post.slug}`, sourceSnapshot: post, title: post.title, slug: post.slug, excerpt: post.excerpt, category: post.category, illustrationKind: post.kind, readingMinutes: post.minutes, body: rich(post.body), publishedAt: null, meta: { title: post.metaTitle, description: post.metaDescription }, _status: 'draft' } })
  return { entries: entries.map(entry => ({ ...entry, data: normalizeImportedEditorial(entry.data) })), groups, rich, settings: { sourceId: 'settings:original', sourceSnapshot: { profile, source: 'src/App.tsx' }, ...profile, remoteLabel: 'Fully remote, anywhere.', portraitCaption: 'Independent software engineer', formHeading: 'Send me a message', submitLabel: 'Send your message', acceptedMessage: "Thank you for sharing your project. I'll review your message and get back to you by email.", budgetHelp: "A rough range helps me suggest an approach that fits what you're ready to spend. It's fine if you're still working this out.", _status: 'draft' } }
}

export async function importContent(payload: Payload, { apply = false, update = false, uploadPrefix = 'import' } = {}) {
  if (!/^(?:import|cms_(?:content|http|seo)_test_\d+)$/.test(uploadPrefix)) throw new Error('Use a normal import or an isolated fixture upload prefix.')
  const { entries, settings } = await buildImport(payload)
  const report: any[] = []
  const ids = new Map<string, number>()
  const created = new Set<string>()
  // Privileged writes are confined to this local import, always as drafts.
  const privileged = { overrideAccess: true as const, context: { localBootstrap: true } }
  for (const entry of entries) {
    const found = await payload.find({ collection: entry.collection, where: { sourceId: { equals: entry.data.sourceId } }, draft: true, limit: 1, depth: 0, overrideAccess: true })
    const existing: any = found.docs[0]
    if (!existing) {
      const collision = await payload.find({ collection: entry.collection, where: entry.collection === 'pages' ? { pageKey: { equals: entry.data.pageKey } } : { slug: { equals: entry.data.slug } }, draft: true, limit: 1, depth: 0, overrideAccess: true })
      if (collision.totalDocs) { report.push({ sourceId: entry.data.sourceId, action: 'conflict', reason: 'An editorial record already uses this page or slug; retained.' }); continue }
    }
    const changed = existing ? Object.keys(entry.data).filter(key => !['sourceSnapshot', '_status'].includes(key) && JSON.stringify(sourceShape(existing[key], entry.data[key])) !== JSON.stringify(sourceShape(entry.data[key], entry.data[key]))) : []
    report.push({ sourceId: entry.data.sourceId, action: existing ? update ? 'update-as-draft' : 'retain' : 'create-draft', differingFields: changed })
    let doc = existing
    if (apply && (!existing || update)) doc = existing ? await payload.update({ collection: entry.collection, id: existing.id, data: entry.data, draft: true, ...privileged }) : await payload.create({ collection: entry.collection, data: entry.data, draft: true, ...privileged })
    if (doc) ids.set(entry.data.sourceId, doc.id)
    if (apply && !existing && doc) created.add(entry.data.sourceId)
  }
  const existingSettings: any = await payload.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: true })
  const retainSettings = Boolean(existingSettings.sourceId || existingSettings.name)
  report.push({ sourceId: settings.sourceId, action: retainSettings ? update ? 'update-as-draft' : 'retain' : 'create-draft' })
  if (apply) {
    const media: Record<string, number> = {}
    for (const [name, alt] of [['shibly-noman-avatar.jpg', 'Shibly Mohammad Noman'], ['shibly-noman-full-stack-developer.jpg', 'Shibly Mohammad Noman'], ['developer-workspace.png', 'Custom pen-and-ink illustration of a software engineering workspace with a laptop, code, and system sketches.']]) {
      const filename = `${uploadPrefix}-${name}`
      const sourceId = `asset:${name}`
      let file = (await payload.find({ collection: 'media', where: { sourceId: { equals: sourceId } }, depth: 0, limit: 1, overrideAccess: true })).docs[0]
      if (!file) file = await payload.create({ collection: 'media', data: { sourceId, sourceSnapshot: { path: `public/images/${name}` }, alt, visibility: 'private' }, file: { data: await readFile(new URL(`../public/images/${name}`, import.meta.url)), mimetype: name.endsWith('.png') ? 'image/png' : 'image/jpeg', name: filename, size: (await readFile(new URL(`../public/images/${name}`, import.meta.url))).length }, ...privileged })
      media[name] = file.id
    }
    const internal = (label: string, key: string, fragment?: string) => ({ label, kind: 'internal', page: { relationTo: 'pages', value: ids.get(key.startsWith('page:') ? key : `approved:${key}`) }, ...(fragment ? { fragment } : {}) })
    // Initial relationship wiring is idempotent and never replaces later edits.
    for (const entry of entries.filter(item => item.collection === 'pages')) {
      if (!created.has(entry.data.sourceId) && !update) continue
      const id = ids.get(entry.data.sourceId)
      if (!id) continue
      const doc = await payload.findByID({ collection: 'pages', id, draft: true, depth: 0, overrideAccess: true })
      if (doc.actions?.length && !update) continue
      const key = entry.data.pageKey
      const actions = key === 'home' ? [internal('Discuss your project', 'contact'), internal('Explore my work', 'home', 'selected-work')] : key === 'about' ? [internal('Contact me', 'contact')] : []
      const sections = (doc.sections || []).map((section: any) => ({ ...section, actions: section.sectionId === 'article-contact' ? [internal('Contact me', 'contact')] : section.sectionId === 'budget-tool' ? [internal('Open calculator', 'page:calculator')] : section.template === 'copy' && key === 'home' ? [internal('More about me', 'about')] : section.template === 'technology' ? [internal('Explore my work', 'home', 'selected-work')] : section.template === 'cta' ? [internal('Discuss your project', 'contact')] : section.actions }))
      await payload.update({ collection: 'pages', id, draft: true, data: { actions: actions as any, sections, ...(key === 'home' ? { heroImage: media['shibly-noman-full-stack-developer.jpg'] } : {}) }, ...privileged })
    }
    if (!retainSettings || update) {
      const headerLinks = [internal('Services', 'home', 'services'), internal('MVP Calculator', 'page:calculator'), internal('Selected Works', 'home', 'selected-work'), internal('Blog', 'page:blog'), internal('About Me', 'about')]
      await payload.updateGlobal({ slug: 'site-settings', draft: true, data: { ...settings, avatar: media['shibly-noman-avatar.jpg'], portrait: media['shibly-noman-full-stack-developer.jpg'], workspaceImage: media['developer-workspace.png'], headerLinks, headerAction: [internal('Discuss your project', 'contact')], footerLinks: [...headerLinks, internal('Contact', 'contact')] } as any, ...privileged })
    }
  }
  return { mode: apply ? 'apply-drafts' : 'dry-run', updateExisting: update, entries: report, notes: ['No publication dates inferred.', 'Media imported privately.', 'SVG technology marks and decorative article illustrations remain code assets.', 'Source snapshots retain the complete original manuscripts and page sections.'] }
}

function sourceShape(value: any, source: any): any {
  if (Array.isArray(source)) return Array.isArray(value) ? value.map((item, i) => sourceShape(item, source[i] || {})) : value
  if (source && typeof source === 'object') return Object.fromEntries(Object.keys(source).sort().filter(key => !['id', 'direction', 'indent', 'version', 'textFormat', 'textStyle', 'mode', 'detail'].includes(key)).map(key => [key, sourceShape(value?.[key], source[key])]))
  return value
}
