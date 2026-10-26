import { cache } from 'react'
import type { DefaultServerCellComponentProps, Payload } from 'payload'
import { contentPath } from '../domain/contracts.mjs'
import { ContentRowActions } from './ContentRowActions'

type PageCollection = 'pages' | 'services' | 'posts'

// View uses the published address, even when a newer draft has a different slug.
const publishedPaths = cache(async (payload: Payload, collection: PageCollection) => {
  const result = await payload.find({
    collection, draft: false, depth: 0, pagination: false,
    overrideAccess: false, where: { _status: { equals: 'published' } },
    select: { slug: true, pageKey: true },
  })
  return new Map(result.docs.map(doc => [String(doc.id), contentPath(collection, doc)]))
})

export async function ContentTitleCell({ payload, collectionSlug, rowData, cellData, link, linkURL, columnIndex }: DefaultServerCellComponentProps) {
  const paths = await publishedPaths(payload, collectionSlug as PageCollection)
  return <ContentRowActions collectionSlug={collectionSlug} rowData={rowData}
    title={String(cellData || 'Untitled')} publishedPath={paths.get(String(rowData.id))}
    link={link} linkURL={linkURL} columnIndex={columnIndex} />
}
