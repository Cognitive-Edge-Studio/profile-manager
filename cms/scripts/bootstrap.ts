import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

if (process.env.CMS_ENV !== 'local') throw new Error('This bootstrap is restricted to local development.')
const payload = await getPayload({ config })
try {
  const count = await payload.count({ collection: 'users', overrideAccess: true })
  if (count.totalDocs) {
    console.log('A team account already exists. Existing passwords and roles were retained.')
  } else {
    const email = process.env.LOCAL_ADMIN_EMAIL
    if (!email) throw new Error('Set LOCAL_ADMIN_EMAIL in .env.local.')
    const password = randomBytes(24).toString('base64url')
    await mkdir(resolve('.local'), { recursive: true })
    const destination = resolve('.local/owner-credentials.json')
    await writeFile(destination, `${JSON.stringify({ email, password, login: 'http://localhost:3000/admin/login' }, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
    await payload.create({ collection: 'users', data: { name: 'Website owner', email, password, role: 'admin' }, overrideAccess: true, context: { localBootstrap: true } })
    console.log('Created the local owner account. Sign-in details are in the private .local/owner-credentials.json file; they were not printed.')
  }
} finally {
  await payload.destroy()
}
// Like Payload's own CLI, terminate after successful cleanup: the adapter keeps
// a PostgreSQL reconnect client open. Failures above still exit unsuccessfully.
process.exit(0)
