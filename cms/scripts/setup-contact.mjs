import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'

if (process.env.CMS_ENV !== 'local') throw new Error('Contact setup is for the local development environment only.')
let source = await readFile('.env.local', 'utf8')
const values = { CONTACT_SUBMISSIONS_ENABLED: 'true', CONTACT_NOTIFICATION_PROVIDER: 'disabled', CONTACT_RETENTION_DAYS: '180', CONTACT_NOTIFICATION_TO: process.env.CONTACT_NOTIFICATION_TO || '', CONTACT_WORKER_SECRET: randomBytes(32).toString('hex') }
for (const [name, value] of Object.entries(values)) {
  const pattern = new RegExp('^' + name + '=.*$', 'm')
  if (pattern.test(source)) { if (name === 'CONTACT_NOTIFICATION_TO') source = source.replace(pattern, name + '=' + value) }
  else source += '\n' + name + '=' + value
}
await writeFile('.env.local', source.trimEnd() + '\n')
console.log('Local contact settings saved privately. Real email remains disabled; the public contact address is unchanged.')
