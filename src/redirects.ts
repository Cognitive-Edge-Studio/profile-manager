import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeValidateHook, type CollectionBeforeDeleteHook, type PayloadRequest, type Payload } from 'payload'
import { contentPath } from './domain/contracts.mjs'
import { siteOrigin, sameID } from './domain/seo.mjs'
import { normalizePath, redirectProblem, localTarget } from './domain/routing.mjs'
import { maybeDocument, publishedContext } from './publishing'

export async function redirectRecords(payload: Payload, req?: PayloadRequest): Promise<any[]> {
  // The redirect API stays private. The router reads only destination controls.
  return (await payload.find({ collection: 'redirects', limit: 1000, pagination: false, depth: 0, overrideAccess: true, req, select: { from: true, to: true, permanent: true, enabled: true, managedTarget: true } })).docs
}
export const validateRedirectRecord: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data
  const merged = { ...originalDoc, ...data }
  if (originalDoc?.managedTarget && !req.context.slugMove && ['from', 'to', 'managedTarget'].some(key => data[key] !== undefined && JSON.stringify(data[key]) !== JSON.stringify(originalDoc[key]))) throw new APIError('This redirect follows a published service or article. Change that record’s address to update it.', 400)
  const records = await redirectRecords(req.payload, req)
  const problem = redirectProblem({ ...merged, id: originalDoc?.id }, records, siteOrigin())
  if (problem) throw new APIError(problem, 400)
  const source = normalizePath(merged.from), target = localTarget(merged.to, siteOrigin())
  const context = await publishedContext(req.payload, req)
  const paths = context.records.flatMap(item => { const path = contentPath(item.collection, item.doc); return path ? [path] : [] })
  const move = req.context.slugMove as { from?: string; to?: string } | undefined
  if (paths.includes(source) && move?.from !== source) throw new APIError('A published page already uses the old address. Choose an unused old address.', 400)
  if (target && !paths.includes(target) && move?.to !== target) throw new APIError('The local replacement page is missing or unpublished. Publish it first.', 400)
  data.from = source
  if (target && merged.to.startsWith('/')) {
    const url = new URL(merged.to, siteOrigin()); data.to = target + url.search + url.hash
  }
  return data
}
export const movePublishedSlug: CollectionBeforeChangeHook = async ({ data, originalDoc, collection, req }) => {
  if (!['services', 'posts'].includes(collection.slug) || req.context.draftOperation === true || !originalDoc?.id) return data
  const candidate = { ...originalDoc, ...data }
  if (candidate._status !== 'published') return data
  const published: any = await maybeDocument(req.payload, collection.slug, originalDoc.id, req)
  const target = contentPath(collection.slug, candidate)
  if (!target) return data
  const records = await redirectRecords(req.payload, req)
  const collision = records.find((record: any) => normalizePath(record.from) === target)
  const own = (record: any) => record.managedTarget?.relationTo === collection.slug && sameID(record.managedTarget?.value, candidate.id)
  if (collision && !own(collision)) throw new APIError('That address is already a redirect. Remove or change the redirect before using it as a page address.', 400)
  const previous = published?._status === 'published' ? contentPath(collection.slug, published) : undefined
  if (!previous || previous === target) return data
  const before = req.context.slugMove
  req.context.slugMove = { collection: collection.slug, id: candidate.id, from: previous, to: target }
  try {
    if (collision && own(collision)) await req.payload.delete({ collection: 'redirects', id: collision.id, overrideAccess: true, req })
    for (const record of records) {
      if (collision?.id === record.id) continue
      if (own(record) || localTarget(record.to, siteOrigin()) === previous) await req.payload.update({ collection: 'redirects', id: record.id, data: { to: target }, overrideAccess: true, req })
    }
    const source = records.find((record: any) => normalizePath(record.from) === previous)
    const values = { from: previous, to: target, permanent: true, enabled: true, managedTarget: { relationTo: collection.slug, value: candidate.id } }
    if (source) await req.payload.update({ collection: 'redirects', id: source.id, data: values as any, overrideAccess: true, req })
    else await req.payload.create({ collection: 'redirects', data: values as any, overrideAccess: true, req })
  } finally { req.context.slugMove = before }
  return data
}
export const removeManagedRedirects: CollectionBeforeDeleteHook = async ({ id, collection, req }) => {
  const records = await redirectRecords(req.payload, req)
  for (const record of records) if (record.managedTarget?.relationTo === collection.slug && sameID(record.managedTarget.value, id)) await req.payload.delete({ collection: 'redirects', id: record.id, req, overrideAccess: true })
}
