import { ChartNoAxesCombined, ChevronDown, ContactRound, FileCheck2, FilePenLine, Headset, Inbox, type LucideIcon } from 'lucide-react'
import { ProcessSteps } from '@/website/cms-pages'
import { getSite, grouped } from '@/website/content'
import { RichText } from '@/website/rich-text'
import { pageMetadata, StructuredData } from '@/website/seo'
import { readAIWorkflowAutomationDraft } from '@/website/service-content'
import { WebsiteShell } from '@/website/shell'
import styles from '@/website/styles/service-detail.module.css'
import { ConnectedWorkflows } from './workflow-visuals'
import workflow from './workflow.module.css'

export async function generateMetadata() {
  const [site, service] = await Promise.all([getSite(), readAIWorkflowAutomationDraft()])
  return pageMetadata(site, 'services', service)
}

const serviceIcons: Record<string, LucideIcon> = {
  'Lead Qualification & CRM Automation': ContactRound,
  'Email & Inbox Automation': Inbox,
  'Customer Support Workflow Automation': Headset,
  'Document Workflow Automation': FileCheck2,
  'Content Workflow Automation': FilePenLine,
  'Reporting & Summary Automation': ChartNoAxesCombined,
}

export default async function Page() {
  const [site, service] = await Promise.all([getSite(), readAIWorkflowAutomationDraft()])
  const page = grouped(service.body, 'h2')
  const [offerings, delivery, questions, contact] = page.items
  if (page.items.length !== 4) throw new Error('The AI workflow automation draft needs four sections.')

  const services = grouped(offerings.nodes)
  const steps = grouped(delivery.nodes)
  const faqs = grouped(questions.nodes)

  return (
    <WebsiteShell site={site}>
      <StructuredData site={site} collection="services" doc={service} />
      <article className={styles.page}>
        <header className={styles.hero}>
          <div className={'container ' + styles.heroLayout}>
            <div>
              <p className="eyebrow">AI Systems &amp; Integration</p>
              <h1>{service.title}</h1>
              <RichText site={site} data={page.intro} className={styles.heroCopy} />
            </div>
            <ConnectedWorkflows />
          </div>
        </header>

        <section className="container section-space" aria-labelledby="workflow-offerings">
          <h2 id="workflow-offerings">{offerings.title}</h2>
          <div className={styles.cards + ' ' + workflow.serviceCards}>
            {services.items.map(item => {
              const title = item.title.replaceAll('&amp;', '&')
              const Icon = serviceIcons[title]
              return (
                <section key={title} className={styles.card}>
                  {Icon && <span className={'service-icon ' + styles.cardIcon} aria-hidden="true"><Icon /></span>}
                  <h3>{title}</h3>
                  <RichText site={site} data={item.nodes} className="prose" />
                </section>
              )
            })}
          </div>
        </section>

        <section className="process-section section-space" aria-labelledby="workflow-delivery">
          <div className="container">
            <h2 id="workflow-delivery">{delivery.title}</h2>
            <ProcessSteps site={site} steps={steps.items} />
          </div>
        </section>

        <section className="container section-space" aria-labelledby="workflow-faqs">
          <div className={styles.faq}>
            <h2 id="workflow-faqs">{questions.title}</h2>
            <div>
              {/* The browser can open a matching FAQ before React hydrates it. */}
              {faqs.items.map(faq => (
                <details className="faq-item" key={faq.title} suppressHydrationWarning>
                  <summary>
                    <h3>{faq.title}</h3>
                    <span><ChevronDown size={15} aria-hidden="true" /></span>
                  </summary>
                  <RichText site={site} data={faq.nodes} className="prose" />
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="container" aria-labelledby="workflow-contact">
          <div className={styles.contact}>
            <h2 id="workflow-contact">{contact.title}</h2>
            <RichText site={site} data={contact.nodes} className={styles.contactCopy} />
          </div>
        </section>
      </article>
    </WebsiteShell>
  )
}
