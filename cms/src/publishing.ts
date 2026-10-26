import { APIError, ValidationError, type Payload, type PayloadRequest, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type GlobalBeforeChangeHook } from 'payload'
import { contentPath, validateDestination, validateFragment } from './domain/contracts.mjs'
import { anchorsFor, canonicalValidation, effectiveSEO, identifier, plainText, sameID, siteOrigin } from './domain/seo.mjs'
import { normalizePath } from './domain/routing.mjs'

export type Issue = { field: string; message: string; severity: 'error' | 'warning' }
export async function maybeDocument(payload: Payload, collection: any, id: any, req?: PayloadRequest) {
  try { return await payload.findByID({ collection, id: identifier(id), depth: 0, draft: false, overrideAccess: true, req }) } catch (error: any) { if (error.status === 404) return null; throw error }
}
export async function publishedContext(payload: Payload, req?: PayloadRequest) {
  const records: any[] = []
  // Privileged reads are limited to publication diagnostics and references;
  // snapshots, notes, accounts and inquiries are never projected here.
  for (const collection of ['pages', 'posts', 'services', 'projects'] as const) {
    const result = await payload.find({ collection, where: { _status: { equals: 'published' } }, limit: 1000, pagination: false, draft: false, depth: 0, overrideAccess: true, req, select: { title: true, slug: true, pageKey: true, heading: true, introduction: true, sections: true, body: true, actions: true, related: true, heroImage: true, image: true, meta: true, summary: true, excerpt: true, detailsReviewed: true, benefits: true, process: true, faqs: true } as any })
    records.push(...result.docs.map(doc => ({ collection, doc })))
  }
  const linkSelect = { label: true, kind: true, page: true, url: true, fragment: true, newTab: true, relationship: true, requiredForPublishing: true } as const
  const settings: any = await payload.findGlobal({ slug: 'site-settings', depth: 0, draft: false, overrideAccess: true, req, select: { name: true, role: true, email: true, github: true, linkedin: true, calendly: true, portrait: true, avatar: true, workspaceImage: true, meta: true, _status: true, headerLinks: linkSelect, footerLinks: linkSelect, headerAction: linkSelect } })
  return { records, settings: settings._status === 'published' ? settings : null }
}
export function documentLinks(collection: string, doc: any) {
  const links: { value: any; field: string; required: boolean }[] = []
  const arrays = collection === 'site-settings' ? ['headerLinks', 'footerLinks', 'headerAction'] : ['actions']
  for (const key of arrays) for (const [index, value] of (doc[key] || []).entries()) links.push({ value, field: `${key}.${index}`, required: collection === 'site-settings' || value.requiredForPublishing === true })
  const scan = (node: any, field: string) => {
    if (node?.type === 'link' || node?.type === 'autolink') { const value = { ...(node.fields || { url: node.url }), label: plainText(node) }; links.push({ value, field, required: value.requiredForPublishing === true }) }
    for (const child of node?.root?.children || node?.children || []) scan(child, field)
  }
  scan(doc.body, 'body'); scan(doc.introduction, 'introduction')
  for (const [index, section] of (doc.sections || []).entries()) {
    scan(section.body, `sections.${index}.body`); scan(section.note, `sections.${index}.note`)
    for (const [i, value] of (section.actions || []).entries()) links.push({ value, field: `sections.${index}.actions.${i}`, required: value.requiredForPublishing === true })
  }
  for (const [index, faq] of (doc.faqs || []).entries()) scan(faq.answer, `faqs.${index}.answer`)
  return links
}
export function documentImages(collection: string, doc: any) {
  const images: { id: any; field: string; alt?: string }[] = []
  const add = (value: any, field: string, alt?: string) => { if (value) images.push({ id: identifier(value), field, alt }) }
  for (const key of collection === 'site-settings' ? ['portrait', 'avatar', 'workspaceImage'] : ['heroImage', 'image']) add(doc[key], key)
  add(doc.meta?.image, 'meta.image')
  const scan = (node: any, field: string) => {
    if (node?.type === 'upload' && node.relationTo === 'media') add(node.value, field)
    for (const child of node?.root?.children || node?.children || []) scan(child, field)
  }
  scan(doc.body, 'body'); scan(doc.introduction, 'introduction')
  for (const [index, section] of (doc.sections || []).entries()) { add(section.image, `sections.${index}.image`, section.imageAlt); scan(section.body, `sections.${index}.body`); scan(section.note, `sections.${index}.note`) }
  for (const [index, faq] of (doc.faqs || []).entries()) scan(faq.answer, `faqs.${index}.answer`)
  return images
}
function linkTarget(value: any, collection: string, doc: any, records: any[]) {
  const reference = value.page || value.doc
  if (value.kind === 'internal' || value.linkType === 'internal') return { target: records.find(item => item.collection === reference?.relationTo && sameID(item.doc.id, reference?.value)), fragment: value.fragment }
  const href = value.url
  if (typeof href !== 'string' || /^(mailto:|tel:)/.test(href)) return {}
  try {
    const url = new URL(href, siteOrigin() + (contentPath(collection, doc) || '/'))
    if (url.origin !== siteOrigin()) return {}
    const target = records.find(item => { const path = contentPath(item.collection, item.doc); return path && normalizePath(path) === normalizePath(url.pathname) })
    return { target, fragment: value.fragment || (url.hash ? decodeURIComponent(url.hash.slice(1)) : undefined), local: true }
  } catch { return { invalid: true } }
}
export async function readiness(payload: Payload, collection: string, doc: any, req?: PayloadRequest) {
  const issues: Issue[] = [], context = await publishedContext(payload, req)
  if (collection === 'media') return { kind: collection, issues, incoming: await incomingReferences(payload, collection, doc, context, req), effective: {}, refresh: '' }
  const issue = (field: string, message: string, severity: Issue['severity'] = 'error') => issues.push({ field, message, severity })
  const records = context.records.filter(item => !(item.collection === collection && sameID(item.doc.id, doc.id)))
  if (collection !== 'site-settings') records.push({ collection, doc })
  if (collection === 'services') {
    if (!plainText(doc.body).trim()) issue('body', 'Add the reviewed service detail copy before publishing. A summary alone is not a detail page.')
    if (!doc.detailsReviewed) issue('detailsReviewed', 'Confirm that the service detail copy has been reviewed.')
  }
  if (['posts', 'projects'].includes(collection) && !plainText(doc.body).trim()) issue('body', 'Add readable content before publishing.')
  if (collection === 'pages' && !doc.heading?.trim()) issue('heading', 'Enter the main page heading.')
  const ids = (doc.sections || []).map((section: any) => section.sectionId).filter(Boolean)
  if (new Set(ids).size !== ids.length) issue('sections', 'Each section anchor must be unique within the page.')
  const canonical = canonicalValidation(doc.meta?.canonicalURL)
  if (canonical !== true) issue('meta.canonicalURL', String(canonical))
  if (process.env.CMS_ENV === 'production' && doc.meta?.canonicalURL?.startsWith('http:')) issue('meta.canonicalURL', 'Use an HTTPS canonical address in production.')
  for (const link of documentLinks(collection, doc)) {
    const { value, field, required } = link
    const label = value.label || plainText({ children: value.children || [] })
    if (value.label !== undefined && !value.label.trim()) issue(`${field}.label`, 'Enter clickable text for this link.')
    if (value.fragment && validateFragment(value.fragment) !== true) issue(field, 'Use a section anchor without spaces or #.')
    if (value.kind !== 'internal' && value.linkType !== 'internal' && validateDestination(value.url, { contact: true }) !== true) issue(field, 'Choose a safe http(s), email, phone, or website destination.')
    const result = linkTarget(value, collection, doc, records)
    if (result.invalid) issue(field, 'This link address cannot be resolved.')
    if ((value.kind === 'internal' || value.linkType === 'internal' || result.local) && !result.target) issue(field, 'The selected website page is missing or unpublished. Publish it first or choose another destination.', required ? 'error' : 'warning')
    if (result.target && result.fragment && !anchorsFor(result.target.collection, result.target.doc).has(result.fragment)) issue(field, `The section “${result.fragment}” does not exist on ${result.target.doc.title}.`, required ? 'error' : 'warning')
    if (['click here', 'here', 'read more', 'learn more'].includes(label.toLowerCase().trim())) issue(field, 'Consider clickable words that describe the destination.', 'warning')
  }
  const media: any[] = []
  for (const image of documentImages(collection, doc)) {
    const file: any = await maybeDocument(payload, 'media', image.id, req)
    if (!file || file.visibility !== 'public') issue(image.field, 'Choose a publicly available image, make this image Public, or remove this selection before publishing.')
    else {
      media.push(file)
      if (!file.decorative && !(image.alt ?? file.alt)?.trim()) issue(image.field, 'Add a useful image description, or mark a purely decorative image decorative.', 'warning')
      if (file.filesize > 2 * 1024 * 1024) issue(image.field, 'This image exceeds 2 MB. Consider a smaller image for faster loading.', 'warning')
    }
  }
  const settings = collection === 'site-settings' ? doc : context.settings
  if (settings?.meta?.image && !media.some(file => sameID(file.id, settings.meta.image))) {
    const fallback: any = await maybeDocument(payload, 'media', settings.meta.image, req)
    if (fallback?.visibility === 'public') media.push(fallback)
  }
  const site = { pages: records.filter(item => item.collection === 'pages').map(item => item.doc), media, settings, preview: false }
  const seo = effectiveSEO(site, collection, doc)
  if (seo.title.length < 15 || seo.title.length > 70) issue('meta.title', 'Review the search title length. This is guidance, not a publishing limit.', 'warning')
  if (!seo.description) issue('meta.description', 'No page or site description is set.', 'warning')
  else if (seo.description.length < 50 || seo.description.length > 180) issue('meta.description', 'Review the description length; search engines may display it differently.', 'warning')
  for (const item of records.filter(item => !(item.collection === collection && sameID(item.doc.id, doc.id)))) {
    const other = effectiveSEO(site, item.collection, item.doc)
    if (other.title === seo.title) issue('meta.title', `The effective title is also used by ${item.doc.title}.`, 'warning')
    if (seo.description && other.description === seo.description) issue('meta.description', `The effective description is also used by ${item.doc.title}. Consider a page-specific description.`, 'warning')
  }
  let previous = 1
  const headings = (node: any, field: string) => {
    if (node?.type === 'heading') { const level = Number(node.tag?.slice(1)); if (level > previous + 1) issue(field, 'Review skipped heading levels; use headings in a logical order.', 'warning'); previous = level }
    for (const child of node?.root?.children || node?.children || []) headings(child, field)
  }
  headings(doc.body, 'body'); headings(doc.introduction, 'introduction')
  for (const [index, section] of (doc.sections || []).entries()) {
    previous = 2; headings(section.body, `sections.${index}.body`); headings(section.note, `sections.${index}.note`)
  }
  for (const [index, faq] of (doc.faqs || []).entries()) { previous = 3; headings(faq.answer, `faqs.${index}.answer`) }
  const incoming = await incomingReferences(payload, collection, doc, context, req)
  return { kind: collection, issues, incoming, effective: { title: seo.title, description: seo.description || '', canonical: seo.canonical, indexable: seo.indexable, indexingReason: seo.indexingReason, sitemapEligible: Boolean(seo.path) && seo.indexable && seo.canonical === seo.normal, publicPath: contentPath(collection, doc) || (collection === 'site-settings' ? '/' : undefined), socialTitle: seo.socialTitle, socialDescription: seo.socialDescription || '', image: seo.images[0]?.url || null }, refresh: 'Published changes appear on the next page request, including navigation, metadata and sitemap. Reload an already-open website tab after publishing.' }
}
export async function incomingReferences(payload: Payload, collection: string, doc: any, context?: Awaited<ReturnType<typeof publishedContext>>, req?: PayloadRequest) {
  const state = context || await publishedContext(payload, req), result: any[] = []
  const sources = [...state.records, ...(state.settings ? [{ collection: 'site-settings', doc: state.settings }] : [])]
  for (const source of sources) {
    if (source.collection === collection && sameID(source.doc.id, doc.id)) continue
    const editURL = source.collection === 'site-settings' ? '/admin/globals/site-settings' : `/admin/collections/${source.collection}/${source.doc.id}`
    for (const link of documentLinks(source.collection, source.doc)) {
      const target = linkTarget(link.value, source.collection, source.doc, [{ collection, doc }]).target
      if (target) result.push({ title: source.doc.title || 'Site settings', field: link.field, required: link.required, fragment: link.value.fragment, editURL })
    }
    if ((source.doc.related || []).some((reference: any) => reference.relationTo === collection && sameID(reference.value, doc.id))) result.push({ title: source.doc.title, field: 'related', required: false, editURL })
    if (source.collection === 'pages' && ((collection === 'services' && (source.doc.pageKey === 'services' || source.doc.sections?.some((section: any) => section.template === 'services'))) || (collection === 'projects' && source.doc.sections?.some((section: any) => section.template === 'projects')) || (collection === 'posts' && source.doc.pageKey === 'blog'))) result.push({ title: source.doc.title, field: 'Automatic content list', required: false, editURL })
    if (collection === 'media') for (const image of documentImages(source.collection, source.doc)) if (sameID(image.id, doc.id)) result.push({ title: source.doc.title || 'Site settings', field: image.field, required: true, editURL })
  }
  return result
}
export async function protectRemoval(payload: Payload, collection: string, doc: any, req: PayloadRequest, replacement?: any) {
  const references = await incomingReferences(payload, collection, doc, undefined, req)
  const blocked = references.filter(reference => reference.required && (!replacement || (reference.fragment && !anchorsFor(collection, replacement).has(reference.fragment))))
  if (blocked.length) throw new APIError('Update required published references first: ' + blocked.map(reference => `${reference.title} → ${reference.field}`).join('; '), 400)
}
export const enforcePublication: CollectionBeforeChangeHook = async ({ data, originalDoc, collection, req }) => {
  if (req.context.draftOperation === true) return data
  const previous: any = originalDoc?.id ? await maybeDocument(req.payload, collection.slug, originalDoc.id, req) : null
  const merged = { ...originalDoc, ...data, _status: data._status ?? previous?._status ?? originalDoc?._status }, publishing = merged._status === 'published'
  if (previous?._status === 'published') await protectRemoval(req.payload, collection.slug, previous, req, publishing ? merged : undefined)
  if (publishing) {
    const result = await readiness(req.payload, collection.slug, merged, req)
    const errors = result.issues.filter(issue => issue.severity === 'error')
    if (errors.length) throw new ValidationError({ collection: collection.slug, errors: errors.map(issue => ({ path: issue.field, message: issue.message })) })
  }
  return data
}
export const enforceSettings: GlobalBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (req.context.draftOperation === true) return data
  const merged = { ...originalDoc, ...data }
  if (merged._status === 'published') {
    const result = await readiness(req.payload, 'site-settings', merged, req), errors = result.issues.filter(issue => issue.severity === 'error')
    if (errors.length) throw new ValidationError({ global: 'site-settings', errors: errors.map(issue => ({ path: issue.field, message: issue.message })) })
  }
  return data
}
export const protectReferencedDelete: CollectionBeforeDeleteHook = async ({ collection, id, req }) => {
  const doc = await maybeDocument(req.payload, collection.slug, id, req)
  if (doc) await protectRemoval(req.payload, collection.slug, doc, req)
}
