import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cache } from 'react'
import { markdownToRichText } from './markdown'

async function readServiceCopy(slug: string) {
  const copy = await readFile(join(process.cwd(), 'src', 'content', 'services', slug + '.md'), 'utf8')
  const match = /^# (.+)\r?\n([\s\S]*)$/.exec(copy)
  if (!match) throw new Error(`The ${slug} service needs a page heading.`)
  return { title: match[1], body: markdownToRichText(match[2]) }
}

export const readAIIntegrationService = cache(async () => {
  const slug = 'ai-integration'
  return {
    id: slug,
    slug,
    ...await readServiceCopy(slug),
    category: 'AI Systems & Integration',
    summary: 'Add AI search, in-app assistants, document processing, or natural-language queries to your existing software.',
    detailsReviewed: true,
    meta: {
      title: 'AI Integration Services | Shibly Mohammad Noman',
      description: 'Work directly with a freelance developer to add AI search, in-app assistants, document processing, or natural-language queries to your existing software.',
    },
  }
})

export const readAIWorkflowAutomationDraft = cache(async () => {
  const slug = 'ai-workflow-automation'
  const summary = 'Connect your existing tools and automate lead routing, inbox triage, approvals, and reporting with AI.'
  return {
    id: slug,
    slug,
    ...await readServiceCopy(slug),
    category: 'AI Systems & Integration',
    summary,
    detailsReviewed: false,
    meta: {
      title: 'AI Workflow Automation Services | Shibly Mohammad Noman',
      description: summary,
      hideFromSearch: true,
    },
  }
})
