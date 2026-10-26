import { notFound } from 'next/navigation'
import { getSite } from './content'
import { RenderPage } from './render-page'
import { WebsiteShell } from './shell'
import { pageMetadata, StructuredData } from './seo'

export async function PublicPage({ pageKey }: { pageKey: string }) {
  const site = await getSite(), page = site.pages.find(item => item.pageKey === pageKey)
  if (!page || !site.settings) notFound()
  return <WebsiteShell site={site}><StructuredData site={site} collection="pages" doc={page} /><RenderPage site={site} page={page} /></WebsiteShell>
}
export async function publicMetadata(pageKey: string, filtered = false) {
  const site = await getSite(), page = site.pages.find(item => item.pageKey === pageKey)
  if (!page || !site.settings) return { title: 'Page unavailable', robots: { index: false, follow: false } }
  return pageMetadata(site, 'pages', page, { filtered })
}
