import { Fragment } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BatteryCharging, BookOpen, ChevronDown, Code2, Cpu, Database, GitBranch, Globe2, Layers3, Network, Server, Terminal, Truck, Zap } from 'lucide-react'
import { Link, Reveal } from './runtime'
import { Eyebrow, SectionTitle } from './primitives'
import { SocialLinks } from './contact-links'
import { InquiryForm } from './inquiry-form'
import { Button } from './components/ui/button'
import { TechnologyBadge } from './components/technology-badge'
import { grouped, nodesOf, textOf, profileFor, resolvedLink, type SiteData } from './content'
import { RichText, CMSImage } from './rich-text'
import { contentPath } from '../domain/contracts.mjs'

type Context = { site: SiteData; page: any }
type SectionContext = Context & { section: any; index: number }
export function Actions({ site, values = [], className = 'hero-actions', primary = true, nofollowExternal = false }: { site: SiteData; values?: any[]; className?: string; primary?: boolean; nofollowExternal?: boolean }) {
  const links = values.map(value => resolvedLink(site, value, { nofollowExternal })).filter(Boolean)
  return links.length ? <div className={className}>{links.map((link, i) => i === 0 && primary ? <Button key={i} asChild><Link to={link!.href} target={link!.target} rel={link!.rel}>{link!.label} <ArrowUpRight size={17} /></Link></Button> : <Link key={i} className="text-link" to={link!.href} target={link!.target} rel={link!.rel}>{link!.label} <ArrowUpRight size={15} /></Link>)}</div> : null
}
export function WorkspaceArt({ site, compact = false, image }: { site: SiteData; compact?: boolean; image?: any }) {
  const profile = profileFor(site), settings = site.settings || {}
  const portrait = !compact
  const value = image || (compact ? settings.workspaceImage : settings.portrait)
  return <Reveal className={`workspace-art ${compact ? 'compact' : ''} ${portrait ? 'has-portrait' : ''}`} delay={.12}><div className="art-topline"><span><span className="small-dot" /> SOFTWARE ENGINEERING</span><Code2 size={15} /></div><div className="workspace-image-wrap"><CMSImage site={site} value={value} className={portrait ? 'portrait' : ''} sizes="(max-width: 700px) 100vw, 50vw" /></div><div className="workspace-caption"><span>{profile.name}<small>{settings.portraitCaption}</small></span><span className="art-arrow"><ArrowUpRight size={22} /></span></div><div className="floating-note"><Globe2 size={14} />{settings.remoteLabel}</div></Reveal>
}
function Heading({ text, home = false }: { text: string; home?: boolean }) {
  if (home) return <h1>{text.split(/(web applications|AI systems|freelance)/g).map((part, i) => part === 'freelance' ? <Fragment key={i}>freelance<br className="hero-line" /></Fragment> : ['web applications', 'AI systems'].includes(part) ? <span className="serif" key={i}>{part}</span> : part)}</h1>
  const at = text.lastIndexOf(' ')
  return <h1>{at < 0 ? text : <>{text.slice(0, at + 1)}<span className="serif">{text.slice(at + 1)}</span></>}</h1>
}
function SectionImage({ site, section }: { site: SiteData; section: any }) { return section.image ? <div className="cms-section-image"><CMSImage site={site} value={section.image} alt={section.imageAlt ?? undefined} /></div> : null }
function Title({ section, index, description }: { section: any; index: number; description?: any }) {
  return <SectionTitle title={section.heading} eyebrow={section.eyebrow || ''} number={String(index + 1).padStart(2, '0')} description={description} />
}
function HomeSection({ site, page, section, index }: SectionContext) {
  const profile = profileFor(site), group = grouped(section.body)
  const description = <RichText site={site} data={group.intro} inline />
  const common = { id: section.sectionId || undefined }
  const cards = [<Network key="n" />, <Code2 key="c" />, <Server key="s" />]
  if (section.template === 'services') {
    const categories = grouped(section.body).items
    return <section {...common} className="services-section section-space"><div className="container"><Title section={section} index={index} description={description} /><div className="service-groups">{categories.map((category, n) => <Reveal className="service-group" key={category.title}><div className="service-group-heading"><span className="service-icon">{cards[n % cards.length]}</span><h3>{category.title}</h3><span className="group-count">0{n + 1}</span></div><div className="service-cards">{grouped(category.nodes, 'h4').items.map((service, k) => <article className="service-card" key={service.title}><span className="service-index">0{k + 1}</span><h4>{service.title}</h4><RichText site={site} data={service.nodes} className="prose" /></article>)}</div></Reveal>)}</div><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></div></section>
  }
  if (section.template === 'projects') return <section {...common} className="work-section container section-space"><Title section={section} index={index} description={description} /><div className="work-grid">{site.projects.map((project, n) => <Reveal key={project.id} className={`work-card work-tone-${n % 4}`} delay={n % 2 * .07}><div className="work-card-top"><span className="work-icon">{[<BookOpen key="b" />, <GitBranch key="g" />, <LayersIcon key="l" />, <AudioLines key="a" />][n % 4]}</span><span className="work-index">0{n + 1} /</span></div><h3>{project.title}</h3><RichText site={site} data={project.body} className="prose" /><CMSImage site={site} value={project.image} />{resolvedLink(site, { url: project.verifiedURL }) && <Link to={project.verifiedURL} className="text-link">{project.title} <ArrowUpRight size={16} /></Link>}<div className="work-card-decoration" aria-hidden="true">{n === 0 ? 'e.' : n === 1 ? <Network /> : n === 2 ? <Database /> : <AudioLines />}</div></Reveal>)}</div><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></section>
  if (section.template === 'process') return <section {...common} className="process-section section-space"><div className="container"><Title section={section} index={index} description={description} /><div className="process-grid">{group.items.map((step, n) => <Reveal className="process-step" key={n} delay={n * .04}><span className="step-number">0{n + 1}<ArrowRight size={17} /></span><h3>{step.title.replace(/^\d+\.?\s+/, '')}</h3><RichText site={site} data={step.nodes} className="prose" /></Reveal>)}</div>{section.note && <Reveal className="maintenance"><span><GitBranch size={21} /></span><RichText site={site} data={section.note} className="prose" /></Reveal>}<SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></div></section>
  if (section.template === 'faqs') return <section {...common} className="faq-section container section-space"><div><Title section={section} index={index} description={description} /><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></div><Reveal className="faq-items">{group.items.map((question, n) => <details key={n} className="faq-item"><summary><h3>{question.title}</h3><span><ChevronDown size={17} /></span></summary><RichText site={site} data={question.nodes} className="prose" /></details>)}</Reveal></section>
  if (section.template === 'contact') {
    const body = nodesOf(section.body)
    return <section {...common} className="home-contact section-space"><div className="container home-contact-grid"><Reveal className="home-contact-aside"><Title section={section} index={index} description={<RichText site={site} data={body.slice(0, 1)} inline />} /><RichText site={site} data={body.slice(1)} className="prose" /><a className="email-link" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={19} /></a><SocialLinks profile={profile} calendly /><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></Reveal><Reveal className="form-surface"><InquiryForm home /></Reveal></div></section>
  }
  return <section {...common} className="intro-section container section-space"><Reveal className="intro-heading"><Eyebrow number={String(index + 1).padStart(2, '0')}>{section.eyebrow}</Eyebrow><h2>{section.heading}</h2><Actions site={site} values={section.actions} primary={false} /><div className="intro-symbol" aria-hidden="true"><span>{'{'}</span><span>{'}'}</span></div></Reveal><Reveal className="intro-copy"><RichText site={site} data={section.body} className="prose" /><SectionImage site={site} section={section} /></Reveal></section>
}
function LayersIcon() { return <Layers3 /> }
export function Home({ site, page }: Context) {
  return <><section className="hero container"><Reveal className="hero-copy"><Eyebrow>{page.eyebrow}</Eyebrow><Heading home text={page.heading} /><div className="hero-description"><RichText site={site} data={page.introduction} /></div><p className="remote-line"><Globe2 size={14} />{site.settings?.remoteLabel}</p><Actions site={site} values={page.actions} /><div className="hero-tools"><p>Tools I work with</p><div>{page.tools?.map((tool: any, i: number) => <span key={i}>{tool.name}</span>)}</div></div></Reveal><WorkspaceArt site={site} image={page.heroImage} /></section>{page.sections?.map((section: any, index: number) => <HomeSection key={section.id || index} {...{ site, page, section, index }} />)}</>
}
function AboutSection({ site, page, section, index }: SectionContext) {
  const group = grouped(section.body), common = { id: section.sectionId || undefined }
  const description = <RichText site={site} data={group.intro} inline />
  if (section.template === 'technology') {
    const tech = group.items[0], nodes = tech?.nodes || [], table = nodes.find(node => node.type === 'table')
    const rows = table?.children?.slice(1).map((row: any) => row.children.map(textOf)) || []
    return <section {...common} className="experience-section section-space"><div className="container"><div className="experience-layout"><div className="experience-intro"><Title section={section} index={index} /><Reveal className="experience-margin"><span><Code2 size={42} /></span><p>Applications.<br />Data.<br /><em>AI systems.</em></p></Reveal></div><Reveal><RichText site={site} data={group.intro} className="prose" /></Reveal></div>{tech && <Reveal className="technology-section"><h3>{tech.title}</h3><RichText site={site} data={nodes.filter(node => node !== table)} className="prose" /><div className="technology-groups">{rows.map(([area, technologies]: string[], n: number) => <div key={n}><p>{area}</p><div>{technologies.split(', ').map((name, k) => <TechnologyBadge key={k} name={name} />)}</div></div>)}</div><Actions site={site} values={section.actions} /></Reveal>}<SectionImage site={site} section={section} /></div></section>
  }
  if (section.template === 'benefits' || section.template === 'interests') {
    const interest = section.template === 'interests', icons = [<Zap key="z" />, <BatteryCharging key="b" />, <Truck key="t" />, <Cpu key="c" />, <Terminal key="s" />]
    return <section {...common} className={`${interest ? 'interests' : 'benefits'}-section container section-space`}><Title section={section} index={index} description={description} /><div className={`${interest ? 'interests' : 'benefits'}-grid`}>{group.items.map((item, n) => <Reveal key={n} className={interest ? 'interest-card' : 'benefit-card'}><span className={interest ? undefined : 'benefit-number'}>{interest ? icons[n % icons.length] : `0${n + 1}`}</span><h3>{item.title}</h3>{item.nodes.length > 0 && <RichText site={site} data={item.nodes} className="prose" />}</Reveal>)}</div><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></section>
  }
  if (section.template === 'cta') return <section {...common} className="about-cta container"><Reveal><div><Eyebrow>{section.eyebrow}</Eyebrow><h2>{section.heading}</h2><RichText site={site} data={section.body} className="prose" /><SectionImage site={site} section={section} /></div><Actions site={site} values={section.actions} /></Reveal></section>
  return <section {...common} className="purpose-section container section-space"><Title section={section} index={index} /><Reveal className="purpose-copy"><RichText site={site} data={section.body} className="prose" /><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></Reveal></section>
}
export function About({ site, page }: Context) {
  return <><section className="about-hero container"><Reveal><p className="breadcrumb"><Link to="/">Home</Link><span>/</span>{page.title}</p><Eyebrow>{page.eyebrow}</Eyebrow><Heading text={page.heading} /><RichText site={site} data={page.introduction} className="prose" /><div className="about-intro-actions"><span className="remote-line"><Globe2 size={14} />{site.settings?.remoteLabel}</span><Actions site={site} values={page.actions} /></div></Reveal><WorkspaceArt site={site} compact image={page.heroImage} /></section>{page.sections?.map((section: any, index: number) => <AboutSection key={section.id || index} {...{ site, page, section, index }} />)}</>
}
export function Contact({ site, page }: Context) {
  const profile = profileFor(site), intro = nodesOf(page.introduction), formSection = page.sections?.find((section: any) => section.template === 'contact'), bookingSection = page.sections?.find((section: any) => section.template === 'cta')
  return <section className="contact-page container"><Reveal className="contact-intro"><p className="breadcrumb"><Link to="/">Home</Link><span>/</span>{page.title}</p><Eyebrow>{page.eyebrow}</Eyebrow><Heading text={page.heading} /><p className="contact-subtitle"><RichText site={site} data={intro.slice(0, 1)} inline /></p><RichText site={site} data={intro.slice(1)} className="prose" /><CMSImage site={site} value={page.heroImage} /><Actions site={site} values={page.actions} /></Reveal>{page.sections?.filter((section: any) => section.template !== 'contact' && section.template !== 'cta').map((section: any, index: number) => <Reveal key={section.id || index} className="next-steps contact-next-steps"><div id={section.sectionId}><Eyebrow>{section.eyebrow}</Eyebrow><h2>{section.heading}</h2><RichText site={site} data={section.body} className="prose" /><SectionImage site={site} section={section} /><Actions site={site} values={section.actions} /></div></Reveal>)}{formSection && <Reveal className="form-surface contact-form-surface"><div id={formSection.sectionId}><RichText site={site} data={formSection.body} className="prose" /><InquiryForm heading={formSection.heading} /><SectionImage site={site} section={formSection} /><Actions site={site} values={formSection.actions} /></div></Reveal>}<Reveal className="contact-alternatives"><div id={bookingSection?.sectionId}><p className="direct-email">Prefer email?<a href={`mailto:${profile.email}`}>Write to me at {profile.email}<ArrowUpRight size={15} /></a></p><SocialLinks profile={profile} />{bookingSection && <><h2>{bookingSection.heading}</h2><RichText site={site} data={bookingSection.body} className="prose" /><Actions site={site} values={bookingSection.actions} /><SectionImage site={site} section={bookingSection} /></>}</div></Reveal></section>
}
export function NotFound() { return <section className="not-found container"><Eyebrow>404</Eyebrow><h1>Page not found.</h1><p>This page is unavailable or has not been published.</p><a href="/">Back to home</a></section> }




