import type { GlobalConfig } from 'payload'
import { administrators, editors, protectSettings } from './access'
import { linkFields, sourceFields } from './fields'
import { validateDestination } from './domain/contracts.mjs'
import { enforceSettings } from './publishing'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings', label: 'Site settings', admin: { group: 'Website', preview: () => '/preview?collection=site-settings' },
  access: { read: editors, update: administrators, readVersions: editors },
  versions: { drafts: true, max: 30 }, hooks: { beforeOperation: [({ args, operation, req }) => { if (operation === 'update') req.context.draftOperation = args?.draft === true && args?.data?._status !== 'published'; return args }], beforeChange: [protectSettings, enforceSettings] },
  fields: [...sourceFields, { type: 'tabs', tabs: [
    { label: 'Profile and contact', fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true },
      { name: 'role', label: 'Your professional role', type: 'text', required: true },
      { name: 'email', label: 'Public contact email', type: 'email', required: true },
      { name: 'linkedin', type: 'text', validate: (value: unknown) => !value || validateDestination(value) }, { name: 'github', type: 'text', validate: (value: unknown) => !value || validateDestination(value) }, { name: 'calendly', label: 'Booking link', type: 'text', validate: (value: unknown) => !value || validateDestination(value) },
      { name: 'portrait', type: 'upload', relationTo: 'media' }, { name: 'avatar', type: 'upload', relationTo: 'media' },
      { name: 'workspaceImage', type: 'upload', relationTo: 'media' },
      { name: 'remoteLabel', label: 'Location / availability text', type: 'text' },
      { name: 'portraitCaption', label: 'Portrait caption', type: 'text' },
    ] },
    { label: 'Navigation', fields: [{ name: 'headerLinks', type: 'array', maxRows: 8, fields: linkFields() }, { name: 'headerAction', label: 'Header button', type: 'array', maxRows: 1, fields: linkFields() }, { name: 'footerLinks', type: 'array', maxRows: 12, fields: linkFields() }, { name: 'footerText', type: 'text' }] },
    { label: 'Contact form', fields: [
      { name: 'formHeading', label: 'Contact form heading', type: 'text', maxLength: 100, defaultValue: 'Send me a message' },
      { name: 'homeFormHeading', label: 'Homepage form heading', type: 'text', maxLength: 100, defaultValue: 'Inquiry form' },
      { name: 'submitLabel', label: 'Submit button text', type: 'text', maxLength: 80, defaultValue: 'Send your message' },
      { name: 'acceptedMessage', label: 'Optional next-step note after acceptance', type: 'textarea', maxLength: 500, defaultValue: "Thank you for sharing your project. I'll review your message and get back to you by email.", admin: { description: 'The form confirms saving separately. Describe what happens next; do not claim an email was delivered or a reply already sent.' } },
      { name: 'formHelp', label: 'Introductory helper text', type: 'textarea', maxLength: 500 },
      ...([{ name: 'nameLabel', label: 'Name field label', defaultValue: 'Your name' }, { name: 'emailLabel', label: 'Email field label', defaultValue: 'Email address' }, { name: 'messageLabel', label: 'Contact message field label', defaultValue: 'About your project' }, { name: 'homeMessageLabel', label: 'Homepage message field label', defaultValue: 'Tell me about the project' }, { name: 'budgetLabel', label: 'Budget field label', defaultValue: 'Budget range' }, { name: 'timelineLabel', label: 'Timeline field label', defaultValue: 'Preferred timeline' }] as const).map(field => ({ ...field, type: 'text' as const, maxLength: 80 })),
      { name: 'budgetHelp', label: 'Budget helper text', type: 'textarea', maxLength: 500 },
      { name: 'messagePlaceholder', label: 'Message example / placeholder', type: 'textarea', maxLength: 300, defaultValue: "I'd like to build or improve… It's for… I need help with…" },
    ] },
    { label: 'Publishing', fields: [{ name: 'readiness', type: 'ui', admin: { components: { Field: '/src/components/PublishingChecks#PublishingChecks' } } }] },
  ] }],
}
