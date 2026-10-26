import { notFound } from 'next/navigation'
import { getSite, textOf } from '@/website/content'
import { WebsiteShell } from '@/website/shell'
import { ServiceDetail } from '@/website/service-pages'
import { pageMetadata, StructuredData } from '@/website/seo'
type Props = { params: Promise<{ slug: string }> }
export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: Props) {
  const { slug } = await params, site = await getSite()
  const service = site.services.find(item => item.slug === slug && item.detailsReviewed && textOf(item.body).trim())
  return service ? pageMetadata(site, 'services', service) : { title: 'Service unavailable', robots: { index: false, follow: false } }
}
export default async function Page({ params }: Props) {
  const { slug } = await params, site = await getSite()
  const service = site.services.find(item => item.slug === slug && item.detailsReviewed && textOf(item.body).trim())
  if (!service || !site.settings) notFound()
  return <WebsiteShell site={site}><StructuredData site={site} collection="services" doc={service} /><ServiceDetail site={site} service={service} /></WebsiteShell>
}
