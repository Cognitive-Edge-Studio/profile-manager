import { Fragment, lazy, Suspense, useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { motion, MotionConfig, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, AudioLines, BatteryCharging, BookOpen, Check, ChevronDown, Code2, Cpu, Database, GitBranch, Github, Globe2, Layers3, Linkedin, Mail, Menu, Network, Send, Server, Terminal, Truck, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { TechnologyBadge } from '@/components/technology-badge'
import { CalendlyIcon } from '@/components/calendly-icon'
const Blog = lazy(() => import('@/blog').then(module => ({ default: module.Blog })))
const BlogArticle = lazy(() => import('@/blog').then(module => ({ default: module.BlogArticle })))
const MvpCalculator = lazy(() => import('@/mvp-calculator'))
import content, { beforeAction, paragraphs, profile, splitSections } from '@/content/approved'

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: .6, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>
}
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/g)
  return <>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    return link ? <a key={i} href={link[2]}>{link[1]}</a> : <Fragment key={i}>{part}</Fragment>
  })}</>
}
function Copy({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`prose ${className}`}>{paragraphs(text).map((block, i) => block.startsWith('- ') ? <ul key={i}>{block.split('\n').map(line => <li key={line}><Inline text={line.replace(/^- /, '')} /></li>)}</ul> : <p key={i}><Inline text={block} /></p>)}</div>
}
function Eyebrow({ children, number }: { children: ReactNode; number?: string }) { return <p className="eyebrow">{number && <span className="section-number">{number}</span>}{children}</p> }
function SectionTitle({ title, eyebrow, number, description }: { title: string; eyebrow: string; number?: string; description?: string }) { return <Reveal className="section-heading"><div><Eyebrow number={number}>{eyebrow}</Eyebrow><h2>{title}</h2></div>{description && <p className="section-description">{description}</p>}</Reveal> }
function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location])
  const links = <><Link to="/#services">Services</Link><Link to="/#selected-work">Selected Work</Link><NavLink to="/about/">About Me</NavLink><NavLink to="/blog/">Blog</NavLink><NavLink to="/contact/">Contact</NavLink></>
  return <header className="site-header container"><Link to="/" className="brand" aria-label="Shibly Mohammad Noman home"><img className="brand-portrait" src="/images/shibly-noman-avatar.jpg" alt="" width={40} height={40} aria-hidden="true" /><span>{profile.name}<small>{profile.role}</small></span></Link><nav className="desktop-nav" aria-label="Main navigation">{links}</nav><Button asChild variant="outline" size="sm" className="header-cta"><Link to="/#lets-talk">Discuss your project <ArrowUpRight size={15} /></Link></Button><Button variant="ghost" size="icon" className="mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-controls="mobile-navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</Button>{open && <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{links}<Link className="mobile-contact" to="/#lets-talk">Discuss your project <ArrowUpRight size={16} /></Link></nav>}</header>
}
function SocialLinks({ calendly = false }: { calendly?: boolean }) { return <div className="social-links"><a href={profile.github} target="_blank" rel="noreferrer"><Github size={15} />GitHub <ArrowUpRight size={12} /></a><a href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15} />LinkedIn <ArrowUpRight size={12} /></a>{calendly && <a href={profile.calendly} target="_blank" rel="noreferrer" aria-label="Book a call on Calendly"><CalendlyIcon size={18} />Calendly <ArrowUpRight size={12} /></a>}</div> }
function WorkspaceArt({ compact = false, portraitSrc }: { compact?: boolean; portraitSrc?: string }) {
  const portrait = portraitSrc || import.meta.env.VITE_PORTRAIT_URL?.trim()
  return <Reveal className={`workspace-art ${compact ? 'compact' : ''} ${portrait ? 'has-portrait' : ''}`} delay={.12}><div className="art-topline"><span><span className="small-dot" /> SOFTWARE ENGINEERING</span><Code2 size={15} /></div><div className="workspace-image-wrap"><img src={portrait || '/images/developer-workspace.png'} alt={portrait ? 'Shibly Mohammad Noman' : 'Custom pen-and-ink illustration of a software engineering workspace with a laptop, code, and system sketches.'} className={portrait ? 'portrait' : ''} width={portrait ? 1122 : 1024} height={portrait ? 1402 : 1024} fetchPriority={compact ? 'auto' : 'high'} /></div><div className="workspace-caption"><span>{profile.name}<small>Independent software engineer</small></span><span className="art-arrow"><ArrowUpRight size={22} /></span></div><div className="floating-note"><Globe2 size={14} /> Fully remote, anywhere.</div></Reveal>
}
function Hero() {
  const intro = paragraphs(content.home.intro)
  const tools = intro.slice(4, 7).join(' · ').split(' · ')
  return <section className="hero container"><Reveal className="hero-copy"><Eyebrow>{profile.role}</Eyebrow><h1>I'm a freelance<br className="hero-line" /> full-stack developer building <span className="serif">web applications</span> and <span className="serif">AI systems.</span></h1><p className="hero-description">{intro[1]}</p><p className="remote-line"><Globe2 size={14} />Fully remote, anywhere.</p><div className="hero-actions"><Button asChild><Link to="/#lets-talk">Discuss your project <ArrowUpRight size={17} /></Link></Button><Link className="text-link" to="/#selected-work">Explore my work <ArrowDown size={15} /></Link></div><div className="hero-tools"><p>Tools I work with</p><div>{tools.map(tool => <span key={tool}>{tool}</span>)}</div></div></Reveal><WorkspaceArt portraitSrc="/images/shibly-noman-full-stack-developer.jpg" /></section>
}
function HomeIntro() {
  const section = content.home.sections[0]
  return <section id="about-brief" className="intro-section container section-space"><Reveal className="intro-heading"><Eyebrow number="01">About Me</Eyebrow><h2>{section.title}</h2><Link className="text-link" to="/about/">More about me <ArrowUpRight size={16} /></Link><div className="intro-symbol" aria-hidden="true"><span>{'{'}</span><span>{'}'}</span></div></Reveal><Reveal className="intro-copy"><Copy text={beforeAction(section.body)} /></Reveal></section>
}
function Services() {
  const section = content.home.sections[1]
  const parsed = splitSections(beforeAction(section.body))
  const icons = [<Network />, <Code2 />, <Server />]
  return <section id="services" className="services-section section-space"><div className="container"><SectionTitle title={section.title} eyebrow="My services" number="02" description={parsed.intro} /><div className="service-groups">{parsed.items.map((group, index) => <Reveal className="service-group" key={group.title}><div className="service-group-heading"><span className="service-icon">{icons[index]}</span><h3>{group.title}</h3><span className="group-count">0{index + 1}</span></div><div className="service-cards">{splitSections(group.body, 4).items.map((service, serviceIndex) => <article className="service-card" key={service.title}><span className="service-index">0{serviceIndex + 1}</span><h4>{service.title}</h4><Copy text={service.body} /></article>)}</div></Reveal>)}</div></div></section>
}
function Work() {
  const section = content.home.sections[2]
  const parsed = splitSections(section.body)
  const icons = [<BookOpen />, <GitBranch />, <Layers3 />, <AudioLines />]
  return <section id="selected-work" className="work-section container section-space"><SectionTitle title={section.title} eyebrow="Case Studies" number="03" description={parsed.intro} /><div className="work-grid">{parsed.items.map((project, index) => <Reveal key={project.title} className={`work-card work-tone-${index}`} delay={index % 2 * .07}><div className="work-card-top"><span className="work-icon">{icons[index]}</span><span className="work-index">0{index + 1} /</span></div><h3>{project.title}</h3><Copy text={project.body} /><div className="work-card-decoration" aria-hidden="true">{index === 0 ? 'e.' : index === 1 ? <Network /> : index === 2 ? <Database /> : <AudioLines />}</div></Reveal>)}</div></section>
}
function Process() {
  const section = content.home.sections[3]
  const [steps, maintenance] = section.body.split('**Maintenance')
  const parsed = splitSections(steps)
  return <section className="process-section section-space"><div className="container"><SectionTitle title={section.title} eyebrow="Collaboration Process" number="04" description={parsed.intro} /><div className="process-grid">{parsed.items.map((step, index) => <Reveal className="process-step" key={step.title} delay={index * .04}><span className="step-number">0{index + 1}<ArrowRight size={17} /></span><h3>{step.title.replace(/^\d\. /, '')}</h3><Copy text={step.body} /></Reveal>)}</div><Reveal className="maintenance"><span><GitBranch size={21} /></span><Copy text={`**Maintenance${maintenance}`} /></Reveal></div></section>
}
function Faq() {
  const section = content.home.sections[4]
  const parsed = splitSections(section.body)
  return <section className="faq-section container section-space"><div><SectionTitle title={section.title} eyebrow="FAQs" number="05" description={parsed.intro} /><p className="faq-email"><Mail size={15} /><a href={`mailto:${profile.email}`}>{profile.email}</a></p></div><Reveal className="faq-items">{parsed.items.map(question => <details key={question.title} className="faq-item"><summary><h3>{question.title}</h3><span><ChevronDown size={17} /></span></summary><Copy text={question.body} /></details>)}</Reveal></section>
}
function InquiryForm({ home = false }: { home?: boolean }) {
  const id = useId()
  const location = useLocation()
  const calculatorSummary = !home && typeof location.state?.calculatorSummary === 'string' ? location.state.calculatorSummary.slice(0, 7800) : ''
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'draft' | 'error'>('idle')
  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim()
  const email = import.meta.env.VITE_CONTACT_EMAIL?.trim() || profile.email
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return
    const form = event.currentTarget
    const payload = Object.fromEntries(new FormData(form).entries())
    if (endpoint) {
      setState('sending')
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
        if (!response.ok) throw new Error('The message could not be delivered.')
        setState('success')
        form.reset()
      } catch {
        setState('error')
        setError(`Your message could not be sent. Your details are still here. Please try again or email ${email}.`)
      }
    } else {
      const message = `Name: ${payload.name}\nEmail: ${payload.email}\n${payload.timeline ? `Preferred timeline: ${payload.timeline}\n` : ''}Budget: ${payload.budget || 'Not specified'}\n\n${payload.message}`
      const link = document.createElement('a')
      link.href = `mailto:${email}?subject=${encodeURIComponent(`Project inquiry from ${payload.name}`)}&body=${encodeURIComponent(message)}`
      link.click()
      setState('draft')
    }
  }
  return <div className="inquiry-form"><div className="form-title">{home ? <h3>Inquiry form</h3> : <><div><Eyebrow>Project inquiry</Eyebrow><h2>Send me a message</h2></div></>}<Send size={20} /></div>{calculatorSummary && <div className="calculator-inquiry-note">Your calculator summary is ready below. Review and edit it before sending. <Link to="/tools/mvp-cost-calculator/">Return to your plan</Link></div>}<form onSubmit={submit} onChange={() => { if (state !== 'sending') setState('idle') }}><div className="form-row"><label htmlFor={`${id}-name`}>Your name <span>*</span><Input id={`${id}-name`} name="name" autoComplete="name" placeholder="Your name" required maxLength={120} /></label><label htmlFor={`${id}-email`}>Email address <span>*</span><Input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></label></div><label htmlFor={`${id}-message`}>{home ? 'Tell me about the project' : 'About your project'} <span>*</span><Textarea id={`${id}-message`} name="message" defaultValue={calculatorSummary} placeholder="I'd like to build or improve… It's for… I need help with…" required minLength={10} maxLength={8000} rows={5} /></label>{home && <label htmlFor={`${id}-timeline`}>Preferred timeline <span className="optional">Optional</span><Input id={`${id}-timeline`} name="timeline" placeholder="When would you like to get started?" maxLength={150} /></label>}<label htmlFor={`${id}-budget`}>Budget range <span className="optional">Optional</span><Input id={`${id}-budget`} name="budget" placeholder="A rough range, if you have one" maxLength={150} /><small>A rough range helps me suggest an approach that fits what you're ready to spend. It's fine if you're still working this out.</small></label><div className="inquiry-actions"><Button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send your message'}<ArrowUpRight size={17} /></Button>{!home && <CalendlyLink />}</div>{!endpoint && <p className="form-delivery-note">Opens an email draft. Review and send it from your email app.</p>}{state === 'success' && <div role="status" className="form-status"><Check size={18} /><div><strong>Message received</strong><p>Thank you for sharing your project. I'll review your message and get back to you by email.</p></div></div>}{state === 'draft' && <p role="status" className="form-status">Your email draft is ready. Send it from your email app to complete your inquiry.</p>}{state === 'error' && <p role="alert" className="form-error">{error}</p>}</form></div>
}
function CalendlyLink() {
  return <Button asChild variant="outline"><a href={profile.calendly} target="_blank" rel="noreferrer" aria-label="Talk to me directly on Calendly"><CalendlyIcon size={18} />Talk to me directly! <ArrowUpRight size={16} /></a></Button>
}
function HomeContact() {
  const section = content.home.sections[5]
  const [intro, next] = paragraphs(section.body)
  return (
    <section id="lets-talk" className="home-contact section-space">
      <div className="container home-contact-grid">
        <Reveal className="home-contact-aside">
          <SectionTitle title={section.title} eyebrow="Contact Me" number="06" description={intro} />
          <Copy text={next} />
          <a className="email-link" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={19} /></a>
          <SocialLinks calendly />
        </Reveal>
        <Reveal className="form-surface"><InquiryForm home /></Reveal>
      </div>
    </section>
  )
}
function Home() { return <><Hero /><HomeIntro /><Services /><Work /><Process /><Faq /><HomeContact /></> }
function About() {
  const intro = paragraphs(content.about.intro)
  const sections = content.about.sections
  const experience = splitSections(sections[1].body)
  const tech = experience.items[0]
  const techBlocks = paragraphs(tech.body)
  const techRows = techBlocks.find(block => block.startsWith('|'))?.split('\n').slice(2).map(row => row.split('|').slice(1, -1).map(value => value.trim())) || []
  const benefits = splitSections(sections[2].body)
  const dreams = splitSections(sections[3].body)
  const interestIcons = [<Zap />, <BatteryCharging />, <Truck />, <Cpu />, <Terminal />]
  return <><section className="about-hero container"><Reveal><p className="breadcrumb"><Link to="/">Home</Link><span>/</span>About Me</p><Eyebrow>About Me</Eyebrow><h1>Hi, I'm <span className="serif">Shibly.</span></h1><Copy text={intro.slice(1, 3).join('\n\n')} /><div className="about-intro-actions"><span className="remote-line"><Globe2 size={14} />Fully remote, anywhere.</span><Button asChild><Link to="/contact/">Contact me <ArrowUpRight size={16} /></Link></Button></div></Reveal><WorkspaceArt compact /></section><section className="purpose-section container section-space"><SectionTitle title={sections[0].title} eyebrow="A person behind the work" number="01" /><Reveal className="purpose-copy"><Copy text={sections[0].body} /></Reveal></section><section className="experience-section section-space"><div className="container"><div className="experience-layout"><div className="experience-intro"><SectionTitle title={sections[1].title} eyebrow="Background" number="02" /><Reveal className="experience-margin"><span><Code2 size={42} /></span><p>Applications.<br />Data.<br /><em>AI systems.</em></p></Reveal></div><Reveal><Copy text={experience.intro} /></Reveal></div><Reveal className="technology-section"><h3>{tech.title}</h3><Copy text={techBlocks[0]} /><div className="technology-groups">{techRows.map(([area, technologies]) => <div key={area}><p>{area}</p><div>{technologies.split(', ').map(name => <TechnologyBadge key={name} name={name} />)}</div></div>)}</div><Link className="text-link" to="/#selected-work">Explore my work <ArrowUpRight size={16} /></Link></Reveal></div></section><section className="benefits-section container section-space"><SectionTitle title={sections[2].title} eyebrow="Working together" number="03" description={benefits.intro} /><div className="benefits-grid">{benefits.items.map((benefit, index) => <Reveal className="benefit-card" key={benefit.title}><span className="benefit-number">0{index + 1}</span><h3>{benefit.title}</h3><Copy text={benefit.body} /></Reveal>)}</div></section><section className="interests-section container section-space"><SectionTitle title={sections[3].title} eyebrow="Looking ahead" number="04" description={dreams.intro} /><div className="interests-grid">{dreams.items.map((dream, index) => <Reveal key={dream.title} className="interest-card"><span>{interestIcons[index]}</span><h3>{dream.title}</h3></Reveal>)}</div></section><section className="about-cta container"><Reveal><div><Eyebrow>A conversation</Eyebrow><h2>{sections[4].title}</h2><Copy text={sections[4].body.split('**Discuss your project**')[0]} /></div><Button asChild><Link to="/contact/">Discuss your project <ArrowUpRight size={17} /></Link></Button></Reveal></section></>
}
function Contact() {
  const intro = paragraphs(content.contact.intro)
  return (
    <section className="contact-page container">
      <Reveal className="contact-intro">
        <p className="breadcrumb"><Link to="/">Home</Link><span>/</span>Contact</p>
        <Eyebrow>Let's talk</Eyebrow>
        <h1>Contact <span className="serif">me</span></h1>
        <p className="contact-subtitle"><Inline text={intro[1]} /></p>
        <Copy text={intro[2]} />
      </Reveal>
      <Reveal className="next-steps contact-next-steps">
        <Eyebrow>The next step</Eyebrow>
        <h2>{content.contact.sections[0].title}</h2>
        <Copy text={content.contact.sections[0].body} />
      </Reveal>
      <Reveal className="form-surface contact-form-surface"><InquiryForm /></Reveal>
      <Reveal className="contact-alternatives">
        <p className="direct-email">Prefer email?<a href={`mailto:${profile.email}`}>Write to me at {profile.email}<ArrowUpRight size={15} /></a></p>
        <SocialLinks />
      </Reveal>
    </section>
  )
}
function Footer() {
  const reduced = useReducedMotion()
  return <footer className="site-footer container"><div className="footer-top"><Link className="footer-brand" to="/"><img className="brand-portrait" src="/images/shibly-noman-avatar.jpg" alt="" width={36} height={36} aria-hidden="true" /><span className="footer-name">{profile.name}<span>{profile.role}</span></span></Link><nav aria-label="Footer navigation"><Link to="/#services">Services</Link><Link to="/#selected-work">Selected Work</Link><Link to="/about/">About Me</Link><Link to="/blog/">Blog</Link><Link to="/tools/mvp-cost-calculator/">Cost calculator</Link><Link to="/contact/">Contact</Link></nav><SocialLinks calendly /></div><div className="footer-bottom"><p>© {new Date().getFullYear()} {profile.name}</p><span><Globe2 size={12} />Fully remote, anywhere.</span><button onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })}>Back to top <ArrowUp size={14} /></button></div></footer>
}
function NotFound() { return <section className="not-found container"><Eyebrow>404</Eyebrow><h1>Page not found.</h1><p>Head back to the homepage to explore my services and work.</p><Button asChild><Link to="/">Back to home <ArrowRight size={17} /></Link></Button></section> }
function PageEffects() {
  const { pathname, hash } = useLocation()
  const reduced = useReducedMotion()
  useEffect(() => {
    document.title = pathname.startsWith('/tools/mvp-cost-calculator') ? 'MVP Cost Calculator | First-Release Budget | Shibly Noman' : pathname.startsWith('/blog') ? 'Blog | Shibly Noman — Software & MVP Guides' : pathname.startsWith('/about') ? 'About Shibly Mohammad Noman | Software Engineer' : pathname.startsWith('/contact') ? 'Contact Shibly Mohammad Noman | Software Engineer' : pathname === '/' ? 'Freelance Full-Stack Developer | Shibly Mohammad Noman' : 'Page not found | Shibly Mohammad Noman'
    const description = pathname.startsWith('/tools/mvp-cost-calculator') ? 'Plan your first MVP, compare build costs, and add running costs using your own figures. See what’s included and what you still need to check.' : pathname.startsWith('/blog') ? 'Practical guides from Shibly Noman on hiring a developer, planning an MVP, prioritizing features, and understanding development costs.' : pathname.startsWith('/about') ? 'Meet Shibly Mohammad Noman, an independent software engineer based in Bangladesh building applications and AI systems.' : pathname.startsWith('/contact') ? 'Discuss a new idea, an existing application, or a problem your team wants to solve with Shibly Mohammad Noman.' : 'Work directly with Shibly, a freelance full-stack developer, to build web applications, integrate AI, or improve existing software.'
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, reduced])
  return null
}
export default function App() {
  const location = useLocation()
  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#main-content">Skip to content</a><Header /><PageEffects /><main id="main-content"><motion.div key={location.pathname} initial={{ opacity: .6 }} animate={{ opacity: 1 }} transition={{ duration: .25 }}><Suspense fallback={<section className="container section-space" aria-busy="true"><p className="eyebrow">Loading the page…</p></section>}><Routes><Route path="/" element={<Home />} /><Route path="/about/" element={<About />} /><Route path="/contact/" element={<Contact />} /><Route path="/tools/mvp-cost-calculator/" element={<MvpCalculator />} /><Route path="/blog/" element={<Blog />} /><Route path="/blog/:slug/" element={<BlogArticle />} /><Route path="*" element={<NotFound />} /></Routes></Suspense></motion.div></main><Footer /></MotionConfig>
}









