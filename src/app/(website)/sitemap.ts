import type { MetadataRoute } from 'next'
import { getSite, textOf } from '@/website/content'
import { sitemapEntries } from '@/domain/seo.mjs'
import { getRouting, activeRedirect } from '@/routing'
import { normalizePath } from '@/domain/routing.mjs'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite()
  if (!site.settings) return []
  const routing = await getRouting(), redirected = new Set(routing.redirects.filter(record => activeRedirect(record, routing)).map(record => normalizePath(record.from)))
  return sitemapEntries(site, [...redirected])
}
