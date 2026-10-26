import { writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { importContent } from '../migration/import-content'

if (process.env.CMS_ENV !== 'local') throw new Error('This importer is restricted to local development. Use a reviewed migration workflow for release.')
if (!['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error('A loopback database is required.')
const apply = process.argv.includes('--apply')
const update = process.argv.includes('--update-source')
if (update && !apply) throw new Error('--update-source requires --apply. It replaces imported fields with source content in draft revisions.')
const payload = await getPayload({ config })
try {
  const report = await importContent(payload, { apply, update })
  await writeFile(`docs/slice4-import-${apply ? 'applied' : 'dry-run'}.json`, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally { await payload.destroy() }
process.exit(0)
