import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cache } from 'react'
import { markdownToRichText } from './markdown'

export const readAIIntegrationService = cache(async () => {
  const copy = await readFile(join(process.cwd(), 'src/content/services/ai-integration.md'), 'utf8')
  const match = /^# (.+)\r?\n([\s\S]*)$/m.exec(copy)
  if (!match) throw new Error('The AI integration service needs a page heading.')

  return {
    id: 'ai-integration',
    slug: 'ai-integration',
    title: match[1],
    category: 'AI Systems & Integration',
    summary: 'Add AI search, in-app assistants, document processing, or natural-language queries to your existing software.',
    body: markdownToRichText(match[2]),
    detailsReviewed: true,
    meta: {
      title: 'AI Integration Services | Shibly Mohammad Noman',
      description: 'Work directly with a freelance developer to add AI search, in-app assistants, document processing, or natural-language queries to your existing software.',
    },
  }
})
