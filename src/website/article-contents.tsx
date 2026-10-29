'use client'

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { ChevronDown, List } from 'lucide-react'

type Entry = { id: string; title: string; children: Entry[] }

export function ArticleContents({ entries }: { entries: Entry[] }) {
  const id = useId()
  const [enhanced, setEnhanced] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const links = useRef<HTMLOListElement>(null)

  useEffect(() => {
    setEnhanced(true)
    const headings = entries.flatMap(entry => [entry, ...entry.children]).map(entry => document.getElementById(entry.id)).filter((heading): heading is HTMLElement => Boolean(heading))
    let frame = 0
    function update() {
      frame = 0
      let current = headings[0]?.id || ''
      const margin = headings[0] ? parseFloat(getComputedStyle(headings[0]).scrollMarginTop) || 0 : 0
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const threshold = Math.max(96, margin + padding + 2)
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > threshold) break
        current = heading.id
      }
      setActive(current)
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [entries])

  useEffect(() => {
    const list = links.current
    if (!list) return
    function revealCurrent() {
      const current = list!.querySelector<HTMLAnchorElement>('a[aria-current="location"]')
      if (!current || !list!.clientHeight) return
      const panel = list!.getBoundingClientRect(), item = current.getBoundingClientRect()
      const inset = 8
      const delta = item.top < panel.top + inset ? item.top - panel.top - inset
        : item.bottom > panel.bottom - inset ? item.bottom - panel.bottom + inset : 0
      // Scroll only this list. scrollIntoView would also move the article and
      // the sticky rail, interrupting the reader's position.
      if (delta) list!.scrollTo({ top: list!.scrollTop + delta, behavior: 'instant' })
    }
    revealCurrent()
    const observer = new ResizeObserver(revealCurrent)
    observer.observe(list)
    return () => observer.disconnect()
  }, [active, open, enhanced])

  function jump(event: MouseEvent<HTMLAnchorElement>, targetID: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const heading = document.getElementById(targetID)
    if (!heading) return
    event.preventDefault()
    setOpen(false)
    requestAnimationFrame(() => {
      window.history.pushState(null, '', `#${targetID}`)
      heading.focus({ preventScroll: true })
      heading.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      setActive(targetID)
    })
  }

  if (!entries.length) return null
  return <nav className="article-toc" aria-labelledby={`${id}-title`} data-enhanced={enhanced} data-open={open} onKeyDown={event => {
    if (event.key === 'Escape') { setOpen(false); event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus() }
  }}>
    <div className="article-toc__header">
      <div className="article-toc__title" id={`${id}-title`}><List size={18} aria-hidden="true" />Table of contents</div>
      <button className="article-toc__toggle" type="button" aria-controls={`${id}-links`} aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} table of contents`} onClick={() => setOpen(value => !value)}>
        {open ? 'Hide' : 'Show'}<ChevronDown size={16} aria-hidden="true" />
      </button>
    </div>
    <ol ref={links} id={`${id}-links`} className="article-toc__links">
      {entries.map((entry, index) => <li key={entry.id}><a href={`#${entry.id}`} aria-current={active === entry.id ? 'location' : undefined} onClick={event => jump(event, entry.id)}>
        <span className="article-toc__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{entry.title}</span>
      </a>{entry.children.length > 0 && <ol>{entry.children.map(child => <li key={child.id}><a href={`#${child.id}`} aria-current={active === child.id ? 'location' : undefined} onClick={event => jump(event, child.id)}><span>{child.title}</span></a></li>)}</ol>}</li>)}
    </ol>
  </nav>
}
