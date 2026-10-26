import type { Endpoint } from 'payload'
import { isEditor } from '../domain/contracts.mjs'
import { contentPath } from '../domain/contracts.mjs'
import { readiness, maybeDocument } from '../publishing'
import { effectiveSEO } from '../domain/seo.mjs'

export const publicationChecks: Endpoint = {
  path: '/publication-checks', method: 'get',
  handler: async req => {
    const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
    if (!isEditor(req.user)) return Response.json({ error: 'Sign in as an editor.' }, { status: 403, headers })
    const params = new URL(req.url || 'http://localhost').searchParams, collection = params.get('collection'), id = params.get('id')
    if (!['pages', 'posts', 'services', 'projects', 'media', 'site-settings'].includes(collection || '') || (collection !== 'site-settings' && !/^\d+$/.test(id || ''))) return Response.json({ error: 'Choose a saved record.' }, { status: 400, headers })
    const doc: any = collection === 'site-settings' ? await req.payload.findGlobal({ slug: 'site-settings', draft: true, depth: 0, overrideAccess: false, user: req.user, req }) : await req.payload.findByID({ collection: collection as 'pages' | 'posts' | 'services' | 'projects' | 'media', id: Number(id), draft: true, depth: 0, overrideAccess: false, user: req.user, req })
    const report = await readiness(req.payload, collection!, doc, req)
    const published: any = collection === 'site-settings' ? await req.payload.findGlobal({ slug: 'site-settings', draft: false, depth: 0, overrideAccess: false, user: req.user, req }) : await maybeDocument(req.payload, collection, id, req)
    const settings: any = await req.payload.findGlobal({ slug: 'site-settings', draft: false, depth: 0, overrideAccess: false, user: req.user, req })
    const publishedPath = published?._status === 'published' ? collection === 'site-settings' ? '/' : contentPath(collection, published) : undefined
    const publishedTitle = publishedPath && collection !== 'site-settings' ? effectiveSEO({ settings, media: [] }, collection, published).title : undefined
    return Response.json({ ...report, publishedPath, publishedTitle }, { headers })
  },
}
