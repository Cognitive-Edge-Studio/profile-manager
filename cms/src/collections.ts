import { APIError, type CollectionConfig, type Field } from 'payload'
import { administrators, contentAccess, editors, never, ownAccountOrAdmin, protectPublishing, recordDraftOperation } from './access'
import { advancedSEOFields, linksTab, publishingTab, sectionsField, sourceFields } from './fields'
import { isAdmin, isEditor, validateDestination, validateRedirect, validateSlug } from './domain/contracts.mjs'
import { enforcePublication, protectReferencedDelete, protectRemoval } from './publishing'
import { movePublishedSlug, validateRedirectRecord, removeManagedRedirects } from './redirects'

const versions = { drafts: true, maxPerDoc: 30 }
const ordering: Field = { name: 'displayOrder', label: 'Display order', type: 'number', defaultValue: 0 }
const slug: Field = { name: 'slug', label: 'Page address', type: 'text', required: true, unique: true, index: true, validate: (value: unknown) => validateSlug(value), admin: { description: 'Lowercase words separated by hyphens. Publishing a changed service or article address automatically creates a redirect.' } }
const title: Field = { name: 'title', type: 'text', required: true }
const pageTitle: Field = { ...title, admin: { components: { Cell: '/src/components/ContentTitleCell#ContentTitleCell' } } }
const preview = (collection: string) => (data: Record<string, any>) => data.id ? `/preview?collection=${collection}&id=${data.id}` : null

export const Users: CollectionConfig = {
  slug: 'users', labels: { singular: 'Team member', plural: 'Team members' },
  auth: { maxLoginAttempts: 5, lockTime: 600_000, tokenExpiration: 7200, cookies: { sameSite: 'Lax', secure: ['staging', 'production'].includes(process.env.CMS_ENV || '') } },
  admin: { useAsTitle: 'email', group: 'Administration' },
  access: { create: administrators, read: ownAccountOrAdmin, update: ownAccountOrAdmin, delete: administrators, admin: ({ req }) => isEditor(req.user) },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'select', required: true, defaultValue: 'editor', options: [{ label: 'Administrator', value: 'admin' }, { label: 'Content editor', value: 'editor' }], saveToJWT: true, access: { create: ({ req }) => isAdmin(req.user) || req.context.localBootstrap === true, update: ({ req }) => isAdmin(req.user) } },
  ],
  hooks: {
    beforeChange: [async ({ data, originalDoc, req, operation }) => {
      if (operation === 'create' && !isAdmin(req.user) && req.context.localBootstrap !== true) throw new APIError('Public account creation is disabled. Ask the administrator to create your account.', 403)
      if (originalDoc?.role === 'admin' && data.role && data.role !== 'admin') {
        const admins = await req.payload.count({ collection: 'users', where: { role: { equals: 'admin' } }, overrideAccess: true, req })
        if (admins.totalDocs <= 1) throw new APIError('Keep at least one administrator account.', 400)
      }
      return data
    }],
    beforeDelete: [async ({ id, req }) => {
      const user = await req.payload.findByID({ collection: 'users', id, overrideAccess: true, req })
      if (user.role === 'admin') {
        const admins = await req.payload.count({ collection: 'users', where: { role: { equals: 'admin' } }, overrideAccess: true, req })
        if (admins.totalDocs <= 1) throw new APIError('Keep at least one administrator account.', 400)
      }
    }],
  },
}

export const Pages: CollectionConfig = {
  slug: 'pages', admin: { useAsTitle: 'title', group: 'Website', defaultColumns: ['title', 'pageKey', '_status', 'updatedAt'], preview: preview('pages') },
  access: contentAccess, versions, hooks: { beforeOperation: [recordDraftOperation], beforeChange: [protectPublishing, enforcePublication], beforeDelete: [protectReferencedDelete], beforeValidate: [({ data }) => {
    const ids = (data?.sections || []).map((section: any) => section.sectionId).filter(Boolean)
    if (new Set(ids).size !== ids.length) throw new APIError('Each section anchor must be unique within a page.', 400)
    return data
  }] },
  fields: [...sourceFields, { type: 'tabs', tabs: [
    { label: 'Content', fields: [pageTitle, { name: 'pageKey', label: 'Website page', type: 'select', required: true, unique: true, options: ['home', 'about', 'contact', 'blog', 'services', 'calculator'], access: { update: ({ req }) => isAdmin(req.user) } }, { name: 'heading', label: 'Main page heading', type: 'text', required: true }, { name: 'eyebrow', label: 'Small heading label', type: 'text' }, { name: 'introduction', type: 'richText' }, { name: 'tools', label: 'Tools shown below the introduction', type: 'array', fields: [{ name: 'name', type: 'text', required: true }] }, { name: 'heroImage', type: 'upload', relationTo: 'media' }, sectionsField] },
    linksTab as any, publishingTab,
  ] }],
}

export const Services: CollectionConfig = {
  slug: 'services', admin: { useAsTitle: 'title', group: 'Website', defaultColumns: ['title', 'category', '_status', 'displayOrder'], preview: preview('services') },
  access: contentAccess, versions, hooks: { beforeOperation: [recordDraftOperation], beforeChange: [protectPublishing, enforcePublication, movePublishedSlug], beforeDelete: [protectReferencedDelete, removeManagedRedirects] },
  fields: [...sourceFields, { type: 'tabs', tabs: [
    { label: 'Content', fields: [pageTitle, slug, { name: 'category', type: 'select', required: true, options: ['AI Systems & Integration', 'Application Development', 'Infrastructure & Operations'] }, { name: 'summary', type: 'textarea', required: true }, { name: 'body', label: 'Service details', type: 'richText' }, { name: 'detailsReviewed', label: 'Service detail copy has been reviewed', type: 'checkbox', defaultValue: false }, { name: 'benefits', type: 'array', fields: [{ name: 'text', type: 'text', required: true }] }, { name: 'process', type: 'array', fields: [{ name: 'heading', type: 'text', required: true }, { name: 'body', type: 'textarea' }] }, { name: 'faqs', type: 'array', fields: [{ name: 'question', type: 'text', required: true }, { name: 'answer', type: 'richText', required: true }] }, { name: 'heroImage', type: 'upload', relationTo: 'media' }, ordering] }, linksTab as any, publishingTab,
  ] }],
}

export const Posts: CollectionConfig = {
  slug: 'posts', labels: { singular: 'Article', plural: 'Articles' }, admin: { useAsTitle: 'title', group: 'Website', defaultColumns: ['title', 'category', '_status', 'publishedAt'], preview: preview('posts') },
  access: contentAccess, versions, hooks: { beforeOperation: [recordDraftOperation], beforeChange: [protectPublishing, enforcePublication, movePublishedSlug], beforeDelete: [protectReferencedDelete, removeManagedRedirects] },
  fields: [...sourceFields, { type: 'tabs', tabs: [
    { label: 'Content', fields: [pageTitle, slug, { name: 'excerpt', label: 'At a glance / article summary', type: 'textarea', required: true }, { name: 'category', type: 'select', required: true, options: ['Planning an MVP', 'Hiring a developer'] }, { name: 'body', label: 'Article content', type: 'richText', required: true }, { name: 'readingMinutes', label: 'Reading time in minutes (optional)', type: 'number', min: 1, max: 120 }, { name: 'illustrationKind', type: 'select', options: ['budget', 'features', 'build', 'prototype', 'hiring'] }, { name: 'heroImage', type: 'upload', relationTo: 'media' }, { name: 'publishedAt', label: 'Publication date (optional)', type: 'date', admin: { description: 'Use a real publication date. Imported previews do not have one.' } }] }, linksTab as any, publishingTab,
  ] }],
}

export const Projects: CollectionConfig = {
  slug: 'projects', labels: { singular: 'Project mention', plural: 'Selected work' }, admin: { useAsTitle: 'title', group: 'Website', preview: preview('projects') },
  access: contentAccess, versions, hooks: { beforeOperation: [recordDraftOperation], beforeChange: [protectPublishing, enforcePublication], beforeDelete: [protectReferencedDelete] },
  fields: [...sourceFields, title, slug, { name: 'body', label: 'Project context and description', type: 'richText', required: true }, { name: 'image', type: 'upload', relationTo: 'media' }, { name: 'verifiedURL', label: 'Verified project link (optional)', type: 'text', validate: (value: unknown) => !value || validateDestination(value) }, ordering, { name: 'readiness', type: 'ui', admin: { components: { Field: '/src/components/PublishingChecks#PublishingChecks' } } }],
}

export const Media: CollectionConfig = {
  slug: 'media', admin: { useAsTitle: 'filename', group: 'Website', description: 'Upload JPG, PNG, WebP, or AVIF images up to 8 MB. Files are private until an administrator makes them public.' },
  access: { create: editors, read: ({ req }) => isEditor(req.user) || { visibility: { equals: 'public' } }, update: editors, delete: administrators },
  upload: { staticDir: 'uploads', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], imageSizes: [{ name: 'thumbnail', width: 400, height: 300, position: 'centre' }, { name: 'card', width: 800 }, { name: 'social', width: 1200, height: 630, position: 'centre' }] },
  hooks: { beforeDelete: [protectReferencedDelete], beforeChange: [async ({ data, originalDoc, req }) => { if (originalDoc?.visibility === 'public' && data.visibility === 'private') await protectRemoval(req.payload, 'media', originalDoc, req); return data }] },
  fields: [
    ...sourceFields,
    { name: 'alt', label: 'Image description', type: 'text', admin: { description: 'Describe what the image adds. A page can override this description for a particular use.' } },
    { name: 'decorative', label: 'This image is only decorative', type: 'checkbox', defaultValue: false },
    { name: 'caption', type: 'textarea' },
    { name: 'references', type: 'ui', admin: { components: { Field: '/src/components/PublishingChecks#PublishingChecks' } } },
    { name: 'visibility', type: 'select', defaultValue: 'private', required: true, options: [{ label: 'Private / drafts only', value: 'private' }, { label: 'Publicly available', value: 'public' }], access: { create: ({ req }) => isAdmin(req.user), update: ({ req }) => isAdmin(req.user) } },
  ],
}

export const Inquiries: CollectionConfig = {
  slug: 'inquiries', admin: { useAsTitle: 'name', group: 'Administration', defaultColumns: ['name', 'email', 'source', 'status', 'notificationStatus', 'createdAt'], description: 'Private visitor inquiries. Marking an inquiry read or replied does not send an email. Deletion removes the stored inquiry permanently.' },
  access: { create: never, read: administrators, update: administrators, delete: administrators },
  fields: [
    { name: 'notificationControls', type: 'ui', admin: { components: { Field: '/src/components/InquiryNotification#InquiryNotification' } } },
    { name: 'name', type: 'text', required: true, maxLength: 120, admin: { readOnly: true }, access: { update: () => false } }, { name: 'email', type: 'email', required: true, admin: { readOnly: true }, access: { update: () => false } },
    { name: 'message', type: 'textarea', required: true, maxLength: 8000, admin: { readOnly: true }, access: { update: () => false } }, { name: 'budget', type: 'text', maxLength: 150, admin: { readOnly: true }, access: { update: () => false } }, { name: 'timeline', type: 'text', maxLength: 150, admin: { readOnly: true }, access: { update: () => false } },
    { name: 'source', label: 'Submitted from', type: 'select', options: ['home', 'contact'], admin: { readOnly: true }, access: { update: () => false } },
    { name: 'status', type: 'select', defaultValue: 'new', required: true, options: ['new', 'read', 'replied'] },
    { name: 'notificationStatus', label: 'Notification status', type: 'select', defaultValue: 'pending', required: true, options: [{ label: 'Pending', value: 'pending' }, { label: 'Processing', value: 'sending' }, { label: 'Email service accepted', value: 'sent' }, { label: 'Failed — inquiry safely stored', value: 'failed' }, { label: 'Captured locally — no email sent', value: 'captured' }, { label: 'Needs delivery review', value: 'review' }], admin: { readOnly: true }, access: { update: () => false } },
    { name: 'notificationAttempts', type: 'number', defaultValue: 0, admin: { readOnly: true }, access: { update: () => false } },
    { name: 'notificationError', label: 'Notification reason', type: 'text', admin: { readOnly: true }, access: { update: () => false } },
    { name: 'nextAttemptAt', label: 'Next automatic attempt', type: 'date', admin: { readOnly: true }, access: { update: () => false } },
    { name: 'notifiedAt', label: 'Email service acceptance / local capture time', type: 'date', admin: { readOnly: true }, access: { update: () => false } },
    { name: 'expiresAt', label: 'Scheduled deletion', type: 'date', index: true, admin: { readOnly: true }, access: { update: () => false } },
    ...(['payloadHash', 'notificationKey', 'notificationProviderId', 'leaseToken'] as const).map(name => ({ name, type: 'text' as const, admin: { hidden: true }, access: { read: () => false, update: () => false } })),
    ...(['leaseUntil', 'firstSendAt'] as const).map(name => ({ name, type: 'date' as const, admin: { hidden: true }, access: { read: () => false, update: () => false } })),
    { name: 'notificationEnvelope', type: 'json', admin: { hidden: true }, access: { read: () => false, update: () => false } },
    { name: 'idempotencyKey', type: 'text', unique: true, index: true, admin: { hidden: true }, access: { read: () => false, update: () => false } },
  ],
}

export const Redirects: CollectionConfig = {
  slug: 'redirects', admin: { useAsTitle: 'from', group: 'Administration' },
  access: { create: administrators, read: editors, update: administrators, delete: administrators },
  hooks: { beforeValidate: [validateRedirectRecord] },
  fields: [{ name: 'from', label: 'Old address', type: 'text', required: true, unique: true }, { name: 'to', label: 'Replacement address', type: 'text', required: true }, { name: 'permanent', type: 'checkbox', defaultValue: true }, { name: 'enabled', label: 'Enable this redirect', type: 'checkbox', defaultValue: true }, { name: 'managedTarget', type: 'relationship', relationTo: ['services', 'posts'], admin: { hidden: true, readOnly: true }, access: { create: ({ req }) => Boolean(req.context.slugMove), update: ({ req }) => Boolean(req.context.slugMove) } }],
}

export const collections = [Users, Pages, Services, Posts, Projects, Media, Inquiries, Redirects]
export const seoFields = advancedSEOFields



