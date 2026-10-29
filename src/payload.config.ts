import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor, HeadingFeature, LinkFeature, FixedToolbarFeature, EXPERIMENTAL_TableFeature } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import sharp from 'sharp'
import { collections, seoFields } from './collections'
import { SiteSettings } from './settings'
import { contentPath } from './domain/contracts.mjs'
import { publicationChecks } from './endpoints/publication-checks'
import { inquiryNotifications } from './endpoints/inquiry-notifications'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
if (!['local', 'test', 'staging', 'production'].includes(process.env.CMS_ENV || '')) throw new Error('Set CMS_ENV to local, test, staging, or production.')
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32) throw new Error('Set a private PAYLOAD_SECRET of at least 32 characters. For local development run npm run setup:local.')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.')
const serverURL = process.env.CMS_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
if (['staging', 'production'].includes(process.env.CMS_ENV!) && !serverURL.startsWith('https://')) throw new Error('Staging and production require an explicit HTTPS server URL.')
const allowedOrigins = process.env.CMS_ENV === 'local' ? Array.from(new Set([serverURL, 'http://localhost:3000', 'http://127.0.0.1:3000'])) : [serverURL]

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL,
  cors: allowedOrigins, csrf: allowedOrigins,
  admin: {
    user: 'users',
    meta: { titleSuffix: '— Shibly website', robots: { index: false, follow: false } },
    importMap: { baseDir: root },
    components: { beforeDashboard: ['/src/components/DashboardIntro#DashboardIntro'] },
  },
  telemetry: false,
  email: () => ({
    name: 'delivery-not-configured',
    defaultFromAddress: 'no-reply@localhost',
    defaultFromName: 'Website CMS',
    sendEmail: async () => { throw new Error('Email delivery is not configured. Contact the administrator for account recovery.') },
  }),
  collections,
  globals: [SiteSettings],
  endpoints: [publicationChecks, ...inquiryNotifications],
  editor: lexicalEditor({ features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter(feature => !['heading', 'link'].includes(feature.key)),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    LinkFeature({ enabledCollections: ['pages', 'services', 'posts'], fields: ({ defaultFields }) => [...defaultFields, { name: 'fragment', label: 'Section anchor (optional)', type: 'text' }, { name: 'requiredForPublishing', label: 'This link must be available before publishing', type: 'checkbox', defaultValue: false }, { name: 'rel', label: 'Advanced link type', type: 'select', hasMany: true, options: ['nofollow', 'sponsored'], admin: { description: 'Select nofollow to mark a link, or sponsored for paid links. External links within articles always include nofollow, even when this field is empty.' } }] }),
    FixedToolbarFeature(),
    EXPERIMENTAL_TableFeature(),
  ] }),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL, max: 8 },
    migrationDir: resolve(root, 'src/migrations'),
    push: process.env.CMS_ENV === 'test' && process.env.CMS_TEST_SCHEMA_PUSH === 'true',
  }),
  sharp,
  upload: { limits: { fileSize: 8 * 1024 * 1024 } },
  typescript: { outputFile: resolve(root, 'src/payload-types.ts') },
  plugins: [seoPlugin({
    collections: ['pages', 'services', 'posts'], globals: ['site-settings'], uploadsCollection: 'media', tabbedUI: false,
    fields: ({ defaultFields }) => [...defaultFields, ...seoFields],
    generateURL: ({ doc, collectionSlug }) => `${serverURL}${contentPath(collectionSlug, doc) || '/'}`,
  }), config => {
    // Place the plugin's generated meta group in the existing tab bar instead
    // of wrapping Content/Links/Publishing inside a second Content tab.
    for (const item of [...(config.collections || []).filter(collection => ['pages', 'services', 'posts'].includes(collection.slug)), ...(config.globals || [])]) {
      const meta = item.fields.find(field => 'name' in field && field.name === 'meta')
      const tabs = item.fields.find(field => field.type === 'tabs')
      if (meta && tabs?.type === 'tabs') {
        const publishing = tabs.tabs.findIndex(tab => tab.label === 'Publishing')
        tabs.tabs.splice(publishing < 0 ? tabs.tabs.length : publishing, 0, { label: 'SEO', fields: [meta] })
        item.fields = item.fields.filter(field => field !== meta)
      }
    }
    return config
  }],
})
