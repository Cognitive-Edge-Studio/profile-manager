import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isEditor } from '@/domain/contracts.mjs'
import { readSite } from '@/website/content'
import { WebsiteShell } from '@/website/shell'
import { RenderPage } from '@/website/render-page'
import { BlogArticle } from '@/website/blog-article'
import { RichText } from '@/website/rich-text'
import { ServiceDetail } from '@/website/service-pages'
import { pageMetadata } from '@/website/seo'
export const dynamic = 'force-dynamic'
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const payload = await getPayload({ config }), { user } = await payload.auth({ headers: await headers() })
  if (!isEditor(user)) return { title: 'Private content preview', robots: { index: false, follow: false } }
  const params = await searchParams
  const site = await readSite(payload, user)
  const collection = params.collection === 'site-settings' ? 'pages' : String(params.collection)
  const docs = ['pages','posts','services','projects'].includes(collection) ? site[collection as 'pages'|'posts'|'services'|'projects'] : []
  const doc = docs.find(item => params.collection === 'site-settings' ? item.pageKey === 'home' : String(item.id) === params.id)
  return doc ? pageMetadata(site, collection, doc) : { title: 'Private content preview', robots: { index: false, follow: false } }
}
export default async function Preview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!isEditor(user)) redirect('/admin/login')
  const params = await searchParams
  const settingsPreview = params.collection === 'site-settings'
  if (!settingsPreview && (!['pages','services','posts','projects'].includes(String(params.collection)) || typeof params.id !== 'string' || !/^\d+$/.test(params.id))) notFound()
  const site = await readSite(payload, user)
  const docs = settingsPreview ? site.pages : site[params.collection as 'pages'|'services'|'posts'|'projects']
  const doc = docs.find(item => settingsPreview ? item.pageKey === 'home' : String(item.id) === params.id)
  if (!doc) notFound()
  return <WebsiteShell site={site}><aside className="cms-preview-banner"><strong>Private content preview</strong><span>Saved draft — visible only to signed-in editors.</span><a href={settingsPreview ? "/admin/globals/site-settings" : `/admin/collections/${params.collection}/${params.id}`}>Return to editing</a><a href="/">View published website</a></aside>{settingsPreview || params.collection === 'pages' ? <RenderPage site={site} page={doc} /> : params.collection === 'posts' ? <BlogArticle site={site} article={doc} /> : params.collection === 'services' ? <ServiceDetail site={site} service={doc} /> : <section className="container section-space"><h1>{doc.title}</h1>{doc.summary && <p>{doc.summary}</p>}<RichText site={site} data={doc.body} /></section>}</WebsiteShell>
}


