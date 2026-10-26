import assert from 'node:assert/strict'
import { unlink } from 'node:fs/promises'
import { resolve, basename, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'

export async function fixtureUploadPaths(payload: Payload, database: string) {
  assert.match(database, /^cms_(?:content|http|seo)_test_\d+$/)
  assert.equal((await payload.db.pool!.query('SELECT current_database() AS name')).rows[0].name, database)
  const media = (await payload.find({ collection: 'media', pagination: false, limit: 1000, depth: 0, overrideAccess: true })).docs
  const root = fileURLToPath(new URL('../../uploads/', import.meta.url))
  return media.flatMap(doc => [doc.filename, ...Object.values(doc.sizes || {}).map(size => size?.filename)]).filter((name): name is string => Boolean(name)).map(name => {
    assert.ok(name.startsWith(database + '-') && basename(name) === name, 'Only this fixture’s uniquely named uploads may be removed')
    const path = resolve(root, name); assert.ok(path.startsWith(resolve(root) + sep)); return path
  })
}
export async function removeFixtureUploads(paths: string[]) { for (const path of paths) { try { await unlink(path) } catch (error: any) { if (error.code !== 'ENOENT') throw error } } }
