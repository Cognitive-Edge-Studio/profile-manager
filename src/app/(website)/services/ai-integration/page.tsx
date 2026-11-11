import { notFound } from 'next/navigation'
import { BrainCircuit, ChevronDown, Database, FileSearch, MessageSquare, ScanText, Sparkles, type LucideIcon } from 'lucide-react'
import { ProcessSteps } from '@/website/cms-pages'
import { getSite, grouped } from '@/website/content'
import { SectionTitle } from '@/website/primitives'
import { RichText } from '@/website/rich-text'
import { WebsiteShell } from '@/website/shell'
import { pageMetadata, StructuredData } from '@/website/seo'
import { IntegrationDiagram } from './integration-diagram'
import styles from './page.module.css'

export async function generateMetadata() {
  const site = await getSite()
  const service = site.services.find(item => item.slug === 'ai-integration')
  return service ? pageMetadata(site, 'services', service) : { title: 'Service unavailable', robots: { index: false, follow: false } }
}

const serviceIcons: Record<string, LucideIcon> = {
  'Generative AI & LLM integration': BrainCircuit,
  'RAG & intelligent search': FileSearch,
  'Conversational AI integration': MessageSquare,
  'Intelligent document processing': ScanText,
  'Natural-language data queries': Database,
}

export default async function Page() {
  const site = await getSite()
  const service = site.services.find(item => item.slug === 'ai-integration')
  if (!service || !site.settings) notFound()

  const page = grouped(service.body, 'h2')
  const [offerings, delivery, questions, contact] = page.items
  if (page.items.length !== 4) throw new Error('The AI integration service needs four sections.')

  const services = grouped(offerings.nodes)
  const steps = grouped(delivery.nodes)
  const faqs = grouped(questions.nodes)

  return <WebsiteShell site={site}>
    <StructuredData site={site} collection="services" doc={service} />
    <article className={styles.page}>
      <header className={styles.hero}>
        <div className={'container ' + styles.heroLayout}>
          <div>
            <p className="eyebrow">AI Systems &amp; Integration</p>
            <h1>{service.title}</h1>
            <RichText site={site} data={page.intro} className={styles.heroCopy} />
          </div>
          <IntegrationDiagram />
        </div>
      </header>

      <section className="container section-space" aria-labelledby="integration-offerings">
        <h2 id="integration-offerings">{offerings.title}</h2>
        <RichText site={site} data={services.intro} className={styles.intro} />
        <div className={styles.cards}>
          {services.items.map(service => {
            const title = service.title.replaceAll('&amp;', '&')
            const Icon = serviceIcons[title] ?? Sparkles
            return <section key={service.title} className={styles.card}>
              <span className={'service-icon ' + styles.cardIcon} aria-hidden="true"><Icon /></span>
              <h3>{title}</h3>
              <RichText site={site} data={service.nodes} className="prose" />
            </section>
          })}
        </div>
      </section>

      <section id="integration-process" className="process-section section-space" aria-label={delivery.title}>
        <div className="container">
          <SectionTitle
            title={delivery.title}
            eyebrow="Collaboration Process"
            number="02"
            description={<RichText site={site} data={steps.intro} inline />}
          />
          <ProcessSteps site={site} steps={steps.items} />
        </div>
      </section>

      <section className="container section-space" aria-labelledby="integration-faqs">
        <div className={styles.faq}>
          <div>
            <h2 id="integration-faqs">{questions.title}</h2>
            <RichText site={site} data={faqs.intro} className={styles.intro} />
          </div>
          <div>
            {faqs.items.map(faq => <details className="faq-item" key={faq.title}>
              <summary>
                <h3>{faq.title}</h3>
                <span><ChevronDown size={15} aria-hidden="true" /></span>
              </summary>
              <RichText site={site} data={faq.nodes} className="prose" />
            </details>)}
          </div>
        </div>
      </section>

      <section className="container" aria-labelledby="integration-contact">
        <div className={styles.contact}>
          <h2 id="integration-contact">{contact.title}</h2>
          <RichText site={site} data={contact.nodes} className={styles.contactCopy} />
        </div>
      </section>
    </article>
  </WebsiteShell>
}
