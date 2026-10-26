import { PublicPage, publicMetadata } from '@/website/public-page'
export const dynamic = 'force-dynamic'
export async function generateMetadata() { return publicMetadata('services') }
export default function Page() { return <PublicPage pageKey="services" /> }
