import { createHash } from 'node:crypto'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, relative } from 'node:path'
import { EXISTING_ROUTES, SECTION_ANCHORS, slugify, splitSections } from '../src/domain/contracts.mjs'

export const websiteRoot = fileURLToPath(new URL('../', import.meta.url))
const hash = value => createHash('sha256').update(value).digest('hex')
const read = path => readFile(resolve(websiteRoot, path), 'utf8')

export async function inventory() {
  const approved = JSON.parse(await read('src/content/approved.json'))
  const posts = JSON.parse(await read('src/content/blog.json'))
  const sourcePaths = ['src/content/approved.json', 'src/content/approved.ts', 'src/content/blog.json', 'src/lib/mvp-budget.ts', 'src/website/styles/base.css', 'src/website/styles/design-system.css', 'src/website/styles/blog.css', 'src/website/styles/calculator.css']
  const sourceFiles = await Promise.all(sourcePaths.map(async path => ({ path, sha256: hash(await read(path)) })))
  const files = await readdir(resolve(websiteRoot, 'public/images'), { recursive: true, withFileTypes: true })
  const assets = await Promise.all(files.filter(entry => entry.isFile()).map(async entry => {
    const absolute = resolve(entry.parentPath, entry.name)
    const bytes = await readFile(absolute)
    return { path: relative(websiteRoot, absolute).replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) }
  }))
  const pages = Object.entries(approved).map(([pageKey, page]) => ({
    sourceId: `approved:${pageKey}`, pageKey, path: EXISTING_ROUTES.find(route => route.key === pageKey)?.path,
    _status: 'draft', introSha256: hash(page.intro),
    sections: page.sections.map((section, index) => ({ sourceId: `approved:${pageKey}:section:${index}`, title: section.title, sectionId: SECTION_ANCHORS[pageKey][index], bodySha256: hash(section.body), sourceIndex: index })),
  }))
  const serviceGroups = splitSections(approved.home.sections[1].body.split(/^\*\*[^\n]+\*\* →/m)[0]).items
  const services = serviceGroups.flatMap(group => splitSections(group.body, 4).items.map(service => ({
    sourceId: `service:${slugify(service.title)}`, title: service.title, slug: slugify(service.title), category: group.title,
    summarySha256: hash(service.body), _status: 'draft',
    missingForDetailPage: ['Reviewed service detail content', 'Page-specific SEO review'],
  })))
  const projects = splitSections(approved.home.sections[2].body).items.map(project => ({ sourceId: `project:${slugify(project.title)}`, title: project.title, slug: slugify(project.title), bodySha256: hash(project.body), _status: 'draft' }))
  return {
    contractVersion: 2,
    sourceFiles,
    routes: [...EXISTING_ROUTES, ...posts.map(post => ({ key: `post:${post.slug}`, path: `/blog/${post.slug}/`, source: `src/content/blog.json#${post.slug}` }))],
    plannedRoutes: ['/services/', '/services/[slug]/', '/admin/', '/api/contact', '/preview', '/sitemap.xml', '/robots.txt'],
    pages, services, projects,
    posts: posts.map(post => ({ sourceId: `post:${post.slug}`, slug: post.slug, title: post.title, excerptSha256: hash(post.excerpt), bodySha256: hash(post.body), metaTitle: post.metaTitle, metaDescription: post.metaDescription, category: post.category, illustrationKind: post.kind, _status: 'draft', publishedAt: null })),
    assets: assets.sort((a, b) => a.path.localeCompare(b.path)),
    constraints: ['No publication dates inferred from local previews.', 'Import preserves approved strings exactly.', 'Source manuscripts remain retained.', 'Calculator inputs never enter CMS storage.', 'Website copy is managed through CMS fields; retained source content is used only by local import and verification tools.'],
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await inventory()
  const destination = resolve(websiteRoot, 'migration/source-inventory.json')
  if (process.argv.includes('--check')) {
    const existing = JSON.parse(await readFile(destination, 'utf8'))
    if (JSON.stringify(existing) !== JSON.stringify(result)) throw new Error('The source baseline changed. Review the content changes before regenerating the inventory.')
    console.log('Source baseline matches: approved pages, services, projects, articles, assets, and calculator.')
  } else {
    await mkdir(resolve(destination, '..'), { recursive: true })
    await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`)
    console.log(`Recorded ${result.pages.length} approved pages, ${result.services.length} services, ${result.projects.length} project mentions, ${result.posts.length} articles, and ${result.assets.length} assets.`)
  }
}
