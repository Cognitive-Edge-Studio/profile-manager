import { NextResponse, type NextRequest } from 'next/server'
import { getRouting, activeRedirect } from './routing'
import { normalizePath } from './domain/routing.mjs'

export async function proxy(request: NextRequest) {
  if (!['GET', 'HEAD'].includes(request.method)) return NextResponse.next()
  try {
    const snapshot = await getRouting(), path = normalizePath(request.nextUrl.pathname)
    const record = snapshot.redirects.find(item => normalizePath(item.from) === path)
    const destination = record && activeRedirect(record, snapshot)
    if (destination) {
      const target = new URL(destination, request.url)
      // Keep local campaign/search parameters only when no replacement query
      // was configured. Never forward a visitor's query to an external site.
      if (destination.startsWith('/') && !target.search) target.search = request.nextUrl.search
      if (target.href !== request.nextUrl.href) { const response = NextResponse.redirect(target, record.permanent === false ? 307 : 308); response.headers.set('Cache-Control', 'no-store'); return response }
    }
    if (request.nextUrl.pathname !== path && snapshot.records.some(item => item.path === path)) {
      const target = request.nextUrl.clone(); target.pathname = path
      const response = NextResponse.redirect(target, 308); response.headers.set('Cache-Control', 'no-store'); return response
    }
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return response
  } catch {
    return new NextResponse('Website data is temporarily unavailable. Please retry.', { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
  }
}
export const config = { matcher: ['/((?!api(?:/|$)|admin(?:/|$)|preview(?:/|$)|_next(?:/|$)|images(?:/|$)|media(?:/|$)|favicon.ico$|robots.txt$|sitemap.xml$).*)'] }
