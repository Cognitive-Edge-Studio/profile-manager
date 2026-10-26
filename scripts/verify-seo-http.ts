import assert from 'node:assert/strict'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import sharp from 'sharp'
import type { Payload } from 'payload'

export async function verifySEO({ payload, user, base, headers, rich, name }: { payload: Payload; user: any; base: string; headers: Record<string, string>; rich: (text: string) => any; name: string }) {
  assert.match(name, /^cms_http_test_\d+$/)
  assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, name)
  // This fixture explicitly simulates an owner adding their own service index.
  // The content importer must not create it or any service pages automatically.
  await payload.create({ collection: 'pages', data: { title: 'Services', heading: 'Services', pageKey: 'services', _status: 'published' }, user, overrideAccess: false })
  const checks: string[] = []
  const request = (path: string, options: RequestInit = {}) => fetch(base + path, { redirect: 'manual', ...options })
  const html = async (path: string) => { const response = await request(path); assert.equal(response.status, 200, path); return response.text() }
  const mutate = (collection: string, id: number, data: any, query = '') => request(`/api/${collection}/${id}${query}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  const update = async (data: any) => { const response = await mutate('services', service.id, data); assert.equal(response.status, 200, await response.text()) }
  const sitemap = async () => html('/sitemap.xml')
  const bytes = await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#cbd5e1' } }).jpeg().toBuffer()
  const image = await payload.create({ collection: 'media', data: { alt: 'Disposable service demonstration image', visibility: 'public' }, file: { data: bytes, name: `${name}-seo.jpg`, mimetype: 'image/jpeg', size: bytes.length }, user, overrideAccess: false })
  const service = await payload.create({ collection: 'services', data: { title: 'Disposable SEO service', slug: 'seo-fixture', category: 'Application Development', summary: 'A service summary used exclusively in a disposable verification database.', _status: 'draft' }, draft: true, user, overrideAccess: false })
  assert.ok((await mutate('services', service.id, { _status: 'published' }, '?draft=true')).status >= 400)
  checks.push('HTTP publication rejects missing reviewed service detail, including draft=true')
  const meta: any = { title: 'Reviewed fixture search title', description: 'A manually written description for the disposable service page, used to verify metadata and publication behavior.', socialTitle: 'Fixture sharing title', socialDescription: 'Fixture sharing description', image: image.id }
  await update({ body: rich('## Delivery\n\nReviewed fixture details with **emphasis** and [descriptive anchor words](https://example.com/documentation).'), detailsReviewed: true, benefits: [{ text: 'Fixture benefit' }], process: [{ heading: 'Fixture process', body: 'Fixture process description' }], faqs: [{ question: 'Fixture question?', answer: rich('Fixture answer.') }], meta, _status: 'published' })
  const path = '/services/seo-fixture/'
  let page = await html(path), head = page.split('</head>')[0]
  assert.equal((head.match(/rel="canonical"/g) || []).length, 1)
  for (const text of ['Reviewed fixture search title', 'Fixture sharing title', 'Fixture sharing description', 'https://example.test/services/seo-fixture/', 'property="og:image:width" content="1200"', 'property="og:image:height" content="630"', 'name="twitter:card" content="summary_large_image"', 'name="robots" content="index, follow"']) assert.ok(head.includes(text), text)
  const graph = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])['@graph']
  assert.ok(graph.some((item: any) => item['@type'] === 'Service' && item.name === service.title))
  assert.ok(graph.some((item: any) => item['@type'] === 'Person'))
  assert.ok(graph.some((item: any) => item['@type'] === 'BreadcrumbList'))
  assert.ok(!JSON.stringify(graph).includes('aggregateRating'))
  for (const text of ['Fixture benefit', 'Fixture process', 'Fixture question?', 'id="heading-delivery"', 'descriptive anchor words']) assert.ok(page.includes(text), text)
  assert.ok((await html('/services/')).includes(path)); assert.ok((await sitemap()).includes('https://example.test' + path))
  checks.push('Published service template, initial HTML canonical/indexing/social metadata, actual 1200×630 image, Service/Person/Breadcrumb JSON-LD and sitemap')
  // Optional bounded pause lets browser QA inspect only disposable published copy.
  if (process.argv.includes('--browser')) {
    const signal = '.local/slice5-browser-ready.json'
    await writeFile(signal, JSON.stringify({ url: base + path, database: name, reviewed: false }))
    for (let attempt = 0; attempt < 240; attempt++) {
      if (JSON.parse(await readFile(signal, 'utf8')).reviewed === true) break
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    await unlink(signal)
  }
  const post = (await payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: 1, overrideAccess: true })).docs[0]
  const article = await html(`/blog/${post.slug}/`)
  const articleGraph = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])['@graph']
  assert.ok(articleGraph.some((item: any) => item['@type'] === 'BlogPosting' && !item.datePublished && !item.dateModified))
  assert.equal((await mutate('services', service.id, { meta: { ...meta, title: 'Saved draft metadata title' } }, '?draft=true')).status, 200)
  assert.ok((await html(path)).split('</head>')[0].includes('Reviewed fixture search title'))
  const preview = await request(`/preview?collection=services&id=${service.id}`, { headers })
  assert.equal(preview.status, 200); assert.ok(preview.headers.get('cache-control')?.includes('no-store'))
  const previewHTML = await preview.text(); assert.ok(previewHTML.includes('noindex')); assert.ok(previewHTML.split('</head>')[0].includes('Saved draft metadata title'))
  meta.title = 'Updated published metadata title'
  await update({ meta, _status: 'published' }); assert.ok((await html(path)).split('</head>')[0].includes(meta.title))
  checks.push('Manual draft SEO edits preview privately, leave public metadata unchanged and become live on the next request after publishing')
  assert.equal((await request(`/api/publication-checks?collection=services&id=${service.id}`)).status, 403)
  const reportResponse = await request(`/api/publication-checks?collection=services&id=${service.id}`, { headers })
  assert.equal(reportResponse.status, 200); assert.ok(reportResponse.headers.get('cache-control')?.includes('no-store'))
  const report = await reportResponse.json(); assert.equal(report.effective.canonical, 'https://example.test' + path); assert.equal(report.publishedPath, path)
  assert.ok(!JSON.stringify(report).includes('sourceSnapshot'))
  checks.push('Article schema has no inferred dates; authenticated noindex/no-store previews and private owner readiness endpoint')
  const robots = await html('/robots.txt'); assert.ok(robots.includes('Allow: /')); assert.ok(!robots.includes('Disallow: /services')); assert.ok(robots.includes('https://example.test/sitemap.xml'))
  await update({ meta: { ...meta, hideFromSearch: true }, _status: 'published' })
  assert.ok((await html(path)).split('</head>')[0].includes('noindex')); assert.ok(!(await sitemap()).includes('https://example.test' + path))
  await update({ meta: { ...meta, hideFromSearch: false, canonicalURL: 'https://example.org/original/' }, _status: 'published' })
  assert.ok((await html(path)).split('</head>')[0].includes('https://example.org/original/')); assert.ok(!(await sitemap()).includes('https://example.test' + path))
  await update({ meta: { ...meta, hideFromSearch: false, canonicalURL: null }, _status: 'published' })
  assert.ok((await html('/blog/?q=fixture')).split('</head>')[0].includes('noindex'))
  checks.push('Production robots allows crawling noindex pages; noindex, canonical overrides and filtered blog sitemap policies')
  assert.equal((await mutate('services', service.id, { slug: 'seo-fixture-two' }, '?draft=true')).status, 200)
  assert.equal((await request(path)).status, 200); assert.equal((await request('/services/seo-fixture-two/')).status, 404)
  await update({ slug: 'seo-fixture-two', _status: 'published' })
  let redirect = await request(path + '?campaign=fixture'); assert.equal(redirect.status, 308); assert.equal(new URL(redirect.headers.get('location')!, base).pathname, '/services/seo-fixture-two/'); assert.equal(new URL(redirect.headers.get('location')!, base).search, '?campaign=fixture'); assert.ok(redirect.headers.get('cache-control')?.includes('no-store'))
  await update({ slug: 'seo-fixture-three', _status: 'published' })
  redirect = await request(path); assert.equal(new URL(redirect.headers.get('location')!, base).pathname, '/services/seo-fixture-three/')
  assert.ok((await html('/services/')).includes('/services/seo-fixture-three/')); assert.ok(!(await sitemap()).includes('https://example.test' + path))
  await update({ slug: 'seo-fixture', _status: 'published' }); assert.equal((await request(path)).status, 200)
  assert.equal((await request('/services/seo-fixture-three/')).status, 308)
  assert.equal((await request('/services/seo-fixture')).status, 308)
  checks.push('Draft slug isolation; real permanent redirects preserve local queries, collapse chains, support restoring old addresses and refresh navigation/sitemap')
  const manual = await payload.create({ collection: 'redirects', data: { from: '/fixture-offer/', to: path, permanent: false }, user, overrideAccess: false })
  assert.equal((await request('/fixture-offer/')).status, 307)
  await payload.update({ collection: 'redirects', id: manual.id, data: { enabled: false }, user, overrideAccess: false })
  assert.equal((await request('/fixture-offer/')).status, 404)
  await payload.create({ collection: 'redirects', data: { from: '/fixture-external/', to: 'https://example.org/offer/', permanent: true }, user, overrideAccess: false })
  redirect = await request('/fixture-external/?private=visitor'); assert.equal(redirect.headers.get('location'), 'https://example.org/offer/')
  await assert.rejects(payload.create({ collection: 'redirects', data: { from: '/admin/', to: path }, user, overrideAccess: false }))
  checks.push('Temporary/disabled/external HTTP redirects, reserved route protection and no visitor query forwarding off-site')
  await payload.updateGlobal({ slug: 'site-settings', data: { headerLinks: [{ label: 'Required service', kind: 'internal', page: { relationTo: 'services', value: service.id } }], _status: 'published' }, user, overrideAccess: false })
  assert.ok((await mutate('services', service.id, { _status: 'draft' })).status >= 400)
  await payload.updateGlobal({ slug: 'site-settings', data: { headerLinks: [], _status: 'published' }, user, overrideAccess: false })
  await update({ _status: 'draft' }); assert.equal((await request(path)).status, 404); assert.equal((await request('/services/seo-fixture-three/')).status, 404); assert.ok(!(await sitemap()).includes('https://example.test' + path))
  assert.ok(!(await html('/services/')).includes(path))
  await payload.delete({ collection: 'services', id: service.id, user, overrideAccess: false })
  const redirects = (await payload.find({ collection: 'redirects', depth: 0, limit: 100, overrideAccess: true })).docs
  assert.ok(!redirects.some(item => item.managedTarget?.relationTo === 'services' && Number(item.managedTarget.value) === service.id))
  checks.push('Required navigation blocks unpublish; removing references allows immediate 404/list/sitemap removal; deletion removes managed aliases')
  await writeFile('docs/slice5-http-checks.json', JSON.stringify({ result: 'passed', environment: 'Production build with indexing enabled, served only on loopback using a disposable UTF8 database and example.test canonical origin. No external requests or owner content publication.', checks }, null, 2) + '\n')
  console.log('Slice 5 production SEO and redirect HTTP checks passed.')
}

