import { cache } from 'react'
import { getPayload, type Payload } from 'payload'
import { contentPath, isEditor, validateDestination, validateFragment } from '../domain/contracts.mjs'
import type { Profile, ArticleSummary } from './types'
import { anchorsFor } from '../domain/seo.mjs'

export type SiteData = { pages: any[]; posts: any[]; services: any[]; projects: any[]; media: any[]; settings: any | null; preview: boolean; redirects?: any[] }
const common = { title: true, id: true, slug: true, meta: true, actions: true, related: true, updatedAt: true, _status: true }
const linkSelect = { label: true, kind: true, page: true, url: true, fragment: true, newTab: true, relationship: true } as const
const selects = {
  pages: { ...common, pageKey: true, heading: true, eyebrow: true, introduction: true, tools: true, heroImage: true, sections: { id: true, template: true, eyebrow: true, sectionId: true, heading: true, body: true, note: true, image: true, imageAlt: true, actions: true } },
  posts: { ...common, excerpt: true, category: true, body: true, illustrationKind: true, readingMinutes: true, heroImage: true, publishedAt: true },
  services: { ...common, category: true, summary: true, body: true, detailsReviewed: true, heroImage: true, displayOrder: true, benefits: true, process: true, faqs: true },
  projects: { ...common, body: true, image: true, verifiedURL: true, displayOrder: true },
}
// The server-only content entrypoint exposes these queries to route components.
// Preview callers must pass an editor returned by Payload's auth method.
export async function readSite(payload: Payload, user?: any): Promise<SiteData> {
  const preview = Boolean(user)
  if (preview && !isEditor(user)) throw new Error('An authenticated editor is required for draft previews.')
  const collections = ['pages', 'posts', 'services', 'projects'] as const
  const lists = await Promise.all(collections.map(collection => payload.find({ collection, depth: 0, pagination: false, limit: 1000, sort: ['services', 'projects'].includes(collection) ? 'displayOrder' : 'id', draft: preview, overrideAccess: false, ...(preview ? { user } : { where: { _status: { equals: 'published' } } }), select: selects[collection] as any })))
  const media = await payload.find({ collection: 'media', depth: 0, pagination: false, limit: 1000, overrideAccess: false, ...(preview ? { user } : {}), select: { filename: true, mimeType: true, alt: true, decorative: true, caption: true, url: true, width: true, height: true, visibility: true, updatedAt: true, sizes: true } })
  // The settings REST API remains private. This privileged public read selects
  // only public fields from the published version, and checks publication state.
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, draft: preview, overrideAccess: !preview, ...(preview ? { user } : {}), select: { name: true, role: true, email: true, linkedin: true, github: true, calendly: true, portrait: true, avatar: true, workspaceImage: true, remoteLabel: true, portraitCaption: true, headerLinks: linkSelect, headerAction: linkSelect, footerLinks: linkSelect, footerText: true, formHeading: true, homeFormHeading: true, submitLabel: true, acceptedMessage: true, budgetHelp: true, formHelp: true, nameLabel: true, emailLabel: true, messageLabel: true, homeMessageLabel: true, budgetLabel: true, timelineLabel: true, messagePlaceholder: true, meta: true, updatedAt: true, _status: true } })
  const images = media.docs.map(item => {
    // Payload's local adapter returns its configured absolute origin. Use the
    // same-origin file endpoint for both authenticated previews and public HTML.
    const url = item.url ? new URL(item.url, 'http://cms.invalid') : undefined
    const version = item.updatedAt ? `?v=${new Date(item.updatedAt).getTime()}` : ''
    const social = item.sizes?.social
    return { ...item, url: url?.pathname.startsWith('/api/media/file/') ? url.pathname + version : undefined, ...(social?.filename ? { social: { url: '/api/media/file/' + encodeURIComponent(social.filename) + version, width: social.width, height: social.height } } : {}) }
  })
  return { pages: lists[0].docs, posts: lists[1].docs, services: lists[2].docs, projects: lists[3].docs, media: images, settings: preview || settings._status === 'published' ? settings : null, preview }
}
export const getSite = cache(async () => {
  const { default: config } = await import('../payload.config')
  return readSite(await getPayload({ config }))
})
export const idOf = (value: any) => typeof value === 'object' ? value?.id : value
export function mediaFor(site: SiteData, value: any) { return site.media.find(item => String(item.id) === String(idOf(value))) }
export function referenceDoc(site: SiteData, reference: any) {
  const list = ({ pages: site.pages, posts: site.posts, services: site.services, projects: site.projects } as Record<string, any[]>)[reference?.relationTo]
  return list?.find(item => String(item.id) === String(idOf(reference?.value)))
}
export function resolvedLink(site: SiteData, value: any) {
  if (!value) return undefined
  let href = value.url
  let target: any, collection: string | undefined
  if (value.kind === 'internal' || value.linkType === 'internal') {
    const reference = value.page || value.doc
    target = referenceDoc(site, reference); collection = reference?.relationTo
    href = contentPath(collection, target)
    if (collection === 'services' && !site.preview && (!target?.detailsReviewed || !textOf(target.body).trim())) return undefined
  }
  if (typeof href !== 'string' || validateDestination(href, { contact: true }) !== true) return undefined
  if (value.fragment) {
    if (validateFragment(value.fragment) !== true || (target && !anchorsFor(collection, target).has(value.fragment))) return undefined
    href = href.split('#')[0] + '#' + value.fragment
  }
  const rel = [value.newTab ? 'noopener noreferrer' : '', ...(Array.isArray(value.rel) ? value.rel.filter((x: string) => ['nofollow', 'sponsored'].includes(x)) : []), ['nofollow', 'sponsored'].includes(value.relationship) ? value.relationship : ''].filter(Boolean).join(' ')
  return { href, label: String(value.label || ''), ...(value.newTab ? { target: '_blank' } : {}), ...(rel ? { rel } : {}) }
}
export function profileFor(site: SiteData): Profile {
  const data = site.settings || {}
  return { name: data.name || '', role: data.role || '', email: data.email || '', github: data.github || '', linkedin: data.linkedin || '', calendly: data.calendly || '' }
}
export function summaries(site: SiteData, selected = site.posts): ArticleSummary[] {
  return selected.map(post => ({ slug: post.slug, title: post.title, excerpt: post.excerpt, category: post.category, kind: post.illustrationKind || 'build', minutes: post.readingMinutes || Math.max(1, Math.ceil(textOf(post.body).split(/\s+/).length / 200)), metaTitle: post.meta?.title || post.title, metaDescription: post.meta?.description || post.excerpt, ...(mediaFor(site, post.heroImage) ? { image: mediaFor(site, post.heroImage) } : {}) }))
}
export function textOf(node: any): string { return typeof node?.text === 'string' ? node.text : (node?.children || node?.root?.children || []).map(textOf).join(' ') }
export const nodesOf = (data: any): any[] => data?.root?.children || (Array.isArray(data) ? data : [])
export function grouped(data: any, tag = 'h3') {
  const intro: any[] = [], items: { title: string; nodes: any[] }[] = []
  for (const node of nodesOf(data)) {
    if (node.type === 'heading' && node.tag === tag) items.push({ title: textOf(node), nodes: [] })
    else (items.length ? items[items.length - 1].nodes : intro).push(node)
  }
  return { intro, items }
}

