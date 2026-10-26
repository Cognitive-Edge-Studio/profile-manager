import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { inventory } from '../scripts/inventory.mjs'
import { contentPath, validateDestination, validateSlug, validateRedirect, publicationChangeAllowed, isAdmin } from '../src/domain/contracts.mjs'

test('migration baseline preserves original words, dates, URLs and source files', async () => {
  const actual = await inventory()
  const baseline = JSON.parse(await readFile(new URL('../migration/source-inventory.json', import.meta.url), 'utf8'))
  assert.deepEqual(actual, baseline)
  assert.equal(actual.services.length, 9)
  assert.equal(actual.posts.length, 5)
  assert.equal(new Set(actual.routes.map(route => route.path)).size, actual.routes.length)
  assert.equal(new Set([...actual.services, ...actual.projects, ...actual.posts].map(doc => doc.sourceId)).size, actual.services.length + actual.projects.length + actual.posts.length)
  for (const doc of [...actual.pages, ...actual.services, ...actual.projects, ...actual.posts]) assert.equal(doc._status, 'draft')
  for (const post of actual.posts) assert.equal(post.publishedAt, null)
})

test('untrusted link values and system addresses are rejected', () => {
  assert.equal(contentPath('services', {}), undefined)
  assert.equal(contentPath('posts', { slug: '../admin' }), undefined)
  assert.equal(contentPath('services', { slug: 'ai-integration' }), '/services/ai-integration/')
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '//evil.test', '/\\evil.test', 'https://user:password@example.com', '/bad path', '#', 'mailto:person@example.com']) assert.notEqual(validateDestination(url), true, url)
  for (const url of ['https://example.com/path?q=a#process', '/services/ai-integration/#process', '#process']) assert.equal(validateDestination(url), true, url)
  assert.equal(validateDestination('mailto:person@example.com', { contact: true }), true)
  for (const slug of ['admin', 'services', '../test', 'Two Words', '', 'about']) assert.notEqual(validateSlug(slug), true)
  assert.equal(validateSlug('ai-integration'), true)
  for (const [from, to] of [['/admin/', '/contact/'], ['/old/', '/old'], ['/old/', '/old/#section'], ['/old/', '#section'], ['/old?q=1', '/new/'], ['/old/', 'javascript:alert(1)']]) assert.notEqual(validateRedirect(from, to), true)
  assert.equal(validateRedirect('/old/', '/new/'), true)
})

test('publishing and editing published records require the right role and draft operation', () => {
  const admin = { collection: 'users', role: 'admin' }
  const editor = { collection: 'users', role: 'editor' }
  assert.equal(publicationChangeAllowed({ user: admin, data: { _status: 'published' } }), true)
  assert.equal(publicationChangeAllowed({ user: editor, data: { _status: 'published' }, draft: true }), false)
  assert.equal(publicationChangeAllowed({ user: editor, data: { title: 'overwrite' }, originalDoc: { _status: 'published' } }), false)
  assert.equal(publicationChangeAllowed({ user: editor, data: { _status: 'draft' }, originalDoc: { _status: 'published' }, draft: true }), true)
  for (const user of [null, {}, { role: 'admin' }, { collection: 'inquiries', role: 'admin' }]) {
    assert.equal(isAdmin(user), false)
    assert.equal(publicationChangeAllowed({ user, data: { _status: 'published' } }), false)
  }
})
