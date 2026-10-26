import { withPayload } from '@payloadcms/next/withPayload'
import { fileURLToPath } from 'node:url'

export default withPayload({
  poweredByHeader: false,
  htmlLimitedBots: /.*/,
  reactStrictMode: true,
  images: { localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/images/**', search: '' }] },
  // The proxy canonicalizes known public routes, while Payload keeps its own
  // admin/API address conventions.
  skipTrailingSlashRedirect: true,
  async headers() { return [
    { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    { source: '/preview', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'private, no-store' }] },
    { source: '/sitemap.xml', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    { source: '/robots.txt', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
  ] },
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
})
