import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

if (process.env.CMS_ENV !== 'local') throw new Error('HTTP verification is local only.')
const base = 'http://127.0.0.1:3000'
const credentials = JSON.parse(await readFile('.local/owner-credentials.json', 'utf8'))
const login = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email: credentials.email, password: credentials.password }) })
assert.equal(login.status, 200, 'Owner sign-in must succeed')
const session = await login.json()
assert.ok(session.token)
const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
assert.ok(cookie.includes('payload-token='), 'Owner login sets an HTTP-only session cookie')
const headers = { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' }
const me = await fetch(`${base}/api/users/me`, { headers })
assert.equal((await me.json()).user?.id, session.user.id, 'Browser cookies must authenticate requests with a local Origin header')
let testID
try {
  for (const path of ['/api/users', '/api/inquiries', '/api/globals/site-settings']) {
    const response = await fetch(`${base}${path}`)
    assert.equal(response.status, 403, `Anonymous access to ${path} must be denied`)
  }
  const anonymousPreview = await fetch(`${base}/preview?collection=services&id=1`, { redirect: 'manual' })
  assert.equal(anonymousPreview.status, 307)
  assert.ok(anonymousPreview.headers.get('location')?.endsWith('/admin/login'))
  const create = await fetch(`${base}/api/services?draft=true`, { method: 'POST', headers, body: JSON.stringify({ title: 'Temporary CMS verification', slug: `verification-${Date.now()}`, category: 'Application Development', summary: 'A temporary record used to verify local editing and private previews.', _status: 'draft' }) })
  assert.equal(create.status, 201, 'Administrator can create a service draft')
  const { doc } = await create.json()
  testID = doc.id
  const listing = await (await fetch(`${base}/api/services?draft=true`)).json()
  assert.ok(listing.docs.every(item => item.id !== testID), 'The anonymous API must not expose the draft')
  const preview = await fetch(`${base}/preview?collection=services&id=${testID}`, { headers })
  assert.equal(preview.status, 200)
  const html = await preview.text()
  assert.ok(html.includes('Temporary CMS verification'))
  assert.ok(html.includes('noindex'))
  const publish = await fetch(`${base}/api/services/${testID}`, { method: 'PATCH', headers, body: JSON.stringify({ _status: 'published', detailsReviewed: true, body: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Temporary verification details; this record is removed after the check.', format: 0 }] }] } } }) })
  assert.equal(publish.status, 200)
  const publicDoc = await fetch(`${base}/api/services/${testID}`)
  assert.equal(publicDoc.status, 200)
  assert.equal((await publicDoc.json()).title, 'Temporary CMS verification')
  console.log('HTTP checks passed: browser cookie login/origin, private APIs, draft isolation, protected preview, and administrator publication.')
} finally {
  if (testID) {
    const response = await fetch(`${base}/api/services/${testID}`, { method: 'DELETE', headers })
    assert.equal(response.status, 200, 'Remove only the temporary verification record')
  }
}

