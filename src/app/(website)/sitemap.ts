import type { MetadataRoute } from 'next'
import { getSite } from '@/website/content'
import { sitemapEntries } from '@/domain/seo.mjs'
import { normalizePath } from '@/domain/routing.mjs'
export const dynamic = 'force-static'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite()
  if (!site.settings) return []
  return sitemapEntries(site, (site.redirects || []).map(record => normalizePath(record.from)))
}
