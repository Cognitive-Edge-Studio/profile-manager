import assert from 'node:assert/strict'
import test from 'node:test'
import { contentPath, validateDestination, validateSlug, validateRedirect } from '../src/domain/contracts.mjs'

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
