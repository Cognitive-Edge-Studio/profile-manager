import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { Link, Reveal } from './runtime'
import { Actions } from './cms-pages'
import { RichText, CMSImage } from './rich-text'
import { contentPath } from '../domain/contracts.mjs'
import { referenceDoc, textOf, type SiteData } from './content'

export function Breadcrumbs({ site, collection, doc }: { site: SiteData; collection: string; doc: any }) {
  const home = site.pages.find(page => page.pageKey === 'home')
  const parentKey = collection === 'services' ? 'services' : collection === 'posts' ? 'blog' : undefined
  const parent = site.pages.find(page => page.pageKey === parentKey)
  return <nav className="breadcrumb" aria-label="Breadcrumb">{home && <><Link to="/">{home.title}</Link><span>/</span></>}{parent && <><Link to={contentPath('pages', parent)!}>{parent.heading || parent.title}</Link><span>/</span></>}<span aria-current="page">{doc.heading || doc.title}</span></nav>
}
export function ServicesIndex({ site, page }: { site: SiteData; page: any }) {
  const categories = [...new Set(site.services.map(service => service.category))]
  return <section className="container section-space cms-services"><Breadcrumbs site={site} collection="pages" doc={page} /><header className="section-heading"><div><p className="eyebrow">{page.eyebrow}</p><h1>{page.heading}</h1></div></header><RichText site={site} data={page.introduction} className="prose cms-service-lead" /><CMSImage site={site} value={page.heroImage} />{categories.map(category => <section key={category} className="cms-service-category"><h2>{category}</h2><div className="cms-related-grid">{site.services.filter(service => service.category === category).map(service => <Reveal key={service.id} className="cms-service-card"><h3><Link to={contentPath('services', service)!}>{service.title}<ArrowUpRight size={19} /></Link></h3><p>{service.summary}</p><CMSImage site={site} value={service.heroImage} /></Reveal>)}</div></section>)}{!site.services.length && <p>No services have been published yet.</p>}{page.sections?.map((section: any, i: number) => <section key={section.id || i} id={section.sectionId} className="cms-service-section"><h2>{section.heading}</h2><RichText site={site} data={section.body} className="prose" /><CMSImage site={site} value={section.image} alt={section.imageAlt ?? undefined} /><Actions site={site} values={section.actions} /></section>)}<Actions site={site} values={page.actions} /></section>
}
export function ServiceDetail({ site, service }: { site: SiteData; service: any }) {
  return <article className="container section-space cms-service-detail"><Breadcrumbs site={site} collection="services" doc={service} /><header className="cms-service-hero"><div><p className="eyebrow">{service.category}</p><h1>{service.title}</h1><p className="cms-service-lead">{service.summary}</p><Actions site={site} values={service.actions} /></div>{service.heroImage && <CMSImage site={site} value={service.heroImage} />}</header>{site.preview && (!service.detailsReviewed || !textOf(service.body).trim()) && <aside className="cms-service-draft-note">This saved draft needs reviewed service details before it can be published. A summary alone is not a complete service specification.</aside>}<section id="details" className="cms-service-body"><RichText site={site} data={service.body} className="prose" anchors /></section>{service.benefits?.length > 0 && <section id="benefits" className="cms-service-section"><h2>Benefits</h2><ul className="cms-service-benefits">{service.benefits.map((benefit: any, i: number) => <li key={benefit.id || i}><Check size={18} /><span>{benefit.text}</span></li>)}</ul></section>}{service.process?.length > 0 && <section id="process" className="cms-service-section"><h2>Process</h2><div className="process-grid">{service.process.map((step: any, i: number) => <section className="process-step" key={step.id || i}><span className="step-number">{String(i + 1).padStart(2, '0')}<ArrowRight size={17} /></span><h3>{step.heading}</h3><p>{step.body}</p></section>)}</div></section>}{service.faqs?.length > 0 && <section id="faqs" className="cms-service-section"><h2>Questions</h2><div className="faq-items">{service.faqs.map((faq: any, i: number) => <details className="faq-item" key={faq.id || i}><summary><h3>{faq.question}</h3></summary><RichText site={site} data={faq.answer} className="prose" /></details>)}</div></section>}<RelatedContent site={site} references={service.related} /></article>
}
export function RelatedContent({ site, references = [] }: { site: SiteData; references?: any[] }) {
  const cards = references.flatMap(reference => {
    const doc = referenceDoc(site, reference)
    if (!doc) return []
    let path = contentPath(reference.relationTo, doc)
    if (reference.relationTo === 'projects') {
      const home = site.pages.find(page => page.pageKey === 'home')
      const section = home?.sections?.find((section: any) => section.template === 'projects')
      path = section?.sectionId ? '/#' + section.sectionId : undefined
    }
    if (!path || (reference.relationTo === 'services' && !site.preview && !doc.detailsReviewed)) return []
    return [{ doc, path, reference }]
  })
  return cards.length ? <section className="cms-service-section" aria-label="Related content"><h2>Related content</h2><div className="cms-related-grid">{cards.map(({ doc, path, reference }) => <article className="cms-service-card" key={`${reference.relationTo}:${doc.id}`}><h3><Link to={path}>{doc.title}<ArrowUpRight size={18} /></Link></h3><p>{doc.summary || doc.excerpt || textOf(doc.body)}</p></article>)}</div></section> : null
}

