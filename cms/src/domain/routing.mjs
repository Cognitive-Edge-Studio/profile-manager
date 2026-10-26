import { validateDestination } from './contracts.mjs'
export const normalizePath = path => path === '/' ? '/' : /\.[a-z0-9]+$/i.test(path.replace(/\/$/, '')) ? path.replace(/\/$/, '') : path.replace(/\/+$/, '') + '/'
export const fixedPaths = new Set(['/', '/about/', '/contact/', '/blog/', '/services/', '/tools/mvp-cost-calculator/'])
export function pathProblem(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[?#\\\s]/.test(path)) return 'Use a local path without a query, fragment, spaces, or backslashes.'
  try {
    const decoded = decodeURIComponent(path)
    if (/[\u0000-\u0020\\?#]/.test(decoded) || decoded.startsWith('//') || decoded.includes('//') || decoded.split('/').some(part => part === '.' || part === '..')) return 'Use a plain local path without encoded separators or dot segments.'
    if (/%2f|%5c|%25/i.test(path)) return 'Encoded separators are not supported in redirect paths.'
    const first = decoded.split('/').filter(Boolean)[0]?.toLowerCase()
    if (['admin', 'api', 'preview', '_next', 'images', 'media', 'robots.txt', 'sitemap.xml', 'favicon.ico'].includes(first)) return 'System and asset addresses cannot be redirected.'
  } catch { return 'The path contains invalid URL encoding.' }
  return undefined
}
export function localTarget(to, origin) {
  try { const url = new URL(to, origin); return url.origin === new URL(origin).origin ? normalizePath(url.pathname) : undefined } catch { return undefined }
}
export function redirectProblem({ from, to, id }, records, origin) {
  const problem = pathProblem(from)
  if (problem) return problem
  if (fixedPaths.has(normalizePath(from))) return 'Existing website page addresses cannot be redirect sources.'
  if (validateDestination(to) !== true || to.startsWith('#')) return 'Choose a local page address or a complete http(s) destination.'
  const target = localTarget(to, origin)
  if (target && pathProblem(new URL(to, origin).pathname)) return 'The destination cannot be a system, asset, or unsafe path.'
  const source = normalizePath(from)
  if (target === source) return 'A redirect must lead to a different address.'
  const others = records.filter(record => String(record.id) !== String(id) && record.enabled !== false)
  if (others.some(record => normalizePath(record.from) === source)) return 'Another redirect already uses this old address.'
  if (target && others.some(record => normalizePath(record.from) === target)) return 'Choose the final destination directly; redirect chains and loops are not allowed.'
  if (others.some(record => localTarget(record.to, origin) === source)) return 'Another redirect points to this old address. Update it to the final destination first.'
  return undefined
}
