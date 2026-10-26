'use client'
// Ported from the existing site; approved copy is unchanged.
import { useRef, useId, useState, useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from './runtime'
import { Button } from './components/ui/button'
import { ArticleArt } from './components/article-art'
import { Meta } from './article-meta'
import type { ArticleSummary } from './types'
export function RelatedBlogs({ currentSlug, articles }: { currentSlug: string; articles: ArticleSummary[] }) {
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
      <div><p className="eyebrow">More from the journal</p><div className="related-blogs-title" id={`${id}-heading`}>Blogs you might need to read</div></div>
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
          <div className="journal-card-copy"><Meta article={item} /><div className="related-blog-title">{item.title}</div><p>{item.excerpt}</p><span className="journal-read">Read article <ArrowUpRight size={16} /></span></div>
        </Link>
      </article>)}
    </div>
    <div className="related-blogs-footer"><Link className="text-link" to="/blog/">View all blogs <ArrowUpRight size={15} /></Link><Button asChild><Link to="/contact/">Discuss your project <ArrowUpRight size={16} /></Link></Button></div>
  </aside>
}

