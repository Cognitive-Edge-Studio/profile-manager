import { contentPath, slugify, validateDestination } from './contracts.mjs'

export function siteOrigin(env = process.env) {
  const value = env.SITE_URL || env.CMS_SERVER_URL || env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an http(s) origin without a path, credentials, query, or fragment.')
  if (env.CMS_ENV === 'production' && (!env.SITE_URL || url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Production requires an explicit HTTPS SITE_URL.')
  return url.origin
}
export const deploymentIndexing = (env = process.env) => env.CMS_ENV === 'production' && env.PUBLIC_INDEXING_ENABLED === 'true'
export function robotsData(env = process.env) { return deploymentIndexing(env) ? { rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/preview'] }, sitemap: siteOrigin(env) + '/sitemap.xml' } : { rules: { userAgent: '*', disallow: '/' } } }
export const plainText = node => typeof node?.text === 'string' ? node.text : (node?.root?.children || node?.children || []).map(plainText).join(' ')
export const identifier = value => typeof value === 'object' ? value?.id : value
export const sameID = (a, b) => String(identifier(a)) === String(identifier(b))
export function canonicalValidation(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash || validateDestination(value) !== true) return 'Use a complete http(s) address without credentials or a #fragment.'
    if (/^\/(?:admin|api|preview|_next)(?:\/|$)/i.test(url.pathname)) return 'Admin, API, and private preview addresses cannot be canonical pages.'
    return true
  } catch { return 'Enter a complete https address.' }
}
export function effectiveSEO(site, collection, doc, { filtered = false, env = process.env } = {}) {
  const settings = site.settings || {}, own = doc?.meta || {}, defaults = settings.meta || {}
  const path = contentPath(collection, doc)
  const origin = siteOrigin(env), normal = path ? new URL(path, origin).href : origin + '/'
  const canonical = own.canonicalURL || (collection === 'pages' && doc?.pageKey === 'home' ? defaults.canonicalURL : undefined) || normal
  const title = own.title || (collection === 'pages' && doc?.pageKey === 'home' ? defaults.title : undefined) || doc?.heading || doc?.title || defaults.title || settings.name || 'Website'
  const description = own.description || defaults.description || undefined
  const imageID = own.image || defaults.image
  const image = site.media?.find(item => sameID(item.id, imageID))
  const social = image?.social || image
  const images = social?.url ? [{ url: new URL(social.url, origin).href, width: social.width || undefined, height: social.height || undefined, alt: image.decorative ? '' : image.alt || '' }] : []
  const indexable = !site.preview && deploymentIndexing(env) && !own.hideFromSearch && !defaults.hideFromSearch && !filtered
  const indexingReason = site.preview ? 'Private previews are always noindex.' : !deploymentIndexing(env) ? 'This deployment is not an indexing-enabled production site.' : own.hideFromSearch ? 'This page is marked noindex.' : defaults.hideFromSearch ? 'Site settings mark the website noindex.' : filtered ? 'Filtered blog results are noindex; their canonical is the main blog page.' : 'Indexing is allowed for this published page.'
  return { path, origin, canonical, normal, indexable, indexingReason, title, description, socialTitle: own.socialTitle || own.title || defaults.socialTitle || title, socialDescription: own.socialDescription || own.description || defaults.socialDescription || description, images, structuredData: own.structuredData !== false && defaults.structuredData !== false }
}
export function pageMetadata(site, collection, doc, options) {
  const seo = effectiveSEO(site, collection, doc, options)
  const isArticle = collection === 'posts'
  return {
    title: seo.title, description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: { index: seo.indexable, follow: !site.preview, googleBot: { index: seo.indexable, follow: !site.preview } },
    openGraph: { type: isArticle ? 'article' : 'website', url: seo.canonical, title: seo.socialTitle, description: seo.socialDescription, siteName: site.settings?.name || undefined, images: seo.images, ...(isArticle && doc.publishedAt ? { publishedTime: doc.publishedAt } : {}) },
    twitter: { card: seo.images.length ? 'summary_large_image' : 'summary', title: seo.socialTitle, description: seo.socialDescription, images: seo.images.map(image => image.url) },
  }
}
export function sitemapEntries(site, redirectSources = [], env = process.env) {
  if (!site.settings) return []
  const records = [...site.pages.map(doc => ({ collection: 'pages', doc })), ...site.posts.map(doc => ({ collection: 'posts', doc })), ...site.services.filter(doc => doc.detailsReviewed && plainText(doc.body).trim()).map(doc => ({ collection: 'services', doc }))]
  return records.flatMap(({ collection, doc }) => {
    const seo = effectiveSEO(site, collection, doc, { env })
    return seo.indexable && seo.canonical === seo.normal && !redirectSources.includes(seo.path) ? [{ url: seo.canonical, ...(doc.updatedAt ? { lastModified: doc.updatedAt } : {}) }] : []
  })
}
export function headingAnchors(body) {
  const result = [], seen = new Map()
  const walk = node => {
    if (node?.type === 'heading') {
      const base = 'heading-' + (slugify(plainText(node)) || 'section')
      const count = (seen.get(base) || 0) + 1; seen.set(base, count)
      result.push(count === 1 ? base : `${base}-${count}`)
    }
    for (const child of node?.children || node?.root?.children || []) walk(child)
  }
  walk(body); return result
}
export function articleContents(body) {
  const ids = headingAnchors(body), headings = []
  let index = 0
  const walk = node => {
    if (node?.type === 'heading') {
      const id = ids[index++], title = plainText(node).trim()
      if (title) headings.push({ id, title, level: ['h2', 'h3', 'h4'].includes(node.tag) ? Number(node.tag.slice(1)) : 2 })
    }
    for (const child of node?.children || node?.root?.children || []) walk(child)
  }
  walk(body)
  // Keep section hierarchy and useful steps, without listing deeper H4 detail.
  const level = Math.min(...headings.map(heading => heading.level))
  const contents = []
  for (const heading of headings.filter(heading => heading.level <= level + 1)) {
    const entry = { id: heading.id, title: heading.title, children: [] }
    if (heading.level === level || !contents.length) contents.push(entry)
    else contents[contents.length - 1].children.push(entry)
  }
  return contents
}
export function anchorsFor(collection, doc) {
  const anchors = ['main-content']
  if (collection === 'pages') {
    if (doc.pageKey === 'blog') anchors.push('articles-heading', 'featured-heading')
    else if (doc.pageKey === 'calculator') anchors.push('planner', 'how-it-works', 'calculator-reading-title')
    else anchors.push(...(doc.sections || []).map(section => section.sectionId).filter(Boolean))
  } else if (collection === 'posts' || collection === 'services') {
    anchors.push(...headingAnchors(doc.body))
    if (collection === 'services') anchors.push('details', ...(doc.benefits?.length ? ['benefits'] : []), ...(doc.process?.length ? ['process'] : []), ...(doc.faqs?.length ? ['faqs'] : []))
  }
  return new Set(anchors)
}
export function structuredData(site, collection, doc, options) {
  const seo = effectiveSEO(site, collection, doc, options)
  if (!seo.structuredData || !doc || !site.settings) return undefined
  const settings = site.settings, personID = seo.origin + '/#person'
  const profile = { '@type': 'Person', '@id': personID, name: settings.name, jobTitle: settings.role, sameAs: [settings.github, settings.linkedin].filter(Boolean) }
  const home = site.pages.find(page => page.pageKey === 'home'), about = site.pages.find(page => page.pageKey === 'about')
  const personPage = about || home
  if (personPage) profile.url = new URL(contentPath('pages', personPage), seo.origin).href
  const entity = { '@id': seo.canonical + '#content', url: seo.canonical, name: doc.heading || doc.title, ...(seo.description ? { description: seo.description } : {}) }
  if (collection === 'services') Object.assign(entity, { '@type': 'Service', name: doc.title, description: doc.summary, serviceType: doc.category, provider: { '@id': personID } })
  else if (collection === 'posts') Object.assign(entity, { '@type': 'BlogPosting', headline: doc.title, description: doc.excerpt, author: { '@id': personID }, ...(doc.publishedAt ? { datePublished: doc.publishedAt } : {}), ...(seo.images.length ? { image: seo.images.map(image => image.url) } : {}) })
  else Object.assign(entity, { '@type': doc.pageKey === 'about' ? 'AboutPage' : doc.pageKey === 'contact' ? 'ContactPage' : ['blog', 'services'].includes(doc.pageKey) ? 'CollectionPage' : 'WebPage', about: { '@id': personID } })
  const graph = [profile, entity]
  if (collection === 'pages' && doc.pageKey === 'home') graph.push({ '@type': 'WebSite', '@id': seo.origin + '/#website', url: seo.canonical, name: settings.name })
  const parents = []
  if (home && !(collection === 'pages' && doc.pageKey === 'home')) parents.push({ name: home.title, url: seo.origin + '/' })
  const sectionKey = collection === 'services' ? 'services' : collection === 'posts' ? 'blog' : undefined
  const parent = site.pages.find(page => page.pageKey === sectionKey)
  if (parent) parents.push({ name: parent.heading || parent.title, url: new URL(contentPath('pages', parent), seo.origin).href })
  if (parents.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: [...parents, { name: doc.heading || doc.title, url: seo.canonical }].map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.name, item: entry.url })) })
  return { '@context': 'https://schema.org', '@graph': graph }
}
export const safeJSON = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
