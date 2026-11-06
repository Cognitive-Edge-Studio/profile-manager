import { cache } from 'react'
import { contentPath, validateDestination, validateFragment } from '../domain/contracts.mjs'
import type { Profile, ArticleSummary } from './types'
import { anchorsFor, siteOrigin } from '../domain/seo.mjs'
import { articleLinkRel } from '../domain/link-policy.mjs'
import { readStaticSite } from './static-content'

export type SiteData = { pages: any[]; posts: any[]; services: any[]; projects: any[]; media: any[]; settings: any | null; preview: boolean; redirects?: any[] }
export const getSite = cache(readStaticSite)
export const idOf = (value: any) => typeof value === 'object' ? value?.id : value
export function mediaFor(site: SiteData, value: any) { return site.media.find(item => String(item.id) === String(idOf(value))) }
export function referenceDoc(site: SiteData, reference: any) {
  const list = ({ pages: site.pages, posts: site.posts, services: site.services, projects: site.projects } as Record<string, any[]>)[reference?.relationTo]
  const value = String(idOf(reference?.value))
  return list?.find(item => String(item.id) === value || item.pageKey === value || item.slug === value)
}
export function resolvedLink(site: SiteData, value: any, { nofollowExternal = false } = {}) {
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
  const selectedRel = [value.newTab ? 'noopener noreferrer' : '', ...(Array.isArray(value.rel) ? value.rel.filter((x: string) => ['nofollow', 'sponsored'].includes(x)) : []), ['nofollow', 'sponsored'].includes(value.relationship) ? value.relationship : ''].filter(Boolean).join(' ')
  const rel = nofollowExternal ? articleLinkRel(href, selectedRel, siteOrigin()) : selectedRel
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

