import { Fragment, type ReactNode } from 'react'
import { ArrowDown, List } from 'lucide-react'
import Image from 'next/image'
import { Link } from './runtime'
import { mediaFor, nodesOf, resolvedLink, textOf, type SiteData } from './content'
import { headingAnchors } from '../domain/seo.mjs'

// Enhance only the paired template shortcuts, leaving other article prose intact.
function templateLinkGroup(node: any, label: string) {
  if (node?.type !== 'paragraph' || textOf(node.children?.[0]).trim() !== label) return null
  const links = node.children.filter((child: any) => child.type === 'link')
  if (links.length !== 2 || links.some((link: any) => !link.fields?.url?.startsWith('#heading-'))) return null
  if (node.children.slice(1).some((child: any) => child.type !== 'link' && (child.type !== 'text' || !/^[\s·]*$/.test(child.text)))) return null
  return links
}

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
export function RichText({ data, site, className, inline = false, anchors = false, nofollowExternal = false }: { data: any; site: SiteData; className?: string; inline?: boolean; anchors?: boolean; nofollowExternal?: boolean }) {
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
      const link = resolvedLink(site, node.fields || { url: node.url }, { nofollowExternal })
      return link ? <Link key={i} to={link.href} target={link.target} rel={link.rel}>{children}</Link> : <Fragment key={i}>{children}</Fragment>
    }
    if (node.type === 'linebreak') return <br key={i} />
    if (node.type === 'paragraph') return inline ? <Fragment key={i}>{children}</Fragment> : <p key={i}>{children}</p>
    if (node.type === 'heading') { const Tag = ['h2', 'h3', 'h4'].includes(node.tag) ? node.tag as 'h2' | 'h3' | 'h4' : 'h2'; return <Tag key={i} id={anchors ? headingIDs[headingIndex++] : undefined} tabIndex={anchors ? -1 : undefined}>{children}</Tag> }
    if (node.type === 'list') return node.listType === 'number' ? <ol key={i} start={node.start || 1}>{children}</ol> : <ul key={i}>{children}</ul>
    if (node.type === 'listitem') return <li key={i}>{children}</li>
    if (node.type === 'quote') {
      const first = node.children?.[0]
      if (anchors && first?.type === 'text' && /^at a glance$/i.test(first.text.trim())) {
        const summary = node.children.slice(1).map((part: any, index: number) => index === 0 && part.type === 'text' ? { ...part, text: part.text.replace(/^\s*>\s*/, '') } : part)
        return <blockquote key={i}><strong>{first.text}</strong><p>{summary.map(render)}</p></blockquote>
      }
      return <blockquote key={i}>{children}</blockquote>
    }
    if (node.type === 'horizontalrule') return <hr key={i} />
    if (node.type === 'tab') return <Fragment key={i}>{'\t'}</Fragment>
    if (node.type === 'table') {
      const rows = node.children || []
      const header = rows[0]?.children?.some((cell: any) => Number(cell.headerState) & 1)
      const cells = rows[0]?.children || []
      const pricing = textOf(cells[1]) === 'Published hourly rate', estimate = textOf(cells[0]) === 'Part of the Estimate'
      return <div key={i} className={`article-table${pricing ? ' pricing-table' : ''}${estimate ? ' estimate-table' : ''}`} tabIndex={anchors ? 0 : undefined} role={anchors ? 'region' : undefined} aria-label={anchors ? 'Article table; scroll horizontally to see all columns' : undefined}><table>{(pricing || estimate) && <colgroup>{cells.map((_: any, n: number) => <col key={n} />)}</colgroup>}{header && <thead>{render(rows[0], 0)}</thead>}<tbody>{rows.slice(header ? 1 : 0).map(render)}</tbody></table></div>
    }
    if (node.type === 'tablerow') return <tr key={i}>{children}</tr>
    if (node.type === 'tablecell') { const Tag = Number(node.headerState) ? 'th' : 'td'; return <Tag key={i} colSpan={node.colSpan > 1 ? node.colSpan : undefined} rowSpan={node.rowSpan > 1 ? node.rowSpan : undefined}>{children}</Tag> }
    if (node.type === 'upload') return <CMSImage key={i} site={site} value={node.value} />
    return <Fragment key={i}>{children}</Fragment>
  }
  const nodes = nodesOf(data)
  const navigationIndex = anchors ? nodes.findIndex((node, i) => templateLinkGroup(node, 'Client templates:') && templateLinkGroup(nodes[i + 1], 'Provider templates:')) : -1
  const content = nodes.map((node, i) => {
    if (navigationIndex >= 0 && i === navigationIndex + 1) return null
    if (i !== navigationIndex) return render(node, i)
    const groups = [
      { title: 'Client briefs', description: 'Send your project requirements', links: templateLinkGroup(node, 'Client templates:')! },
      { title: 'Provider proposals', description: 'Respond with your proposed work', links: templateLinkGroup(nodes[i + 1], 'Provider templates:')! },
    ]
    return <nav key={i} className="article-template-nav" aria-label="Jump to a template">
      <div className="article-template-nav__title"><List size={19} aria-hidden="true" /><span>Jump to a template</span></div>
      <div className="article-template-nav__groups">{groups.map(group => <div key={group.title} className="article-template-nav__group">
        <p className="article-template-nav__label">{group.title}</p>
        <p className="article-template-nav__description">{group.description}</p>
        <ul>{group.links.map((linkNode: any, index: number) => {
          const link = resolvedLink(site, linkNode.fields)
          return link ? <li key={index}><Link to={link.href}><span>{textOf(linkNode)}</span><ArrowDown size={16} aria-hidden="true" /></Link></li> : null
        })}</ul>
      </div>)}</div>
    </nav>
  })
  return className ? <div className={className}>{content}</div> : <>{content}</>
}
