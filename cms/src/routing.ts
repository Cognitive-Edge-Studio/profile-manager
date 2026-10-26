import { getPayload, type Payload } from 'payload'
import { contentPath } from './domain/contracts.mjs'
import { identifier, plainText, siteOrigin } from './domain/seo.mjs'
import { localTarget, normalizePath } from './domain/routing.mjs'
import { redirectRecords } from './redirects'

export async function routingSnapshot(payload: Payload) {
  const records: { collection: string; doc: any; path: string }[] = []
  for (const collection of ['pages', 'posts', 'services'] as const) {
    const result = await payload.find({ collection, where: { _status: { equals: 'published' } }, limit: 1000, pagination: false, draft: false, depth: 0, overrideAccess: false, select: { slug: true, pageKey: true, detailsReviewed: true, body: collection === 'services' } as any })
    for (const doc of result.docs as any[]) {
      const path = contentPath(collection, doc)
      if (path && (collection !== 'services' || (doc.detailsReviewed && plainText(doc.body).trim()))) records.push({ collection, doc, path })
    }
  }
  // A narrow privileged projection preserves the private global API boundary.
  const settings = await payload.findGlobal({ slug: 'site-settings', draft: false, depth: 0, overrideAccess: true, select: { _status: true } })
  return { records: settings._status === 'published' ? records : [], redirects: await redirectRecords(payload) }
}
export function activeRedirect(record: any, snapshot: Awaited<ReturnType<typeof routingSnapshot>>) {
  if (record.enabled === false || snapshot.records.some(item => item.path === normalizePath(record.from))) return undefined
  if (record.managedTarget) {
    const target = snapshot.records.find(item => item.collection === record.managedTarget.relationTo && String(item.doc.id) === String(identifier(record.managedTarget.value)))
    return target?.path
  }
  const path = localTarget(record.to, siteOrigin())
  if (path && !snapshot.records.some(item => item.path === path)) return undefined
  if (path && snapshot.redirects.some(other => other.id !== record.id && other.enabled !== false && normalizePath(other.from) === path)) return undefined
  return record.to
}
export async function getRouting() {
  const { default: config } = await import('./payload.config')
  return routingSnapshot(await getPayload({ config }))
}
