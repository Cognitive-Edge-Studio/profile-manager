import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanTitleDots, normalizeOwnerLinks, normalizeImportedEditorial } from '../src/domain/editorial.mjs'
import { headingAnchors } from '../src/domain/seo.mjs'

test('title dots are removed while paragraph punctuation, source text and heading anchors stay intact', () => {
  const source = { heading: 'Hello.', sourceSnapshot: { heading: 'Hello.' }, body: { root: { children: [{ type: 'heading', tag: 'h3', children: [{ type: 'text', text: '1. Plan your release.' }] }, { type: 'paragraph', children: [{ type: 'text', text: 'Keep this sentence. And this one.' }] }] } } }
  const cleaned = cleanTitleDots(source)
  assert.equal(cleaned.heading, 'Hello')
  assert.equal(cleaned.sourceSnapshot.heading, 'Hello.')
  assert.equal(cleaned.body.root.children[0].children[0].text, '1 Plan your release')
  assert.equal(cleaned.body.root.children[1].children[0].text, 'Keep this sentence. And this one.')
  assert.deepEqual(headingAnchors(cleaned.body), headingAnchors(source.body))
})
test('owner service and inquiry links use the intended pages without changing external or email destinations', () => {
  const values = [
    { type: 'link', fields: { url: '/#services', linkType: 'custom' }, children: [{ type: 'text', text: 'my services' }] },
    { type: 'link', fields: { url: '/#lets-talk', linkType: 'custom' } },
    { label: 'Discuss your project', kind: 'internal', page: { relationTo: 'pages', value: 1 }, fragment: 'lets-talk' },
    { type: 'link', fields: { url: 'https://other.example/services/' } },
    { label: 'Email me', kind: 'contact', url: 'mailto:owner@example.test' },
  ]
  const normalized = normalizeOwnerLinks(values, 1, 3)
  assert.deepEqual(normalized[0].fields.doc, { relationTo: 'pages', value: 1 }); assert.equal(normalized[0].fields.fragment, 'services')
  assert.deepEqual(normalized[1].fields.doc, { relationTo: 'pages', value: 3 }); assert.equal(normalized[1].fields.fragment, null)
  assert.deepEqual(normalized[2].page, { relationTo: 'pages', value: 3 }); assert.equal(normalized[2].fragment, null)
  assert.deepEqual(normalized.slice(3), values.slice(3))
  assert.deepEqual(normalizeOwnerLinks(normalized, 1, 3), normalized)
  assert.equal(normalizeImportedEditorial(values)[1].fields.url, '/contact/')
})
