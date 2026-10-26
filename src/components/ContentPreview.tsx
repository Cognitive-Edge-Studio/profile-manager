import { RichText, LinkJSXConverter, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { contentPath } from '../domain/contracts.mjs'

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: ({ linkNode }) => {
    const reference = linkNode.fields.doc
    if (reference && typeof reference.value === 'object') return contentPath(reference.relationTo, reference.value) || '#'
    return '#'
  } }),
})

export function ContentPreview({ doc }: { doc: any }) {
  return <article>
    <h1>{doc.heading || doc.title}</h1>
    {doc.summary && <p>{doc.summary}</p>}
    {doc.excerpt && <p>{doc.excerpt}</p>}
    {doc.introduction && <RichText data={doc.introduction} converters={converters} />}
    {doc.body && <RichText data={doc.body} converters={converters} />}
    {doc.sections?.map((section: any, index: number) => <section key={section.id || index} id={section.sectionId}>
      <h2>{section.heading}</h2>{section.body && <RichText data={section.body} converters={converters} />}
    </section>)}
  </article>
}
