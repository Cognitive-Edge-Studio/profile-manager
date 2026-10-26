import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

assert.equal(process.env.CMS_ENV, 'local')
const base = 'http://127.0.0.1:3000'
const credentials = JSON.parse(await readFile('.local/owner-credentials.json', 'utf8'))
const login = await fetch(base + '/api/users/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
assert.equal(login.status, 200)
const headers = { Origin: base, Cookie: login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') }
const removal = JSON.parse(await readFile('docs/service-page-removal.json', 'utf8'))
const checks = []
for (const path of ['/services/', ...removal.servicePages.map(page => page.path)]) {
  const response = await fetch(base + path, { redirect: 'manual' }); assert.equal(response.status, 404, path); checks.push({ path, status: 404 })
}
for (const page of removal.servicePages) assert.equal((await fetch(`${base}/preview?collection=services&id=${page.id}`, { headers, redirect: 'manual' })).status, 404)
assert.equal((await fetch(`${base}/preview?collection=pages&id=${removal.pillar.id}`, { headers, redirect: 'manual' })).status, 404)
const services = await (await fetch(base + '/api/services?limit=100', { headers })).json(); assert.equal(services.totalDocs, 0)
const pages = await (await fetch(base + '/api/pages?limit=100', { headers })).json(); assert.equal(pages.totalDocs, 5); assert.ok(!pages.docs.some(page => page.pageKey === 'services'))
const home = pages.docs.find(page => page.pageKey === 'home')
const preview = await fetch(`${base}/preview?collection=pages&id=${home.id}`, { headers }); assert.equal(preview.status, 200)
const html = await preview.text(), cards = html.match(/<article class="service-card"[\s\S]*?<\/article>/g) || []
assert.equal(cards.length, 9); assert.ok(cards.every(card => !card.includes('/services/')))
for (const page of removal.servicePages) assert.ok(cards.some(card => card.includes(page.title)), page.title)
const settings = await (await fetch(base + '/api/globals/site-settings?draft=true&depth=0', { headers })).json()
for (const link of [...settings.headerLinks, ...settings.footerLinks].filter(link => link.label === 'Services')) { assert.equal(link.page.relationTo, 'pages'); assert.equal(Number(link.page.value), home.id); assert.equal(link.fragment, 'services') }
assert.ok(!(await (await fetch(base + '/sitemap.xml')).text()).includes('/services/'))
await writeFile('docs/service-page-removal-checks.json', JSON.stringify({ result: 'passed', publicAddresses: checks, authenticatedDeletedPreviews: 'all return 404', pages: pages.docs.map(page => ({ id: page.id, title: page.title })), servicePages: services.totalDocs, retainedHomepageCards: cards.length, navigation: 'Services links to the existing homepage #services section', sitemap: 'No removed service URLs', publication: 'Owner content remains draft; nothing published' }, null, 2) + '\n')
console.log('Removal checks passed: generated pages/previews return 404, Services is empty, five original page records and all nine homepage cards remain.')
