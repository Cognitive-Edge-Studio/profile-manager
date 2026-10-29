'use client'
// Ported from the existing site; approved copy is unchanged.
import { useRef, useId, useState, useEffect, useCallback, type PointerEvent } from 'react'
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
  const [carousel, setCarousel] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; left: number; active: boolean } | null>(null)
  const suppressClick = useRef(false)

  const finishDrag = useCallback((event?: { pointerId?: number }) => {
    const element = track.current, ended = drag.current
    if (!element || !ended || (event?.pointerId !== undefined && event.pointerId !== ended.id)) return
    drag.current = null
    element.classList.remove('is-dragging')
    if (element.hasPointerCapture(ended.id)) element.releasePointerCapture(ended.id)
    if (ended.active && element.firstElementChild) {
      const step = (element.firstElementChild as HTMLElement).offsetWidth + parseFloat(getComputedStyle(element).gap)
      element.scrollTo({ left: Math.round(element.scrollLeft / step) * step, behavior: reduced ? 'instant' : 'smooth' })
    }
  }, [reduced])

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
    const query = window.matchMedia('(max-width: 800px)')
    const updateLayout = () => { finishDrag(); setCarousel(query.matches); updateControls() }
    updateLayout()
    query.addEventListener('change', updateLayout)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('blur', updateLayout)
    const observer = new ResizeObserver(updateControls)
    observer.observe(element)
    return () => {
      observer.disconnect()
      query.removeEventListener('change', updateLayout)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('blur', updateLayout)
    }
  }, [finishDrag])

  function slide(direction: number) {
    const element = track.current
    const card = element?.firstElementChild as HTMLElement | null
    if (!element || !card) return
    element.scrollBy({ left: direction * (card.offsetWidth + parseFloat(getComputedStyle(element).gap)), behavior: reduced ? 'instant' : 'smooth' })
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const element = event.currentTarget
    if (!carousel || event.pointerType !== 'mouse' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || element.scrollWidth <= element.clientWidth + 1) return
    suppressClick.current = false
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: element.scrollLeft, active: false }
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    const distance = event.clientX - current.x
    if (!current.active) {
      if (Math.abs(distance) < 6) return
      if (Math.abs(event.clientY - current.y) > Math.abs(distance)) { drag.current = null; return }
      current.active = true
      suppressClick.current = true
      event.currentTarget.classList.add('is-dragging')
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    event.currentTarget.scrollLeft = current.left - distance
  }

  if (!related.length) return null
  return <aside className="related-blogs" aria-labelledby={`${id}-heading`}>
    <div className="related-blogs-heading">
      <div><p className="eyebrow">More from the journal</p><div className="related-blogs-title" id={`${id}-heading`}>Blogs you might need to read</div></div>
      {carousel && (canPrevious || canNext) && <div className="related-blogs-controls" aria-label="Browse related blogs">
        <button type="button" aria-label="Previous blogs" aria-controls={`${id}-track`} disabled={!canPrevious} onClick={() => slide(-1)}><ArrowLeft size={17} /></button>
        <button type="button" aria-label="Next blogs" aria-controls={`${id}-track`} disabled={!canNext} onClick={() => slide(1)}><ArrowRight size={17} /></button>
      </div>}
    </div>
    <div className="related-blogs-track" id={`${id}-track`} ref={track} onScroll={updateControls} tabIndex={carousel ? 0 : undefined} role={carousel ? 'region' : undefined} aria-roledescription={carousel ? 'carousel' : undefined} aria-label={carousel ? 'Related blog articles' : undefined}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
      onDragStart={event => { if (drag.current) event.preventDefault() }}
      onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}
      onKeyDown={event => {
      if (event.target !== event.currentTarget || !carousel) return
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
    <div className="related-blogs-footer"><Button asChild variant="outline"><Link to="/blog/">View all blogs <ArrowRight size={18} /></Link></Button></div>
  </aside>
}

