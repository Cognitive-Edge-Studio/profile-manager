import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

if (process.env.CMS_ENV !== 'local') throw new Error('The embedded database is for local development only.')
const connection = new URL(process.env.DATABASE_URL || '')
if (!['127.0.0.1', 'localhost'].includes(connection.hostname)) throw new Error('Local PostgreSQL must bind to loopback.')
const name = connection.pathname.slice(1)
if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('Use a simple local database name.')
const directory = resolve('.local/postgres')
const pg = new EmbeddedPostgres({
  databaseDir: directory,
  user: decodeURIComponent(connection.username),
  password: decodeURIComponent(connection.password),
  port: Number(connection.port),
  authMethod: 'scram-sha-256',
  persistent: true,
  createPostgresUser: false,
  initdbFlags: ['--encoding=UTF8'],
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {},
  onError: message => { if (/error|fatal/i.test(String(message))) console.error(String(message)) },
})
if (!existsSync(resolve(directory, 'PG_VERSION'))) await pg.initialise()
await pg.start()
const client = pg.getPgClient('postgres', '127.0.0.1')
await client.connect()
const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
if (!found.rowCount) await client.query(`CREATE DATABASE "${name}" WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
await client.end()
console.log(`Local PostgreSQL ready on 127.0.0.1:${connection.port}; persistent data in .local/postgres.`)
const keepAlive = setInterval(() => {}, 30_000)
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  clearInterval(keepAlive)
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
