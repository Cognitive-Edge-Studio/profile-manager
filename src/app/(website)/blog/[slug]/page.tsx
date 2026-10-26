import { notFound } from 'next/navigation'
import { BlogArticle } from '@/website/blog-article'
import { getSite } from '@/website/content'
import { WebsiteShell } from '@/website/shell'
import { pageMetadata, StructuredData } from '@/website/seo'
type Props = { params: Promise<{ slug: string }> }
export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: Props) {
  const { slug } = await params, site = await getSite()
  const article = site.posts.find(item => item.slug === slug)
  return article ? pageMetadata(site, 'posts', article) : { title: 'Article unavailable', robots: { index: false, follow: false } }
}
export default async function Page({ params }: Props) {
  const { slug } = await params, site = await getSite()
  const article = site.posts.find(item => item.slug === slug)
  if (!article || !site.settings) notFound()
  return <WebsiteShell site={site}><StructuredData site={site} collection="posts" doc={article} /><BlogArticle site={site} article={article} /></WebsiteShell>
}
