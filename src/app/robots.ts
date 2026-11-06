import type { MetadataRoute } from 'next'
import { robotsData } from '@/domain/seo.mjs'
export const dynamic = 'force-static'
export default function robots(): MetadataRoute.Robots {
  return robotsData()
}
