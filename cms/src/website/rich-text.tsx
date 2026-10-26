import { Fragment, type ReactNode } from 'react'
import Image from 'next/image'
import { Link } from './runtime'
import { mediaFor, nodesOf, resolvedLink, textOf, type SiteData } from './content'
import { headingAnchors } from '../domain/seo.mjs'

export function CMSImage({ site, value, alt, className, sizes = '100vw' }: { site: SiteData; value: any; alt?: string; className?: string; sizes?: string }) {
  const media = mediaFor(site, value)
  if (!media?.url) return null
  const image = <Image className={className} src={media.url} unoptimized={site.preview} alt={media.decorative ? '' : alt ?? media.alt ?? ''} width={media.width || 800} height={media.height || 600} sizes={sizes} />
  return media.caption && alt !== '' ? <figure className="cms-image">{image}<figcaption>{media.caption}</figcaption></figure> : image
}
export function Action({ site, value, className, children }: { site: SiteData; value: any; className?: string; children?: ReactNode }) {
  const link = resolvedLink(site, value)
  return link ? <Link to={link.href} target={link.target} rel={link.rel} className={className}>{children || link.label}</Link> : null
}
export function RichText({ data, site, className, inline = false, anchors = false }: { data: any; site: SiteData; className?: string; inline?: boolean; anchors?: boolean }) {
  const headingIDs = anchors ? headingAnchors(data) : []
  let headingIndex = 0
  function render(node: any, i: number): ReactNode {
    const children = node.children?.map(render)
    if (node.type === 'text') {
      let text: ReactNode = node.text
      const f = Number(node.format || 0)
      if (f & 1) text = <strong>{text}</strong>
      if (f & 2) text = <em>{text}</em>
      if (f & 4) text = <s>{text}</s>
      if (f & 8) text = <u>{text}</u>
      if (f & 16) text = <code>{text}</code>
      if (f & 32) text = <sub>{text}</sub>
      if (f & 64) text = <sup>{text}</sup>
      return <Fragment key={i}>{text}</Fragment>
    }
    if (node.type === 'link' || node.type === 'autolink') {
      const link = resolvedLink(site, node.fields || { url: node.url })
      return link ? <Link key={i} to={link.href} target={link.target} rel={link.rel}>{children}</Link> : <Fragment key={i}>{children}</Fragment>
    }
    if (node.type === 'linebreak') return <br key={i} />
    if (node.type === 'paragraph') return inline ? <Fragment key={i}>{children}</Fragment> : <p key={i}>{children}</p>
    if (node.type === 'heading') { const Tag = ['h2', 'h3', 'h4'].includes(node.tag) ? node.tag as 'h2' | 'h3' | 'h4' : 'h2'; return <Tag key={i} id={anchors ? headingIDs[headingIndex++] : undefined} tabIndex={anchors ? -1 : undefined}>{children}</Tag> }
    if (node.type === 'list') return node.listType === 'number' ? <ol key={i} start={node.start || 1}>{children}</ol> : <ul key={i}>{children}</ul>
    if (node.type === 'listitem') return <li key={i}>{children}</li>
    if (node.type === 'quote') return <blockquote key={i}>{children}</blockquote>
    if (node.type === 'horizontalrule') return <hr key={i} />
    if (node.type === 'tab') return <Fragment key={i}>{'\t'}</Fragment>
    if (node.type === 'table') {
      const rows = node.children || []
      const header = rows[0]?.children?.some((cell: any) => Number(cell.headerState) & 1)
      const cells = rows[0]?.children || []
      const pricing = textOf(cells[1]) === 'Published hourly rate', estimate = textOf(cells[0]) === 'Part of the Estimate'
      return <div key={i} className={`article-table${pricing ? ' pricing-table' : ''}${estimate ? ' estimate-table' : ''}`}><table>{(pricing || estimate) && <colgroup>{cells.map((_: any, n: number) => <col key={n} />)}</colgroup>}{header && <thead>{render(rows[0], 0)}</thead>}<tbody>{rows.slice(header ? 1 : 0).map(render)}</tbody></table></div>
    }
    if (node.type === 'tablerow') return <tr key={i}>{children}</tr>
    if (node.type === 'tablecell') { const Tag = Number(node.headerState) ? 'th' : 'td'; return <Tag key={i} colSpan={node.colSpan > 1 ? node.colSpan : undefined} rowSpan={node.rowSpan > 1 ? node.rowSpan : undefined}>{children}</Tag> }
    if (node.type === 'upload') return <CMSImage key={i} site={site} value={node.value} />
    return <Fragment key={i}>{children}</Fragment>
  }
  const content = nodesOf(data).map(render)
  return className ? <div className={className}>{content}</div> : <>{content}</>
}
