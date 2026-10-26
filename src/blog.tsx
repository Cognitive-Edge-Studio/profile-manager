import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Calculator, Check, Clock3, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendlyIcon } from '@/components/calendly-icon'
import articles from '@/content/blog.json'
import content, { beforeAction, profile, splitSections } from '@/content/approved'
import { ArticleArt } from '@/components/article-art'
import './blog.css'

type Article = (typeof articles)[number]
const topics = ['All articles', 'Planning an MVP', 'Hiring a developer']
const articleServices = splitSections(beforeAction(content.home.sections[1].body)).items.map(group => group.title)

function ArticleContactCard() {
  return <div className="article-contact-card">
    <h2>Hire me as your developer</h2>
    <p>Work directly with me to turn your idea into useful software or improve a product you already have.</p>
    <ul className="article-contact-services" aria-label="Services">{articleServices.map(service => <li key={service}><Check size={15} aria-hidden="true" /><span>{service}</span></li>)}</ul>
    <div className="article-contact-actions">
      <Button asChild><Link to="/contact/">Contact me <ArrowUpRight size={15} /></Link></Button>
      <Button asChild variant="outline"><a href={profile.calendly} target="_blank" rel="noreferrer"><CalendlyIcon size={17} />Book a meeting</a></Button>
    </div>
  </div>
}

function Enter({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5 }}>{children}</motion.div>
}

function Meta({ article }: { article: Article }) {
  return <div className="journal-meta"><span>{article.category}</span><span className="reading-time"><Clock3 size={12} />{article.minutes} min read</span></div>
}

export function Blog() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const topic = topics.includes(params.get('topic') || '') ? params.get('topic')! : topics[0]
  const [search, setSearch] = useState(query)
  useEffect(() => { setSearch(query) }, [query])
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === topics[0]) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true, preventScrollReset: true })
  }
  const visible = articles.filter(article => (topic === topics[0] || topic === article.category) && `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.toLowerCase().trim()))
  const featured = articles.find(article => article.kind === 'build')!
  const browsing = Boolean(query || topic !== topics[0])
  return <div className="journal-page">
    <section className="journal-intro container">
      <p className="breadcrumb"><Link to="/">Home</Link><span>/</span>Blog</p>
      <Enter className="journal-intro-grid"><div><p className="eyebrow"><span className="journal-dash" />The journal</p><h1>Blog</h1></div><div className="journal-intro-aside"><Link to="/about/" className="journal-author"><img src="/images/shibly-noman-avatar.jpg" alt="" width={36} height={36} /><span>{profile.name}<small>{profile.role}</small></span><ArrowUpRight size={16} /></Link></div></Enter>
    </section>
    {!browsing && <section className="container journal-feature" aria-labelledby="featured-heading"><Enter><Link to={`/blog/${featured.slug}/`} className="featured-link"><div className="featured-copy"><p className="eyebrow"><BookOpen size={14} />Start here · Featured guide</p><h2 id="featured-heading">{featured.title}</h2><p>{featured.excerpt}</p><Meta article={featured} /><span className="featured-action">Read the guide <ArrowUpRight size={17} /></span></div><ArticleArt kind="build" featured /></Link></Enter></section>}
    <section className="container journal-library" aria-labelledby="articles-heading">
      <div className="journal-library-heading"><div><p className="eyebrow">Blog</p><h2 id="articles-heading">Articles<span className="article-count">{articles.length.toString().padStart(2, '0')}</span></h2></div></div>
      <div className="journal-controls"><div className="journal-filters" role="group" aria-label="Filter articles by topic">{topics.map(item => <button key={item} aria-pressed={topic === item} className={topic === item ? 'selected' : ''} onClick={() => update('topic', item)}>{item}</button>)}</div><form role="search" className="journal-search" onSubmit={event => { event.preventDefault(); update('q', search.trim()) }}><Search size={16} /><input aria-label="Search articles" placeholder="Search articles…" value={search} onChange={event => { setSearch(event.target.value); update('q', event.target.value) }} />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); update('q', '') }}><X size={14} /></button>}</form></div>
      <p className="journal-result-count" role="status">{browsing ? `${visible.length} ${visible.length === 1 ? 'article' : 'articles'}${query ? ` matching “${query}”` : ''}` : `${articles.length} articles`}</p>
      {visible.length ? <div className="journal-cards">{visible.map(article => <Enter key={article.slug}><article className="journal-card"><Link to={`/blog/${article.slug}/`} className="journal-card-link"><ArticleArt kind={article.kind} /><div className="journal-card-copy"><Meta article={article} /><h3>{article.title}</h3><p>{article.excerpt}</p><span className="journal-read">Read article <ArrowUpRight size={16} /></span></div></Link></article></Enter>)}</div> : <div className="journal-empty"><Search size={25} /><h3>No articles found</h3><p>Try a different phrase or browse all the guides.</p><Button variant="outline" onClick={() => { setSearch(''); setParams({}) }}>Show all articles <ArrowRight size={15} /></Button></div>}
    </section>
    <section className="container journal-contact"><Enter><div><h2>{content.about.sections[4].title}</h2><p>{content.about.sections[4].body.split('**Discuss your project**')[0].trim()}</p></div><Button asChild><Link to="/contact/">Discuss your project <ArrowUpRight size={17} /></Link></Button></Enter></section>
  </div>
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return <>{parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const match = articles.find(article => link[2].includes(article.slug))
      if (match) return <Link key={index} to={`/blog/${match.slug}/`}>{link[1]}</Link>
      const href = link[2] === '/' || link[2].startsWith('/contact') || link[2].startsWith('/about') || link[2].startsWith('/#') ? link[2] : /^https?:\/\//.test(link[2]) ? link[2] : undefined
      return href ? <a key={index} href={href} rel="noreferrer">{link[1]}</a> : <Fragment key={index}>{link[1]}</Fragment>
    }
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    return <Fragment key={index}>{part}</Fragment>
  })}</>
}

function Markdown({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((block, index) => {
    const heading = block.match(/^(#{2,4})\s+(.+)$/)
    if (heading) { const Tag = `h${heading[1].length}` as 'h2' | 'h3' | 'h4'; return <Tag key={index}><InlineMarkdown text={heading[2]} /></Tag> }
    if (block.startsWith('>')) return <blockquote key={index}>{block.split('\n').map((line, i) => <p key={i}><InlineMarkdown text={line.replace(/^>\s?/, '')} /></p>)}</blockquote>
    if (block.startsWith('|')) {
      const rows = block.split('\n').filter(row => !/^\|[\s:|\-]+\|$/.test(row)).map(row => row.split('|').slice(1, -1).map(cell => cell.trim()))
      const pricing = rows[0][1] === 'Published hourly rate'
      const estimate = rows[0][0] === 'Part of the Estimate'
      return <div className={`article-table${pricing ? ' pricing-table' : ''}${estimate ? ' estimate-table' : ''}`} key={index}><table>{(pricing || estimate) && <colgroup>{rows[0].map((_, i) => <col key={i} />)}</colgroup>}<thead><tr>{rows[0].map((cell, i) => <th key={i}><InlineMarkdown text={cell} /></th>)}</tr></thead><tbody>{rows.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}><InlineMarkdown text={cell} /></td>)}</tr>)}</tbody></table></div>
    }
    if (/^[-*] /.test(block)) return <ul key={index}>{block.split('\n').map((line, i) => <li key={i}><InlineMarkdown text={line.replace(/^[-*] /, '')} /></li>)}</ul>
    if (/^\d+\. /.test(block)) return <ol key={index}>{block.split('\n').map((line, i) => <li key={i}><InlineMarkdown text={line.replace(/^\d+\. /, '')} /></li>)}</ol>
    if (/^---+$/.test(block)) return <hr key={index} />
    return <p key={index}><InlineMarkdown text={block} /></p>
  })}</>
}

function RelatedBlogs({ currentSlug }: { currentSlug: string }) {
  const related = articles.filter(item => item.slug !== currentSlug).slice(0, 3)
  const track = useRef<HTMLDivElement>(null)
  const id = useId()
  const reduced = useReducedMotion()
  const [canPrevious, setCanPrevious] = useState(false)
  const [canNext, setCanNext] = useState(false)

  function updateControls() {
    const element = track.current
    if (!element) return
    setCanPrevious(element.scrollLeft > 2)
    setCanNext(element.scrollLeft + element.clientWidth < element.scrollWidth - 2)
  }

  useEffect(() => {
    const element = track.current
    if (!element) return
    updateControls()
    const observer = new ResizeObserver(updateControls)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function slide(direction: number) {
    const element = track.current
    const card = element?.firstElementChild as HTMLElement | null
    if (!element || !card) return
    element.scrollBy({ left: direction * (card.offsetWidth + 18), behavior: reduced ? 'instant' : 'smooth' })
  }

  return <aside className="related-blogs" aria-labelledby={`${id}-heading`} aria-roledescription="carousel">
    <div className="related-blogs-heading">
      <div><p className="eyebrow">More from the journal</p><h2 id={`${id}-heading`}>Blogs you might need to read</h2></div>
      {(canPrevious || canNext) && <div className="related-blogs-controls" aria-label="Browse related blogs">
        <button type="button" aria-label="Previous blogs" aria-controls={`${id}-track`} disabled={!canPrevious} onClick={() => slide(-1)}><ArrowLeft size={17} /></button>
        <button type="button" aria-label="Next blogs" aria-controls={`${id}-track`} disabled={!canNext} onClick={() => slide(1)}><ArrowRight size={17} /></button>
      </div>}
    </div>
    <div className="related-blogs-track" id={`${id}-track`} ref={track} onScroll={updateControls} tabIndex={0} aria-label="Related blog articles" onKeyDown={event => {
      if (event.target !== event.currentTarget) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        slide(event.key === 'ArrowRight' ? 1 : -1)
      }
    }}>
      {related.map((item, index) => <article className="journal-card related-blog-card" key={item.slug} aria-label={`${index + 1} of ${related.length}`}>
        <Link to={`/blog/${item.slug}/`} className="journal-card-link">
          <ArticleArt kind={item.kind} />
          <div className="journal-card-copy"><Meta article={item} /><h3>{item.title}</h3><p>{item.excerpt}</p><span className="journal-read">Read article <ArrowUpRight size={16} /></span></div>
        </Link>
      </article>)}
    </div>
    <div className="related-blogs-footer"><Link className="text-link" to="/blog/">View all blogs <ArrowUpRight size={15} /></Link><Button asChild><Link to="/contact/">Discuss your project <ArrowUpRight size={16} /></Link></Button></div>
  </aside>
}


export function BlogArticle() {
  const { slug } = useParams()
  const article = articles.find(item => item.slug === slug)
  useEffect(() => {
    if (!article) return
    document.title = article.metaTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', article.metaDescription)
  }, [article])
  if (!article) return <section className="container journal-empty"><h1>Article not found</h1><Link className="text-link" to="/blog/">Back to the journal <ArrowRight size={16} /></Link></section>
  return <article className="journal-article container">
    <Link className="text-link" to="/blog/"><ArrowLeft size={15} />Back to the journal</Link>
    <header className="article-heading"><Meta article={article} /><h1>{article.title}</h1><div className="journal-author"><img src="/images/shibly-noman-avatar.jpg" alt="" width={36} height={36} /><span>{profile.name}<small>{profile.role}</small></span></div></header>
    {article.slug === 'mvp-development-cost' && <aside className="article-calculator-link" aria-label="MVP budget tool"><Calculator size={23} /><div><strong>Plan your first-release budget</strong><p>Organize your scope, supplied estimates, and running costs.</p></div><Link className="text-link" to="/tools/mvp-cost-calculator/">Open calculator <ArrowUpRight size={16} /></Link></aside>}<ArticleArt kind={article.kind} />
    <div className="article-reading-layout">
      <div className="journal-article-body"><Markdown text={article.body} /></div>
      <aside className="article-contact-rail" aria-label="Discuss your project">
        <ArticleContactCard />
      </aside>
    </div>
    <RelatedBlogs key={article.slug} currentSlug={article.slug} />
  </article>
}


