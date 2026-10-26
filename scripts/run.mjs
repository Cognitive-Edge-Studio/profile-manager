import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)
const localNode = resolve(root, 'node_modules/node-win-x64/bin/node.exe')
const runtime = process.platform === 'win32' && existsSync(localNode) ? localNode : process.execPath
const [tool, ...args] = process.argv.slice(2)
const bins = {
  next: 'node_modules/next/dist/bin/next',
  payload: 'node_modules/payload/bin.js',
  tsc: 'node_modules/typescript/bin/tsc',
  tsx: 'node_modules/tsx/dist/cli.mjs',
}
const target = tool === 'script' ? args.shift() : bins[tool]
if (!target && tool !== 'test') throw new Error(`Unknown local command: ${tool}`)
if (existsSync(resolve(root, '.env.local'))) process.loadEnvFile(resolve(root, '.env.local'))
const command = tool === 'test' ? ['--test', ...args] : [resolve(root, target), ...args]
const child = spawn(runtime, command, { cwd: root, env: process.env, stdio: 'inherit', windowsHide: true })
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
