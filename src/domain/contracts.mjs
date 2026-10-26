export const COLLECTIONS = ['pages', 'services', 'posts', 'projects', 'media', 'users', 'inquiries', 'redirects']
export const PAGE_KEYS = ['home', 'about', 'contact', 'blog', 'services', 'calculator']
export const RESERVED_SLUGS = new Set(['admin', 'api', 'about', 'contact', 'blog', 'services', 'tools', 'media', 'preview', 'robots', 'sitemap'])
export const SECTION_ANCHORS = {
  home: ['about-brief', 'services', 'selected-work', 'process', 'faqs', 'lets-talk'],
  about: ['purpose', 'experience', 'benefits', 'interests', 'lets-talk'],
  contact: ['next-steps', 'inquiry', 'booking'],
}
export const EXISTING_ROUTES = [
  { key: 'home', path: '/', source: 'src/content/approved.json#home' },
  { key: 'about', path: '/about/', source: 'src/content/approved.json#about' },
  { key: 'contact', path: '/contact/', source: 'src/content/approved.json#contact' },
  { key: 'blog', path: '/blog/', source: 'src/blog.tsx' },
  { key: 'calculator', path: '/tools/mvp-cost-calculator/', source: 'src/mvp-calculator.tsx' },
]

export function slugify(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
export function validateSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 120 && !RESERVED_SLUGS.has(value)
    ? true : 'Use a unique address with lowercase letters, numbers, and hyphens; system addresses are reserved.'
}
export function validateFragment(value) {
  return !value || (typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value)) ? true : 'Use a section name such as process, without spaces or #.'
}
export function validateDestination(value, { contact = false } = {}) {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u0020\\]/.test(value)) return 'Enter a valid link without spaces or control characters.'
  if (value.startsWith('/') && !value.startsWith('//')) return true
  if (value.startsWith('#')) return validateFragment(value.slice(1)) === true && value.length > 1 ? true : 'Choose a valid section.'
  try {
    const url = new URL(value)
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return true
    if (contact && ['mailto:', 'tel:'].includes(url.protocol) && url.pathname) return true
  } catch { /* Return the same friendly validation message. */ }
  return 'Choose a page or enter a valid https website address.'
}
export function validateRedirect(from, to) {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || /[?#\\\s]/.test(from)) return 'The old address must be a local path without query parameters.'
  const first = from.split('/').filter(Boolean)[0]
  if (['admin', 'api', 'media', 'preview', 'robots.txt', 'sitemap.xml'].includes(first)) return 'System addresses cannot be redirected.'
  if (validateDestination(to) !== true || to.startsWith('#')) return 'Choose a valid replacement page address.'
  if (from.replace(/\/$/, '') === to.split(/[?#]/)[0].replace(/\/$/, '')) return 'A redirect must lead to a different address.'
  return true
}
export function roleOf(user) {
  return user?.collection === 'users' && ['admin', 'editor'].includes(user.role) ? user.role : null
}
export const isAdmin = user => roleOf(user) === 'admin'
export const isEditor = user => roleOf(user) !== null
export function publicationChangeAllowed({ user, data = {}, originalDoc, draft = false }) {
  if (isAdmin(user)) return true
  if (!isEditor(user) || data._status === 'published') return false
  // Editors can revise a published document only through Payload's draft path.
  if (originalDoc?._status === 'published' && !draft) return false
  return true
}

export function splitSections(text, level = 3) {
  const parts = text.split(new RegExp(`^${'#'.repeat(level)} `, 'm'))
  const intro = parts.shift()?.trim() || ''
  return { intro, items: parts.map(part => {
    const newline = part.indexOf('\n')
    return { title: newline < 0 ? part.trim() : part.slice(0, newline).trim(), body: newline < 0 ? '' : part.slice(newline + 1).trim() }
  }) }
}

export function contentPath(collection, doc) {
  if (!doc || typeof doc !== 'object') return undefined
  if (collection === 'pages') return { home: '/', about: '/about/', contact: '/contact/', blog: '/blog/', services: '/services/', calculator: '/tools/mvp-cost-calculator/' }[doc.pageKey]
  if (validateSlug(doc.slug) !== true) return undefined
  return { services: '/services/', posts: '/blog/' }[collection] && `/${collection === 'posts' ? 'blog' : collection}/${doc.slug}/`
}
