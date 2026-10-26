import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { validateContact, issueContactToken, checkContactToken, contactOriginAllowed, notificationConfig, retentionDays } from '../src/domain/contact.mjs'

const form = () => ({ name: 'Example visitor', email: 'EXAMPLE@example.test', message: 'A sufficiently detailed project inquiry.', budget: '', timeline: '', source: 'contact', website: '', idempotencyKey: randomUUID() })
test('contact fields reject unexpected keys, injection/control characters and invalid inputs', () => {
  assert.equal(validateContact(form()).data.email, 'example@example.test')
  for (const change of [{ role: 'admin' }, { email: 'not-an-email' }, { name: 'a\nb' }, { message: 'short' }, { message: 'a'.repeat(8001) }, { website: 'spam' }, { source: 'other' }, { idempotencyKey: 'predictable' }, { budget: {} }]) assert.ok(validateContact({ ...form(), ...change }).errors)
  assert.ok(validateContact(null).errors); assert.ok(validateContact([]).errors)
})
test('contact tokens are signed, expire, and require a short human interaction interval', () => {
  const secret = 'only-a-disposable-test-signing-secret', now = Date.now(), token = issueContactToken(now, secret)
  assert.ok(checkContactToken(token, now + 2000, secret).nonce)
  assert.ok(checkContactToken(token, now, secret).error)
  assert.ok(checkContactToken(token, now + 3600001, secret).error)
  assert.ok(checkContactToken(token + 'x', now + 2000, secret).error)
  assert.ok(checkContactToken(token, now + 2000, 'different-secret').error)
})
test('contact origin checks and notification configuration fail closed', () => {
  const env = { CMS_ENV: 'production', SITE_URL: 'https://example.test' }
  assert.equal(contactOriginAllowed(new Headers({ Origin: 'https://example.test' }), env), true)
  assert.equal(contactOriginAllowed(new Headers({ Origin: 'https://other.test' }), env), false)
  assert.equal(contactOriginAllowed(new Headers({ Origin: 'https://example.test', 'Sec-Fetch-Site': 'cross-site' }), env), false)
  assert.equal(contactOriginAllowed(new Headers(), env), false)
  assert.equal(notificationConfig({ CMS_ENV: 'production', CONTACT_NOTIFICATION_PROVIDER: 'capture' }).ready, false)
  assert.equal(notificationConfig({ CMS_ENV: 'local', CONTACT_NOTIFICATION_PROVIDER: 'capture' }).ready, true)
  assert.equal(notificationConfig({ CONTACT_NOTIFICATION_PROVIDER: 'resend', RESEND_API_KEY: 'fixture', CONTACT_NOTIFICATION_FROM: 'sender@example.test', CONTACT_NOTIFICATION_TO: 'bad\naddress' }).ready, false)
  assert.throws(() => retentionDays({ CONTACT_RETENTION_DAYS: '0' }))
})
test('notification recipients support two addresses and reject invalid lists before sending', () => {
  const env = { CONTACT_NOTIFICATION_PROVIDER: 'resend', RESEND_API_KEY: 'fixture', CONTACT_NOTIFICATION_FROM: 'sender@example.test', CONTACT_NOTIFICATION_TO: 'first@example.test, second@example.test' }
  assert.deepEqual(notificationConfig(env).to, ['first@example.test', 'second@example.test'])
  assert.deepEqual(notificationConfig({ ...env, CONTACT_NOTIFICATION_TO: 'first@example.test, FIRST@example.test' }).to, ['first@example.test'])
  assert.deepEqual(notificationConfig({ ...env, CONTACT_NOTIFICATION_TO: 'first@example.test' }).to, ['first@example.test'])
  for (const to of ['', 'first@example.test,', 'first@example.test,,second@example.test', 'first@example.test;second@example.test', 'first@example.test, invalid', 'first@example.test,\nsecond@example.test', Array.from({ length: 51 }, (_, i) => `recipient${i}@example.test`).join(',')]) {
    assert.equal(notificationConfig({ ...env, CONTACT_NOTIFICATION_TO: to }).ready, false)
  }
})
