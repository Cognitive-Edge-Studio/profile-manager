import type { MetadataRoute } from 'next'
import { robotsData } from '@/domain/seo.mjs'
export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  return robotsData()
}
