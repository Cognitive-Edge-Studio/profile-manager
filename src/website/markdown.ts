import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { marked, type Token, type Tokens } from 'marked'
import { parse } from 'yaml'
import { validateDestination } from '../domain/contracts.mjs'

type Node = { type: string; [key: string]: unknown }
type Image = { id: string; url: string; alt: string }
const text = (value: string, format = 0): Node => ({ type: 'text', text: value, format })
const root = (children: Node[]) => ({ root: { type: 'root', children } })
const styles = { strong: 1, em: 2, del: 4 } as const

function localImage(value: unknown) {
  if (typeof value !== 'string' || !/^\/images\/(?:[\w-]+\/)*[\w.-]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(value)) {
    throw new Error('Article images must use a local /images/ path.')
  }
  return value
}

function inline(tokens: Token[] | undefined, images: Map<string, Image>, format = 0): Node[] {
  return (tokens || []).flatMap(token => {
    switch (token.type) {
      case 'strong': case 'em': case 'del':
        return inline(token.tokens, images, format | styles[token.type as keyof typeof styles])
      case 'codespan': return [text(token.text, format | 16)]
      case 'br': return [{ type: 'linebreak' }]
      case 'link':
        if (validateDestination(token.href, { contact: true }) !== true) throw new Error(`Invalid article link: ${token.href}`)
        return [{ type: 'link', fields: { url: token.href }, children: inline(token.tokens, images, format) }]
      case 'image': {
        const url = localImage(token.href)
        images.set(url, { id: url, url, alt: token.text })
        return [{ type: 'upload', value: url, alt: token.text }]
      }
      case 'escape': return [text(token.text, format)]
      case 'text':
        return 'tokens' in token && token.tokens ? inline(token.tokens, images, format) : [text(token.text, format)]
      default: throw new Error(`Unsupported inline Markdown: ${token.type}. Use Markdown formatting without raw HTML.`)
    }
  })
}

function blocks(tokens: Token[] | undefined, images: Map<string, Image>): Node[] {
  return (tokens || []).flatMap(token => {
    switch (token.type) {
      case 'space': case 'def': return []
      case 'heading':
        if (token.depth < 2 || token.depth > 4) throw new Error('Use ## through #### for headings. The title supplies the page H1.')
        return [{ type: 'heading', tag: 'h' + token.depth, children: inline(token.tokens, images) }]
      case 'paragraph': case 'text': {
        const children = 'tokens' in token && token.tokens ? inline(token.tokens, images) : [text(token.text)]
        if (children.some(child => child.type === 'upload')) {
          if (children.length !== 1) throw new Error('Place each article image in its own paragraph.')
          return children
        }
        return [{ type: 'paragraph', children }]
      }
      case 'blockquote': return [{ type: 'quote', children: blocks(token.tokens, images) }]
      case 'hr': return [{ type: 'horizontalrule' }]
      case 'code': return [{ type: 'code', text: token.text }]
      case 'list': return [{
        type: 'list',
        listType: token.ordered ? 'number' : 'bullet',
        start: token.start,
        children: (token.items as Tokens.ListItem[]).map(item => ({ type: 'listitem', children: blocks(item.tokens, images) })),
      }]
      case 'table': {
        const table = token as Tokens.Table
        return [{
          type: 'table',
          children: [table.header, ...table.rows].map((row, index) => ({
            type: 'tablerow',
            children: row.map(cell => ({
              type: 'tablecell',
              headerState: index === 0 ? 1 : 0,
              children: [{ type: 'paragraph', children: inline(cell.tokens, images) }],
            })),
          })),
        }]
      }
      default: throw new Error(`Unsupported Markdown block: ${token.type}. Use Markdown formatting without raw HTML.`)
    }
  })
}

export function markdownToRichText(source: string, images = new Map<string, Image>()) {
  return root(blocks(marked.lexer(source, { gfm: true }), images))
}

export async function readMarkdownPost(directory: string, file: string) {
  const input = await readFile(join(directory, file), 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(input)
  if (!match) throw new Error(`${file}: expected YAML front matter between --- lines.`)
  try {
    const meta = parse(match[1], { maxAliasCount: 0 })
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error('Expected front matter keys.')
    if (meta.draft === true) return null
    if (meta.draft !== undefined && meta.draft !== false) throw new Error('draft must be true or false.')
    for (const name of ['title', 'description', 'category', 'date']) {
      if (typeof meta[name] !== 'string' || !meta[name].trim()) throw new Error(`Set ${name} in front matter.`)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error('Use YYYY-MM-DD for date.')
    const date = new Date(meta.date + 'T00:00:00Z')
    if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== meta.date) throw new Error('Enter a valid date.')
    if (!match[2].trim()) throw new Error('Add the article body.')
    const images = new Map<string, Image>()
    const heroImage = meta.image === undefined ? undefined : localImage(meta.image)
    if (heroImage) {
      if (typeof meta.imageAlt !== 'string' || !meta.imageAlt.trim()) throw new Error('Set imageAlt for the article image.')
      images.set(heroImage, { id: heroImage, url: heroImage, alt: meta.imageAlt })
    }
    const body = markdownToRichText(match[2], images)
    await Promise.all([...images.keys()].map(url => access(join(process.cwd(), 'public', url.slice(1)))))
    const slug = file.slice(0, -3)
    const post = {
      id: slug, slug, title: meta.title, excerpt: meta.description, category: meta.category,
      publishedAt: date.toISOString(), heroImage, body,
      meta: { title: meta.title, description: meta.description, image: heroImage },
    }
    return { post, images: [...images.values()] }
  } catch (error) {
    throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
