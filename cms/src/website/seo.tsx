import { effectiveSEO, pageMetadata, structuredData, safeJSON } from '../domain/seo.mjs'
import type { SiteData } from './content'
export { effectiveSEO, pageMetadata }
export function StructuredData({ site, collection, doc }: { site: SiteData; collection: string; doc: any }) {
  const value = structuredData(site, collection, doc)
  return value ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJSON(value) }} /> : null
}
