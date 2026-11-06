import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { Payload } from 'payload'
import type { Media, Post } from '../src/payload-types'

const directory = new URL('./published-blogs/', import.meta.url)
type SnapshotImage = Pick<Media, 'alt' | 'caption' | 'decorative'> & { filename: string; mimeType: string; sha256: string }
type SnapshotPost = Pick<Post, 'title' | 'slug' | 'excerpt' | 'category' | 'body' | 'publishedAt' | 'illustrationKind' | 'readingMinutes'> & {
  sourceId: string
  heroImage?: string | null
  meta?: (Omit<NonNullable<Post['meta']>, 'image'> & { image?: string | null }) | null
  actions?: unknown
  related?: unknown
}

export async function readBlogSnapshot() {
  const index: { articles: string[]; media: SnapshotImage[] } = JSON.parse(await readFile(new URL('index.json', directory), 'utf8'))
  const posts = await Promise.all(index.articles.map(async slug => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid article slug: ${slug}`)
    const post: SnapshotPost = JSON.parse(await readFile(new URL(`${slug}.json`, directory), 'utf8'))
    if (post.slug !== slug || !post.sourceId || !post.body?.root) throw new Error(`Invalid article snapshot: ${slug}`)
    return post
  }))
  const images = new Map(await Promise.all(index.media.map(async image => {
    if (!/^[a-z0-9][a-z0-9_.-]*\.(?:jpe?g|png|webp|avif)$/i.test(image.filename)) throw new Error(`Invalid image name: ${image.filename}`)
    const bytes = await readFile(new URL(`media/${image.filename}`, directory))
    if (createHash('sha256').update(bytes).digest('hex') !== image.sha256) throw new Error(`Image checksum mismatch: ${image.filename}`)
    return [image.filename, { ...image, bytes }] as const
  })))
  return { posts, images }
}

export async function resolveSnapshotPost(payload: Payload, post: SnapshotPost, images: Awaited<ReturnType<typeof readBlogSnapshot>>['images'], { apply, uploadPrefix }: { apply: boolean; uploadPrefix: string }) {
  const imageIDs = new Map<string, number>()
  async function imageID(filename?: string | null) {
    if (!filename) return null
    if (imageIDs.has(filename)) return imageIDs.get(filename)!
    const image = images.get(filename)
    if (!image) throw new Error(`Missing snapshot image: ${filename}`)
    const sourceId = `blog-image:${filename}`
    const existing = (await payload.find({ collection: 'media', where: { or: [{ sourceId: { equals: sourceId } }, { filename: { equals: filename } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    if (!existing && !apply) return filename
    const doc = existing ?? await payload.create({
      collection: 'media', overrideAccess: true, context: { localBootstrap: true },
      data: { sourceId, alt: image.alt, caption: image.caption, decorative: image.decorative, visibility: 'private' },
      file: { data: image.bytes, name: `${uploadPrefix}-${filename}`, mimetype: image.mimeType, size: image.bytes.length },
    })
    imageIDs.set(filename, doc.id)
    return doc.id
  }
  async function resolveReferences(value: unknown): Promise<unknown> {
    if (Array.isArray(value)) {
      const result = []
      for (const item of value) result.push(await resolveReferences(item))
      return result
    }
    if (!value || typeof value !== 'object') return value
    const item = value as Record<string, unknown>
    const { relationTo, value: reference } = item
    if (typeof reference === 'string' && typeof relationTo === 'string') {
      if (relationTo === 'media') return { ...item, value: await imageID(reference) }
      if (relationTo !== 'pages' && relationTo !== 'posts' && relationTo !== 'services' && relationTo !== 'projects') throw new Error(`Unsupported article relationship: ${relationTo}`)
      const field = relationTo === 'pages' ? 'pageKey' : 'slug'
      const target = (await payload.find({ collection: relationTo, where: { [field]: { equals: reference } }, limit: 1, depth: 0, draft: true, overrideAccess: true })).docs[0]
      if (!target && apply) throw new Error(`Import the referenced ${relationTo} record first: ${reference}`)
      return { ...item, value: target?.id ?? reference }
    }
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(item)) result[key] = await resolveReferences(entry)
    return result
  }

  return {
    ...post,
    body: await resolveReferences(post.body),
    actions: await resolveReferences(post.actions),
    related: await resolveReferences(post.related),
    heroImage: await imageID(post.heroImage),
    meta: post.meta ? { ...post.meta, image: await imageID(post.meta.image) } : null,
    _status: 'draft',
  }
}
