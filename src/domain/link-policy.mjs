// Article policy applies to web destinations outside the configured website.
export function articleLinkRel(href, rel = '', origin) {
  let external = false
  try {
    const url = new URL(href, origin)
    external = ['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(origin).origin
  } catch { /* URL validation is handled by the link resolver. */ }
  return [...new Set([...rel.split(/\s+/).filter(Boolean), ...(external ? ['nofollow'] : [])])].join(' ')
}
