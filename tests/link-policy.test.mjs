import assert from 'node:assert/strict'
import test from 'node:test'
import { articleLinkRel } from '../src/domain/link-policy.mjs'

test('article outbound web links always include nofollow and retain other relationships', () => {
  const origin = 'https://shibly.example'
  for (const href of ['https://reference.example/guide', 'http://reference.example', '//reference.example']) {
    assert.equal(articleLinkRel(href, '', origin), 'nofollow')
    assert.equal(articleLinkRel(href, 'noopener noreferrer sponsored', origin), 'noopener noreferrer sponsored nofollow')
    assert.equal(articleLinkRel(href, 'nofollow sponsored nofollow', origin), 'nofollow sponsored')
  }
  for (const href of ['/#services', '#summary', '/contact/', 'https://shibly.example/blog/', 'mailto:hello@example.test', 'tel:+123456']) {
    assert.equal(articleLinkRel(href, '', origin), '', href)
  }
})
