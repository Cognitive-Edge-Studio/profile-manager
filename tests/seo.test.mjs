import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalValidation, effectiveSEO, pageMetadata, structuredData, safeJSON, headingAnchors, articleContents, sitemapEntries, robotsData } from '../src/domain/seo.mjs'
import { redirectProblem, normalizePath, pathProblem } from '../src/domain/routing.mjs'

const env = { CMS_ENV: 'production', SITE_URL: 'https://example.test', PUBLIC_INDEXING_ENABLED: 'true' }
const body = text => ({ root: { children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] } })
const page = { id: 1, title: 'About', pageKey: 'about', heading: 'About the engineer', meta: { title: 'Exact owner title', description: 'Exact description.', socialTitle: 'Share title', socialDescription: 'Share description', image: 1 } }
const site = { settings: { name: 'Owner', role: 'Engineer', meta: { title: 'Site title', description: 'Site default', image: 1 } }, pages: [page], posts: [], services: [], media: [{ id: 1, url: '/api/media/file/photo.jpg?v=1', width: 800, height: 1000, alt: 'Portrait', social: { url: '/api/media/file/photo-social.jpg?v=1', width: 1200, height: 630 } }], preview: false }

test('metadata resolves manual overrides, defaults, one canonical and public social image dimensions', () => {
  const meta = pageMetadata(site, 'pages', page, { env })
  assert.equal(meta.title, 'Exact owner title'); assert.equal(meta.description, 'Exact description.')
  assert.deepEqual(meta.alternates, { canonical: 'https://example.test/about/' })
  assert.equal(meta.openGraph.title, 'Share title'); assert.equal(meta.twitter.description, 'Share description')
  assert.equal(meta.openGraph.images[0].width, 1200); assert.equal(meta.openGraph.images[0].height, 630)
  assert.equal(meta.openGraph.images[0].url, 'https://example.test/api/media/file/photo-social.jpg?v=1')
  assert.equal(effectiveSEO(site, 'pages', { ...page, meta: {} }, { env }).description, 'Site default')
})
test('indexing requires production opt-in and respects previews, filters and noindex', () => {
  assert.equal(effectiveSEO(site, 'pages', page, { env }).indexable, true)
  for (const modified of [{ ...env, CMS_ENV: 'local' }, { ...env, CMS_ENV: 'staging' }, { ...env, PUBLIC_INDEXING_ENABLED: 'false' }]) assert.equal(effectiveSEO(site, 'pages', page, { env: modified }).indexable, false)
  assert.equal(effectiveSEO({ ...site, preview: true }, 'pages', page, { env }).indexable, false)
  assert.equal(effectiveSEO(site, 'pages', page, { env, filtered: true }).indexable, false)
  assert.equal(effectiveSEO(site, 'pages', { ...page, meta: { hideFromSearch: true } }, { env }).indexable, false)
  assert.deepEqual(robotsData(env).rules.disallow, ['/admin/', '/api/', '/preview'])
  assert.equal(robotsData({ ...env, CMS_ENV: 'staging' }).rules.disallow, '/')
})
test('sitemap excludes noindex, canonical overrides, redirect sources, incomplete services and private previews', () => {
  const content = { ...site, pages: [page, { ...page, id: 2, pageKey: 'contact', meta: { hideFromSearch: true } }], services: [{ id: 3, title: 'Unfinished', slug: 'unfinished', detailsReviewed: false, body: body('Some copy') }, { id: 4, title: 'Reviewed', slug: 'reviewed', detailsReviewed: true, body: body('Reviewed detail copy') }] }
  assert.deepEqual(sitemapEntries(content, [], env).map(item => item.url), ['https://example.test/about/', 'https://example.test/services/reviewed/'])
  assert.deepEqual(sitemapEntries(content, ['/about/'], env).map(item => item.url), ['https://example.test/services/reviewed/'])
  assert.equal(sitemapEntries({ ...site, pages: [{ ...page, meta: { canonicalURL: 'https://other.test/about/' } }] }, [], env).length, 0)
  assert.equal(sitemapEntries({ ...content, preview: true }, [], env).length, 0)
})
test('structured data uses visible facts and real dates, escapes scripts, and can be disabled', () => {
  const doc = { title: '</script><script>alert(1)</script>', slug: 'article', excerpt: 'Visible summary', body: body('Content'), meta: {} }
  const value = structuredData(site, 'posts', doc, { env }), article = value['@graph'].find(item => item['@type'] === 'BlogPosting')
  assert.equal(article.headline, doc.title); assert.equal(article.datePublished, undefined)
  assert.ok(!safeJSON(value).includes('</script>')); assert.ok(safeJSON(value).includes('\\u003c'))
  assert.equal(JSON.parse(safeJSON(value))['@graph'].find(item => item['@type'] === 'BlogPosting').headline, doc.title)
  assert.equal(structuredData(site, 'posts', { ...doc, meta: { structuredData: false } }, { env }), undefined)
  const service = structuredData(site, 'services', { title: 'Service', slug: 'service', summary: 'Visible service summary', category: 'Application Development' }, { env })['@graph'].find(item => item['@type'] === 'Service')
  assert.equal(service.description, 'Visible service summary'); assert.ok(!('aggregateRating' in service))
})
test('canonical and redirect validation rejects private routes, unsafe paths, loops and chains', () => {
  for (const value of ['javascript:alert(1)', 'https://user:secret@example.test/', 'https://example.test/preview?x=1', 'https://example.test/about/#part']) assert.notEqual(canonicalValidation(value), true)
  assert.equal(canonicalValidation('https://example.test/about/'), true)
  for (const path of ['/admin/', '/%61dmin/', '/_next/a', '/images/asset.png', '/old/../admin', '//other', '/bad%2fpath', '/bad%0apath']) assert.ok(pathProblem(path), path)
  assert.equal(normalizePath('/blog/a'), '/blog/a/'); assert.equal(normalizePath('/old.html'), '/old.html')
  const records = [{ id: 1, from: '/old/', to: '/about/', enabled: true }]
  assert.ok(redirectProblem({ from: '/new/', to: '/old/' }, records, env.SITE_URL))
  assert.ok(redirectProblem({ from: '/about/', to: '/old/' }, records, env.SITE_URL))
  assert.ok(redirectProblem({ from: '/loop/', to: '/loop/' }, [], env.SITE_URL))
  assert.equal(redirectProblem({ from: '/legacy/', to: '/about/' }, records, env.SITE_URL), undefined)
})
test('body heading anchors are deterministic and repeated headings have distinct targets', () => {
  const heading = { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'How it works' }] }
  assert.deepEqual(headingAnchors({ root: { children: [heading, heading] } }), ['heading-how-it-works', 'heading-how-it-works-2'])
})
test('article contents follows section hierarchy and preserves exact anchors across duplicate titles', () => {
  const heading = (tag, text) => ({ type: 'heading', tag, children: [{ type: 'text', text }] })
  const article = { root: { children: [heading('h2', ''), heading('h2', 'Plan & scope'), heading('h3', 'Plan & scope'), { type: 'quote', children: [heading('h2', 'Plan & scope')] }, heading('h2', 'Next steps')] } }
  assert.deepEqual(articleContents(article), [
    { id: 'heading-plan-scope', title: 'Plan & scope', children: [{ id: 'heading-plan-scope-2', title: 'Plan & scope', children: [] }] },
    { id: 'heading-plan-scope-3', title: 'Plan & scope', children: [] },
    { id: 'heading-next-steps', title: 'Next steps', children: [] },
  ])
  assert.deepEqual(articleContents({ root: { children: [heading('h3', 'Only section')] } }), [{ id: 'heading-only-section', title: 'Only section', children: [] }])
  assert.deepEqual(articleContents(body('No headings yet')), [])
})
