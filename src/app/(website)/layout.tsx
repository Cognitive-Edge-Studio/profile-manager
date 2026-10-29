import type { Metadata } from 'next'
import '@fontsource-variable/manrope'
import '@/website/styles.css'
import '@/website/styles/blog.css'
import '@/website/styles/calculator.css'
import '@/website/styles/article-design.css'
export const metadata: Metadata = { title: 'Website', robots: { index: false, follow: false } }
export const viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }
export const dynamic = 'force-dynamic'
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" /></head><body><div id="root" className="website-root">{children}</div></body></html>
}

