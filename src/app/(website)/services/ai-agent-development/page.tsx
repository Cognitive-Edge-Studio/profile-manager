import { Bot, ChevronDown, ClipboardCheck, Network, Plug, Settings2, type LucideIcon } from 'lucide-react'
import { ProcessSteps } from '@/website/cms-pages'
import { getSite, grouped } from '@/website/content'
import { RichText } from '@/website/rich-text'
import { pageMetadata, StructuredData } from '@/website/seo'
import { readAIAgentDevelopmentService } from '@/website/service-content'
import { WebsiteShell } from '@/website/shell'
import styles from '@/website/styles/service-detail.module.css'
import { AgentToolSelection } from './agent-tool-selection'
import agent from './agent.module.css'

export async function generateMetadata() {
  const [site, service] = await Promise.all([getSite(), readAIAgentDevelopmentService()])
  return pageMetadata(site, 'services', service)
}

const serviceIcons: Record<string, LucideIcon> = {
  'Custom AI Agent Development': Bot,
  'AI Agent Tool & API Integration': Plug,
  'Agent Harness Setup & Customization': Settings2,
  'Multi-Agent Systems & Orchestration': Network,
  'AI Agent Testing & Evaluation': ClipboardCheck,
}

export default async function Page() {
  const [site, service] = await Promise.all([getSite(), readAIAgentDevelopmentService()])
  const page = grouped(service.body, 'h2')
  if (page.items.length !== 5) throw new Error('The AI agent development service needs five sections.')
  const [example, offerings, delivery, questions, contact] = page.items

  return (
    <WebsiteShell site={site}>
      <StructuredData site={site} collection="services" doc={service} />
      <article className={styles.page}>
        <header className={styles.hero}>
          <div className={'container ' + styles.heroLayout}>
            <div>
              <p className="eyebrow">{service.category}</p>
              <h1>{service.title}</h1>
              <RichText site={site} data={page.intro} className={styles.heroCopy} />
            </div>
            <AgentToolSelection />
          </div>
        </header>

        <section className={'container ' + agent.example} aria-labelledby="agent-example">
          <h2 id="agent-example">{example.title}</h2>
          <RichText site={site} data={example.nodes} className="prose" />
        </section>

        <section className="container section-space" aria-labelledby="agent-offerings">
          <h2 id="agent-offerings">{offerings.title}</h2>
          <div className={styles.cards + ' ' + agent.offerings}>
            {grouped(offerings.nodes).items.map(item => {
              const title = item.title.replaceAll('&amp;', '&')
              const Icon = serviceIcons[title]
              return (
                <section key={title} className={styles.card}>
                  <div className={agent.serviceHeading}>
                    {Icon && <span className={'service-icon ' + styles.cardIcon} aria-hidden="true"><Icon /></span>}
                    <h3>{title}</h3>
                  </div>
                  <RichText site={site} data={item.nodes} className="prose" />
                </section>
              )
            })}
          </div>
        </section>

        <section className={'process-section section-space ' + agent.process} aria-labelledby="agent-delivery">
          <div className="container">
            <h2 id="agent-delivery">{delivery.title}</h2>
            <ProcessSteps site={site} steps={grouped(delivery.nodes).items} />
          </div>
        </section>

        <section className="container section-space" aria-labelledby="agent-faqs">
          <div className={styles.faq}>
            <h2 id="agent-faqs">{questions.title}</h2>
            <div>
              {grouped(questions.nodes).items.map(faq => (
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

        <section className="container" aria-labelledby="agent-contact">
          <div className={styles.contact}>
            <h2 id="agent-contact">{contact.title}</h2>
            <RichText site={site} data={contact.nodes} className={styles.contactCopy} />
          </div>
        </section>
      </article>
    </WebsiteShell>
  )
}
