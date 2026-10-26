import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import pg from 'pg'

if (process.env.CMS_ENV !== 'local') throw new Error('Local development only.')
const url = new URL(process.env.DATABASE_URL!)
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Loopback database required.')
const name = url.pathname.slice(1)
if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('Simple database name required.')
const source = new pg.Client({ connectionString: url.toString() }); await source.connect()
if ((await source.query('SHOW server_encoding')).rows[0].server_encoding === 'UTF8') { await source.end(); console.log('Already UTF8. Nothing changed.'); process.exit(0) }
const tables = (await source.query("SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).rows
const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"'
const snapshot = []
for (const table of tables) {
  const columns = (await source.query('SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position', [table.table_schema, table.table_name])).rows
  snapshot.push({ ...table, columns, rows: (await source.query(`SELECT * FROM public.${quote(table.table_name)}`)).rows })
}
const backupDir = resolve('.local/backups'); await mkdir(backupDir, { recursive: true })
await writeFile(resolve(backupDir, `${name}-${Date.now()}.json`), JSON.stringify(snapshot), { flag: 'wx', mode: 0o600 })
await source.end()
const targetName = `${name}_utf8`
const maintenanceURL = new URL(url); maintenanceURL.pathname = '/postgres'
const maintenance = new pg.Client({ connectionString: maintenanceURL.toString() }); await maintenance.connect()
if ((await maintenance.query('SELECT 1 FROM pg_database WHERE datname=$1', [targetName])).rowCount) throw new Error('Target already exists. Inspect before retrying; no databases were removed.')
await maintenance.query(`CREATE DATABASE ${quote(targetName)} WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`)
await maintenance.end()
const newURL = new URL(url); newURL.pathname = `/${targetName}`
process.env.DATABASE_URL = newURL.toString()
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config }); await payload.db.migrate(); await payload.destroy()
const target = new pg.Client({ connectionString: newURL.toString() }); await target.connect()
assert.equal((await target.query('SHOW server_encoding')).rows[0].server_encoding, 'UTF8')
await target.query('BEGIN')
try {
  await target.query("SET LOCAL session_replication_role='replica'")
  assert.equal((await target.query('SELECT current_database() AS name')).rows[0].name, targetName)
  await target.query('TRUNCATE ' + snapshot.map(table => `public.${quote(table.table_name)}`).join(', ') + ' RESTART IDENTITY CASCADE')
  for (const table of snapshot) {
    const cols = table.columns
    for (const row of table.rows) await target.query(`INSERT INTO public.${quote(table.table_name)} (${cols.map((col: any) => quote(col.column_name)).join(',')}) VALUES (${cols.map((_: any, i: number) => '$' + (i + 1)).join(',')})`, cols.map((col: any) => ['json', 'jsonb'].includes(col.data_type) && row[col.column_name] !== null ? JSON.stringify(row[col.column_name]) : row[col.column_name]))
    assert.equal(Number((await target.query(`SELECT count(*) AS count FROM public.${quote(table.table_name)}`)).rows[0].count), table.rows.length)
    for (const col of cols) {
      const sequence = (await target.query('SELECT pg_get_serial_sequence($1,$2) AS name', [`public.${quote(table.table_name)}`, col.column_name])).rows[0].name
      if (sequence) await target.query(`SELECT setval($1, COALESCE((SELECT MAX(${quote(col.column_name)}) FROM public.${quote(table.table_name)}), 0) + 1, false)`, [sequence])
    }
  }
  await target.query('COMMIT')
} catch (error) { await target.query('ROLLBACK'); throw error }
await target.end()
const file = resolve('.env.local'); const previous = await readFile(file, 'utf8')
await writeFile(resolve(backupDir, `env-before-utf8-${Date.now()}.txt`), previous, { flag: 'wx', mode: 0o600 })
await writeFile(file, previous.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${newURL.toString()}`), { mode: 0o600 })
console.log('Verified the UTF8 copy and all table row counts. Switched local configuration; original database and private snapshot retained. Restart the app.')
process.exit(0)
