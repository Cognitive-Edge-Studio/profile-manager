import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const base = new URL(process.env.SITE_TEST_BASE_URL || 'http://127.0.0.1:3000')
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname), 'Website checks are restricted to local previews')
const posts = JSON.parse(await readFile(new URL('../src/content/blog.json', import.meta.url), 'utf8'))
const inventory = JSON.parse(await readFile(new URL('../migration/source-inventory.json', import.meta.url), 'utf8'))
for (const asset of inventory.assets) {
  const bytes = await readFile(new URL(`../${asset.path}`, import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `Preserve copied asset ${asset.path}`)
}
const pages = [
  ['/', 'Freelance Full-Stack Developer | Shibly Mohammad Noman', "I'm a freelance", 'Work directly with Shibly, a freelance full-stack developer, to build web applications, integrate AI, or improve existing software.'],
  ['/about/', 'About Shibly Mohammad Noman | Software Engineer', "Hi, I'm", 'Meet Shibly Mohammad Noman, an independent software engineer based in Bangladesh building applications and AI systems.'],
  ['/contact/', 'Contact Shibly Mohammad Noman | Software Engineer', 'Contact', 'Discuss a new idea, an existing application, or a problem your team wants to solve with Shibly Mohammad Noman.'],
  ['/blog/', 'Blog | Shibly Noman — Software & MVP Guides', 'Blog', 'Practical guides from Shibly Noman on hiring a developer, planning an MVP, prioritizing features, and understanding development costs.'],
  ['/tools/mvp-cost-calculator/', 'MVP Cost Calculator | First-Release Budget | Shibly Noman', 'MVP cost calculator', 'Plan your first MVP, compare build costs, and add running costs using your own figures. See what’s included and what you still need to check.'],
  ...posts.map(post => [`/blog/${post.slug}/`, post.metaTitle, post.title, post.metaDescription]),
]
const decode = value => value.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const semantic = value => decode(value).normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase()
const visibleHTML = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
function contentDiv(html, className) {
  const start = html.indexOf(`<div class="${className}">`)
  assert.ok(start >= 0, `Missing server-rendered ${className}`)
  const tags = /<div\b[^>]*>|<\/div>/g
  tags.lastIndex = start
  let depth = 0
  for (let match; (match = tags.exec(html));) {
    depth += match[0].startsWith('</') ? -1 : 1
    if (depth === 0) return html.slice(start, tags.lastIndex)
  }
  throw new Error(`Unbalanced ${className}`)
}
function manuscriptWords(markdown) {
  return semantic(markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split('\n')
    .filter(line => !/^\|[\s:|\-]+\|$/.test(line) && !/^---+$/.test(line))
    .map(line => line.replace(/^(?:#{1,4}\s+|>\s?|[-*]\s+|\d+\.\s+)/, ''))
    .join('\n').replace(/\*|`/g, ''))
}

const evidence = []
for (const [path, title, heading, description] of pages) {
  const started = performance.now()
  const response = await fetch(new URL(path, base))
  assert.equal(response.status, 200, path)
  assert.equal(new URL(response.url).pathname, path, `Preserve the existing ${path} address`)
  const html = await response.text()
  const document = visibleHTML(html)
  const head = document.slice(0, document.indexOf('</head>'))
  assert.ok(head.includes(`<title>${title.replaceAll('&', '&amp;')}</title>`), `${path}: title must be in the initial head`)
  const descriptionTag = head.match(/<meta name="description" content="([^"]*)"/)
  assert.equal(decode(descriptionTag?.[1] || ''), description, `${path}: preserve the approved description`)
  const h1 = document.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)
  assert.ok(semantic(h1?.[1].replace(/<[^>]*>/g, ' ') || '').includes(semantic(heading)), `${path}: readable initial H1`)
  assert.ok(document.includes('id="main-content"'))
  assert.ok(document.includes('class="site-header container"'))
  assert.ok(document.includes('class="site-footer container"'))
  if (path === '/' || path === '/contact/') {
    assert.ok(document.includes('method="post"'), 'A native no-JavaScript submission must not put contact details in a URL')
    assert.ok(document.includes('This form needs JavaScript'), 'Offer a direct email fallback without JavaScript')
  }
  if (path.startsWith('/blog/') && path !== '/blog/') {
    const post = posts.find(post => path === `/blog/${post.slug}/`)
    const body = contentDiv(document, 'journal-article-body')
    assert.equal(semantic(body.replace(/<[^>]*>/g, ' ')), manuscriptWords(post.body), `${path}: preserve every visible manuscript word and its order`)
    if (post.body.includes('\n|')) assert.ok(body.includes('<table>'), `${path}: retain tables`)
  }
  if (path.startsWith('/tools/')) {
    assert.ok(document.includes('calc-print'), 'Keep the printable calculator report')
    assert.ok(document.includes('Still to check'), 'Initial unanswered costs remain unresolved')
  }
  evidence.push({ path, status: response.status, htmlBytes: Buffer.byteLength(html), responseMs: Math.round(performance.now() - started) })
}
for (const path of ['/missing-page/', '/blog/missing-article/']) {
  assert.equal((await fetch(new URL(path, base))).status, 404, `${path}: real HTTP not found`)
}
const filtered = visibleHTML(await (await fetch(new URL('/blog/?q=zzzznomatches', base))).text())
assert.ok(filtered.includes('No articles found'), 'Search results must be rendered on a direct visit')
const topic = visibleHTML(await (await fetch(new URL('/blog/?topic=Hiring+a+developer', base))).text())
assert.ok(topic.includes('1 article'), 'Direct topic links preserve their filter')
const image = await fetch(new URL('/_next/image?url=%2Fimages%2Fshibly-noman-full-stack-developer.jpg&w=640&q=75', base), { headers: { Accept: 'image/webp' } })
assert.equal(image.status, 200, 'Responsive portrait optimization')
assert.ok(image.headers.get('content-type')?.startsWith('image/'))
assert.ok(image.headers.get('content-type')?.includes('webp'))
// Only inspect client bundles if a production build is available. Manuscripts
// belong in route HTML/RSC payloads, not in every browser JavaScript bundle.
try {
  const chunkRoot = resolve('.next/static/chunks')
  const files = await readdir(chunkRoot, { recursive: true })
  const chunks = await Promise.all(files.filter(file => file.endsWith('.js')).map(file => readFile(resolve(chunkRoot, file), 'utf8')))
  assert.ok(!chunks.some(chunk => chunk.includes('In its 2026 guide, EnactOn')), 'Do not bundle full manuscripts into public client JavaScript')
} catch (error) { if (error.code !== 'ENOENT') throw error }
console.log('Website checks passed: ten existing routes, initial HTML/metadata, complete article words/tables, filter URLs, real 404s, responsive portrait, and manuscript bundle isolation.')
const report = { mode: 'Local HTTP diagnostics; these are not real-user Core Web Vitals.', copiedAssets: inventory.assets.length, routes: evidence }
await writeFile(new URL(process.env.CONTENT_FIXTURE_TEST === 'true' ? '../docs/slice4-http-parity.json' : '../docs/slice3-http-checks.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
