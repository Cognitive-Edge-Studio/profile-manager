'use client'

import { useEffect, useRef } from 'react'

export function ArticleReadingProgress() {
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const body = document.getElementById('article-content')
    if (!body) return
    let frame = 0
    function update() {
      frame = 0
      const bounds = body!.getBoundingClientRect()
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')) || 96
      const threshold = header + 24
      const distance = Math.max(1, bounds.height - innerHeight + threshold)
      if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0, Math.min(1, (threshold - bounds.top) / distance))})`
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
  return <div className="article-reading-progress" aria-hidden="true"><span ref={bar} /></div>
}
