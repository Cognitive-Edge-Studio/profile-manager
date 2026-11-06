'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { MotionConfig, motion, useReducedMotion } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import type { Profile } from './types'

type Runtime = { profile: Profile; summary: string; setSummary: (value: string) => void }
const RuntimeContext = createContext<Runtime | null>(null)
// Page shells may remount during navigation. Keep the handoff in this browser
// module, like the calculator plan; a reload starts a fresh module and clears it.
let memorySummary = ''
// Only explicit page-link navigation resets scrolling. Browser history keeps
// its restoration behavior, and links with fragments keep their section target.
let pendingPageTop: string | null = null
export function WebsiteRuntime({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [summary, updateSummary] = useState(() => memorySummary)
  const setSummary = (value: string) => { memorySummary = value; updateSummary(value) }
  return <RuntimeContext.Provider value={{ profile, summary, setSummary }}><MotionConfig reducedMotion="user">{children}</MotionConfig></RuntimeContext.Provider>
}
export function useWebsiteRuntime() {
  const value = useContext(RuntimeContext)
  if (!value) throw new Error('Website components require WebsiteRuntime.')
  return value
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string; state?: { calculatorSummary: string } }
export function Link({ to, state, onClick, onNavigate, ...props }: LinkProps) {
  const { setSummary } = useWebsiteRuntime()
  const href = to
  return <NextLink {...props} href={href} scroll={href.includes('#') ? props.scroll : false} onNavigate={event => {
    let cancelled = false
    onNavigate?.({ preventDefault() { cancelled = true; event.preventDefault() } })
    if (cancelled) return
    const destination = new URL(href, window.location.href)
    pendingPageTop = destination.hash ? null : destination.pathname + destination.search
    // A link to the current page may not cause a React navigation commit.
    if (pendingPageTop === window.location.pathname + window.location.search) {
      pendingPageTop = null
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return
    if (to.split(/[?#]/)[0].replace(/\/$/, '') === '/contact') setSummary(state?.calculatorSummary?.slice(0, 7800) || '')
  }} />
}
export function NavLink({ to, className, ...props }: LinkProps) {
  const pathname = usePathname()
  const active = pathname.replace(/\/$/, '') === to.replace(/\/$/, '')
  return <Link {...props} to={to} className={`${className || ''}${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} />
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  // Keep initial HTML readable. Animate only once a client can observe entry.
  return <motion.div className={className} initial={false} whileInView={reduced ? undefined : { opacity: [0, 1], y: [16, 0] }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: .6, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>
}
export function BackToTop() {
  const reduced = useReducedMotion()
  return <button onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })}>Back to top <ArrowUp size={14} /></button>
}
export function AnchorEffects() {
  const pathname = usePathname()
  useEffect(() => {
    if (pendingPageTop === window.location.pathname + window.location.search && !window.location.hash) {
      pendingPageTop = null
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }
    if (!window.location.hash) return
    const frame = requestAnimationFrame(() => {
      const raw = window.location.hash.slice(1)
      let anchor = raw
      try { anchor = decodeURIComponent(raw) } catch { /* A malformed fragment should not break a page. */ }
      document.getElementById(anchor)?.scrollIntoView()
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname])
  return null
}
