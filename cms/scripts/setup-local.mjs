import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  console.log('Existing local configuration retained.')
} else {
  await mkdir(resolve(root, '.local'), { recursive: true })
  const secret = randomBytes(48).toString('hex')
  const dbPassword = randomBytes(24).toString('hex')
  await writeFile(envPath, `PAYLOAD_SECRET=${secret}\nDATABASE_URL=postgresql://cms:${dbPassword}@127.0.0.1:55432/shibly_cms\nNEXT_PUBLIC_SERVER_URL=http://localhost:3000\nCMS_ENV=local\nCMS_TEST_SCHEMA_PUSH=false\nLOCAL_ADMIN_EMAIL=shibly.work@gmail.com\n`, { flag: 'wx', mode: 0o600 })
  console.log('Created private local configuration. No production services were configured.')
}
