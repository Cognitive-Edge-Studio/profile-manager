// Keep original manuscripts intact while formatting editable display fields.
export function cleanTitleDots(value, heading = false) {
  if (Array.isArray(value)) return value.map(item => cleanTitleDots(item, heading))
  if (!value || typeof value !== 'object') return value
  const inHeading = heading || value.type === 'heading'
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (['sourceSnapshot', 'sourceId', 'editorialNotes'].includes(key)) return [key, entry]
    if (typeof entry === 'string' && (['title', 'heading', 'socialTitle'].includes(key) || (inHeading && key === 'text'))) return [key, entry.replace(/\./g, '')]
    return [key, cleanTitleDots(entry, inHeading)]
  }))
}

export function ownerLinkDestination(url) {
  if (typeof url !== 'string' || (!url.startsWith('/') && !url.startsWith('#')) || url.startsWith('//')) return undefined
  const parsed = new URL(url, 'https://website.invalid')
  if (/^\/services(?:\/|$)/.test(parsed.pathname) || (parsed.pathname === '/' && parsed.hash === '#services')) return '/#services'
  if (/^\/(?:contact|inquiry|inquiries|query)(?:\/|$)/.test(parsed.pathname) || (parsed.pathname === '/' && ['#lets-talk', '#contact', '#inquiry', '#query'].includes(parsed.hash))) return '/contact/'
}

export function normalizeOwnerLinks(value, homeID, contactID) {
  if (Array.isArray(value)) return value.map(item => normalizeOwnerLinks(item, homeID, contactID))
  if (!value || typeof value !== 'object') return value
  const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, ['sourceSnapshot', 'sourceId', 'editorialNotes'].includes(key) ? entry : normalizeOwnerLinks(entry, homeID, contactID)]))
  const lexical = ['link', 'autolink'].includes(value.type)
  const action = typeof value.kind === 'string' && typeof value.label === 'string'
  if (!lexical && !action) return result
  const fields = lexical ? result.fields || { url: result.url } : result
  const reference = fields.page || fields.doc
  const referenceID = typeof reference?.value === 'object' ? reference.value?.id : reference?.value
  let destination = ownerLinkDestination(fields.url)
  if (reference?.relationTo === 'pages' && String(referenceID) === String(homeID)) {
    if (fields.fragment === 'services') destination = '/#services'
    if (['lets-talk', 'contact', 'inquiry', 'query'].includes(fields.fragment)) destination = '/contact/'
  }
  if (!destination) return result
  const page = { relationTo: 'pages', value: destination === '/#services' ? homeID : contactID }
  const normalized = { ...fields, url: null, fragment: destination === '/#services' ? 'services' : null, newTab: false,
    ...(lexical ? { linkType: 'internal', doc: page } : { kind: 'internal', page }) }
  return lexical ? { ...result, fields: normalized } : normalized
}

export function normalizeImportedEditorial(value) {
  const walk = item => {
    if (Array.isArray(item)) return item.map(walk)
    if (!item || typeof item !== 'object') return item
    const result = Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, ['sourceSnapshot', 'sourceId'].includes(key) ? entry : walk(entry)]))
    if (['link', 'autolink'].includes(item.type) && result.fields?.url) result.fields.url = ownerLinkDestination(result.fields.url) || result.fields.url
    return result
  }
  return walk(cleanTitleDots(value))
}
