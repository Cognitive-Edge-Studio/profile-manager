import type { Field } from 'payload'
import { isEditor, validateDestination, validateFragment } from './domain/contracts.mjs'
import { canonicalValidation } from './domain/seo.mjs'

export const sourceFields: Field[] = [
  { name: 'sourceId', type: 'text', unique: true, index: true, admin: { hidden: true }, access: { read: ({ req }) => isEditor(req.user), update: () => false } },
  { name: 'sourceSnapshot', type: 'json', admin: { hidden: true }, access: { read: ({ req }) => isEditor(req.user), update: () => false } },
]

export const linkFields = (): Field[] => [
  { name: 'label', label: 'Clickable text', type: 'text', required: true },
  { name: 'kind', type: 'select', defaultValue: 'internal', required: true, options: [{ label: 'A page on this website', value: 'internal' }, { label: 'Another website', value: 'external' }, { label: 'Email or phone', value: 'contact' }] },
  { name: 'page', type: 'relationship', relationTo: ['pages', 'services', 'posts'], admin: { condition: (_, data) => data.kind === 'internal' }, validate: (value: unknown, { siblingData }: any) => siblingData.kind !== 'internal' || Boolean(value) || 'Choose a page.' },
  { name: 'url', label: 'Destination address', type: 'text', admin: { condition: (_, data) => data.kind !== 'internal' }, validate: (value: unknown, { siblingData }: any) => siblingData.kind === 'internal' ? true : validateDestination(value, { contact: siblingData.kind === 'contact' }) },
  { name: 'fragment', label: 'Section anchor (optional)', type: 'text', validate: (value: unknown) => validateFragment(value), admin: { description: 'For example process, without the # character.' } },
  { name: 'newTab', label: 'Open in a new tab', type: 'checkbox', defaultValue: false },
  { name: 'requiredForPublishing', label: 'This link must be available before publishing', type: 'checkbox', defaultValue: false, admin: { description: 'Unavailable optional links are omitted. Navigation links are always checked before publishing site settings.' } },
  { name: 'relationship', label: 'Link type', type: 'select', defaultValue: 'normal', options: [{ label: 'Normal link', value: 'normal' }, { label: 'Sponsored / paid link', value: 'sponsored' }, { label: 'Do not endorse this destination (nofollow)', value: 'nofollow' }], admin: { condition: (_, data) => data.kind === 'external' } },
]

export const linksTab = { label: 'Links', fields: [
  { name: 'actions', label: 'Buttons and calls to action', type: 'array' as const, maxRows: 4, fields: linkFields() },
  { name: 'related', label: 'Related content', type: 'relationship' as const, relationTo: ['services', 'posts', 'projects'], hasMany: true },
] }

export const advancedSEOFields: Field[] = [
  { name: 'socialTitle', label: 'Social sharing title (optional)', type: 'text' },
  { name: 'socialDescription', label: 'Social sharing description (optional)', type: 'textarea' },
  { name: 'hideFromSearch', label: 'Ask search engines to keep this page out of search results', type: 'checkbox', defaultValue: false, admin: { description: 'The published page stays accessible by its link. This is not a privacy setting.' } },
  { name: 'canonicalURL', label: 'Canonical address', type: 'text', validate: (value: unknown) => canonicalValidation(value), admin: { description: 'Normally leave blank: the website uses this page’s published address. An override is excluded from the sitemap unless it matches this page.' } },
  { name: 'structuredData', label: 'Include structured data from this content', type: 'checkbox', defaultValue: true, admin: { description: 'Uses your visible profile, article, service, and breadcrumb facts. No ratings or publication dates are invented.' } },
]

export const publishingTab = { label: 'Publishing', fields: [
  { name: 'readiness', type: 'ui' as const, admin: { components: { Field: '/src/components/PublishingChecks#PublishingChecks' } } },
  { name: 'editorialNotes', label: 'Private editorial notes', type: 'textarea' as const, access: { read: ({ req }: any) => isEditor(req.user) }, admin: { description: 'These notes are not part of the public page.' } },
] }

export const sectionsField: Field = {
  name: 'sections', label: 'Page sections', type: 'array', maxRows: 20,
  fields: [
    { name: 'sourceId', type: 'text', admin: { hidden: true }, access: { update: () => false } },
    { name: 'template', label: 'Section layout', type: 'select', required: true, defaultValue: 'copy', options: ['copy', 'services', 'projects', 'process', 'faqs', 'contact', 'technology', 'interests', 'purpose', 'benefits', 'cta'] },
    { name: 'eyebrow', label: 'Small section label', type: 'text' },
    { name: 'sectionId', label: 'Section anchor', type: 'text', validate: (value: unknown) => validateFragment(value), admin: { description: 'A stable name such as process; links can point directly here.' } },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', label: 'Content', type: 'richText', admin: { description: 'For homepage Services, use Heading 3 for each category and Heading 4 for each service card. For process, FAQ, benefit, or interest cards, start each item with Heading 3.' } },
    { name: 'note', label: 'Supporting note', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'imageAlt', label: 'Image description for this use', type: 'text' },
    { name: 'actions', type: 'array', maxRows: 3, fields: linkFields() },
  ],
}
