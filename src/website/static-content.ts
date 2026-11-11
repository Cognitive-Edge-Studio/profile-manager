import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { validateSlug } from '../domain/contracts.mjs'
import { readMarkdownPost } from './markdown'
import site from '../content/site.json'
import type { SiteData } from './queries'
import { readAIIntegrationService } from './ai-integration-content'

export async function readStaticSite(): Promise<SiteData> {
  const directory = join(process.cwd(), 'src', 'content', 'posts')
  const posts = []
  const media = new Map<string, SiteData['media'][number]>(site.media.map(image => [String(image.id), image]))
  const seen = new Set<string>()
  for (const file of (await readdir(directory)).sort()) {
    if (!/\.(md|json)$/.test(file)) continue
    const slug = file.replace(/\.(md|json)$/, '')
    if (validateSlug(slug) !== true || seen.has(slug)) throw new Error(`Invalid or duplicate article slug: ${file}`)
    seen.add(slug)
    if (file.endsWith('.md')) {
      const entry = await readMarkdownPost(directory, file)
      if (!entry) continue
      posts.push(entry.post)
      for (const image of entry.images) media.set(image.id, image)
    } else {
      const post = JSON.parse(await readFile(join(directory, file), 'utf8'))
      if (post.slug !== slug || !post.body?.root || !post.title) throw new Error(`Invalid article snapshot: ${file}`)
      posts.push(post)
    }
  }
  posts.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
  const aiIntegration = await readAIIntegrationService()
  if ((site.services as SiteData['services']).some(service => service.slug === aiIntegration.slug)) {
    throw new Error(`Duplicate service slug: ${aiIntegration.slug}`)
  }
  return { ...site, services: [...site.services, aiIntegration], posts, media: [...media.values()], preview: false }
}
