import { getPayload } from 'payload'
import { contactMaintenance } from '../src/contact-notifications'

const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const watch = process.argv.includes('--watch')
let running = true
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { running = false })
try {
  do {
    try { console.log('Contact maintenance:', await contactMaintenance(payload)) } catch { console.error('Contact maintenance failed; stored inquiries remain available for retry.'); if (!watch) process.exitCode = 1 }
    if (watch && running) await new Promise(resolve => setTimeout(resolve, 60_000))
  } while (watch && running)
} finally { await payload.destroy() }
process.exit(process.exitCode || 0)
