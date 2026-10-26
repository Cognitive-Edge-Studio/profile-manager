import { Suspense } from 'react'
import { Home, About, Contact } from './pages'
import { Blog } from './blog-index'
import MvpCalculator from './calculator'
import { summaries, profileFor, mediaFor, referenceDoc, textOf, type SiteData } from './content'
import { RichText } from './rich-text'
import { Actions } from './cms-pages'
import { RelatedBlogs } from './related-blogs'
import { ServicesIndex, RelatedContent } from './service-pages'

export function RenderPage({ site, page }: { site: SiteData; page: any }) {
  const related = (page.related || []).flatMap((reference: any) => reference.relationTo === "posts" ? [referenceDoc(site, reference)].filter(Boolean) : [])
  return <><PageContent site={site} page={page} />{related.length > 0 && <div className="container"><RelatedBlogs currentSlug="" articles={summaries(site, related)} /></div>}<div className="container"><RelatedContent site={site} references={page.related?.filter((reference: any) => reference.relationTo !== 'posts')} /></div></>
}
function PageContent({ site, page }: { site: SiteData; page: any }) {
  if (page.pageKey === 'services') return <ServicesIndex site={site} page={page} />
  if (page.pageKey === 'home') return <Home site={site} page={page} />
  if (page.pageKey === 'about') return <About site={site} page={page} />
  if (page.pageKey === 'contact') return <Contact site={site} page={page} />
  if (page.pageKey === 'blog') {
    const about = site.pages.find(item => item.pageKey === 'about'), cta = about?.sections?.find((section: any) => section.template === 'cta')
    return <Suspense fallback={<section className="container section-space" aria-busy="true">Loading articles…</section>}><Blog articles={summaries(site)} profile={profileFor(site)} heading={page.heading} eyebrow={page.eyebrow} introduction={<RichText site={site} data={page.introduction} />} contactTitle={cta?.heading || ''} contactBody={<RichText site={site} data={cta?.body} inline />} avatar={mediaFor(site, site.settings?.avatar)?.url} preview={site.preview} contactActions={<Actions site={site} values={cta?.actions} />} /></Suspense>
  }
  if (page.pageKey === 'calculator') return <MvpCalculator readingArticles={summaries(site).filter(article => ['mvp-feature-prioritization', 'how-to-build-an-mvp'].includes(article.slug))} heading={page.heading} lead={textOf(page.introduction)} />
  return <section className="container section-space"><h1>{page.heading}</h1><RichText site={site} data={page.introduction} />{page.sections?.map((section: any, i: number) => <section key={section.id || i} id={section.sectionId}><h2>{section.heading}</h2><RichText site={site} data={section.body} /><Actions site={site} values={section.actions} /></section>)}</section>
}

