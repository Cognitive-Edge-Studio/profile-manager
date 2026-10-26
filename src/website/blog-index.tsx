'use client'
// Ported from the existing site; approved copy is unchanged.
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Calculator, Check, Clock3, Search, X } from 'lucide-react'
import { Link, Reveal as Enter, useWebsiteRuntime } from './runtime'
import { Button } from './components/ui/button'
import { ArticleArt } from './components/article-art'
import { Meta } from './article-meta'
import type { ArticleSummary, Profile } from './types'
const topics = ['All articles', 'Planning an MVP', 'Hiring a developer']
export function Blog({ articles, profile, contactTitle, contactBody, heading, eyebrow, introduction, contactActions, avatar, preview }: { articles: ArticleSummary[]; profile: Profile; contactTitle: string; contactBody: React.ReactNode; heading: string; eyebrow?: string; introduction?: React.ReactNode; contactActions?: React.ReactNode; avatar?: string; preview?: boolean }) {
  const params = useSearchParams()
  const { routeMap } = useWebsiteRuntime()
  function setParams(next: URLSearchParams | Record<string, string>, _options?: unknown) {
    const updated = new URLSearchParams(next)
    const preview = routeMap['/blog']
    if (preview) { const fixed = new URLSearchParams(preview.split('?')[1]); fixed.forEach((value, key) => updated.set(key, value)) }
    const query = updated.toString()
    window.history.replaceState(null, '', (routeMap['/blog'] ? '/preview' : '/blog/') + (query ? '?' + query : ''))
  }
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
  const featured = articles.find(article => article.kind === 'build') || articles[0]
  const browsing = Boolean(query || topic !== topics[0])
  return <div className="journal-page">
    <section className="journal-intro container">
      <p className="breadcrumb"><Link to="/">Home</Link><span>/</span>Blog</p>
      <Enter className="journal-intro-grid"><div><p className="eyebrow"><span className="journal-dash" />{eyebrow}</p><h1>{heading}</h1>{introduction}</div><div className="journal-intro-aside"><Link to="/about/" className="journal-author">{avatar && <Image unoptimized={preview} sizes="36px" src={avatar} alt="" width={36} height={36} />}<span>{profile.name}<small>{profile.role}</small></span><ArrowUpRight size={16} /></Link></div></Enter>
    </section>
    {!browsing && featured && <section className="container journal-feature" aria-labelledby="featured-heading"><Enter><Link to={`/blog/${featured.slug}/`} className="featured-link"><div className="featured-copy"><p className="eyebrow"><BookOpen size={14} />Start here · Featured guide</p><h2 id="featured-heading">{featured.title}</h2><p>{featured.excerpt}</p><Meta article={featured} /><span className="featured-action">Read the guide <ArrowUpRight size={17} /></span></div><ArticleArt kind={featured.kind} image={featured.image} featured /></Link></Enter></section>}
    <section className="container journal-library" aria-labelledby="articles-heading">
      <div className="journal-library-heading"><div><p className="eyebrow">Blog</p><h2 id="articles-heading">Articles<span className="article-count">{articles.length.toString().padStart(2, '0')}</span></h2></div></div>
      <div className="journal-controls"><div className="journal-filters" role="group" aria-label="Filter articles by topic">{topics.map(item => <button key={item} aria-pressed={topic === item} className={topic === item ? 'selected' : ''} onClick={() => update('topic', item)}>{item}</button>)}</div><form role="search" className="journal-search" onSubmit={event => { event.preventDefault(); update('q', search.trim()) }}><Search size={16} /><input aria-label="Search articles" placeholder="Search articles…" value={search} onChange={event => { setSearch(event.target.value); update('q', event.target.value) }} />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); update('q', '') }}><X size={14} /></button>}</form></div>
      <p className="journal-result-count" role="status">{browsing ? `${visible.length} ${visible.length === 1 ? 'article' : 'articles'}${query ? ` matching “${query}”` : ''}` : `${articles.length} articles`}</p>
      {visible.length ? <div className="journal-cards">{visible.map(article => <Enter key={article.slug}><article className="journal-card"><Link to={`/blog/${article.slug}/`} className="journal-card-link"><ArticleArt kind={article.kind} image={article.image} /><div className="journal-card-copy"><Meta article={article} /><h3>{article.title}</h3><p>{article.excerpt}</p><span className="journal-read">Read article <ArrowUpRight size={16} /></span></div></Link></article></Enter>)}</div> : <div className="journal-empty"><Search size={25} /><h3>No articles found</h3><p>Try a different phrase or browse all the guides.</p><Button variant="outline" onClick={() => { setSearch(''); setParams({}) }}>Show all articles <ArrowRight size={15} /></Button></div>}
    </section>
    <section className="container journal-contact"><Enter><div><h2>{contactTitle}</h2><p>{contactBody}</p></div>{contactActions}</Enter></section>
  </div>
}



