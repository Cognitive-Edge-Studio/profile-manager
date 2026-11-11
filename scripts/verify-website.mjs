import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'
import { contentPath } from '../src/domain/contracts.mjs'

const output = 'out'
const directory = 'src/content/posts'
const site = JSON.parse(await readFile('src/content/site.json', 'utf8'))
const pages = [
  ...site.pages.map(page => ({ path: contentPath('pages', page), title: page.heading })),
  { path: '/services/ai-integration/', title: 'AI integration services' },
  { path: '/services/ai-workflow-automation/', title: 'AI Workflow Automation Services' },
  { path: '/services/ai-agent-development/', title: 'AI Agent Development Services', noindex: true },
]
const articles = []
for (const file of await readdir(directory)) {
  if (!/\.(json|md)$/.test(file)) continue
  const source = await readFile(join(directory, file), 'utf8')
  const slug = file.replace(/\.(json|md)$/, '')
  const post = file.endsWith('.json') ? JSON.parse(source) : parse(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source)[1], { maxAliasCount: 0 })
  const path = '/blog/' + slug + '/'
  if (post.draft === true) {
    await assert.rejects(access(join(output, path.slice(1), 'index.html')), { code: 'ENOENT' })
  } else articles.push({ path, title: post.title, article: true })
}
assert.ok(articles.length, 'Expected published articles')
await access(join(output, '404.html'))
for (const folder of ['admin', 'api', 'preview']) {
  await assert.rejects(access(join(output, folder)), { code: 'ENOENT' })
}
const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8')
const robots = await readFile(join(output, 'robots.txt'), 'utf8')
const decode = value => value.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const words = value => decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
let blog
for (const entry of [...pages, ...articles]) {
  const raw = await readFile(join(output, entry.path.slice(1), 'index.html'), 'utf8')
  const html = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)
  const headingText = words(heading?.[1] || '')
  const expectedHeading = words(entry.title)
  assert.ok(headingText === expectedHeading || (!entry.article && headingText.startsWith(expectedHeading + ' ')), entry.path + ' heading')
  assert.match(html, /<title>[^<]+<\/title>/)
  assert.match(html, /<meta name="description" content="[^"]+"/)
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1]
  assert.ok(canonical, entry.path + ' canonical')
  const robotsMeta = /<meta name="robots" content="([^"]+)"/.exec(html)?.[1] || ''
  if (entry.noindex) {
    assert.ok(robotsMeta.includes('noindex'), entry.path + ' noindex')
    assert.ok(!sitemap.includes(entry.path), entry.path + ' excluded from sitemap')
  }
  if (!robotsMeta.includes('noindex') && new URL(canonical).pathname === entry.path) {
    assert.ok(sitemap.includes('<loc>' + canonical + '</loc>'), entry.path + ' sitemap')
  }
  assert.match(raw, /type="application\/ld\+json"/)
  for (const image of html.matchAll(/<img\b[^>]*\bsrc="(\/images\/[^"]+)"/g)) {
    await access(join(output, new URL(decode(image[1]), 'https://example.test').pathname.slice(1)))
  }
  if (entry.article) assert.match(html, /class="journal-article-body"[^>]*>[\s\S]*?<p[ >]/)
  if (entry.path === '/blog/') blog = html
  if (entry.path === '/') assert.match(html, /<a\b[^>]*href="\/services\/ai-agent-development\/"[^>]*>AI Agent Development<\/a>/)
  if (entry.path === '/contact/') assert.match(html, /href="mailto:[^"]+"/)
}
for (const article of articles) assert.ok(blog?.includes(`href="${article.path}"`), article.path + ' link in initial blog HTML')
if (!robots.includes('Disallow: /')) assert.match(robots, /Sitemap: https:\/\/[^\s]+\/sitemap\.xml/)
console.log(`Verified static HTML, metadata, media, and sitemap for ${pages.length} pages and ${articles.length} articles.`)
