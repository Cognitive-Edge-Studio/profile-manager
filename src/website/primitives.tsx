// Ported from the existing site; approved copy is unchanged.
import { Fragment, type ReactNode } from 'react'
import { Reveal } from './runtime'
const paragraphs = (text: string) => text.trim().split(/\n\s*\n/).filter(Boolean)
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/g)
  return <>{parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    return link ? <a key={i} href={link[2]}>{link[1]}</a> : <Fragment key={i}>{part}</Fragment>
  })}</>
}

export function Copy({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`prose ${className}`}>{paragraphs(text).map((block, i) => block.startsWith('- ') ? <ul key={i}>{block.split('\n').map(line => <li key={line}><Inline text={line.replace(/^- /, '')} /></li>)}</ul> : <p key={i}><Inline text={block} /></p>)}</div>
}

export function Eyebrow({ children, number }: { children: ReactNode; number?: string }) { return <p className="eyebrow">{number && <span className="section-number">{number}</span>}{children}</p> }

export function SectionTitle({ title, eyebrow, number, description }: { title: string; eyebrow: string; number?: string; description?: ReactNode }) { return <Reveal className="section-heading"><div><Eyebrow number={number}>{eyebrow}</Eyebrow><h2>{title}</h2></div>{description && <p className="section-description">{description}</p>}</Reveal> }
