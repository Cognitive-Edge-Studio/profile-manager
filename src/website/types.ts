export type Profile = {
  name: string; role: string; email: string; linkedin: string; github: string; calendly: string
}
export type ArticleSummary = {
  slug: string; title: string; excerpt: string; category: string; kind: string
  minutes: number; metaTitle: string; metaDescription: string
  image?: { url?: string | null; alt?: string | null; width?: number | null; height?: number | null; decorative?: boolean | null }
}
export type WebsiteLink = { href: string; label: string; target?: string; rel?: string }
