import { PublicPage, publicMetadata } from '@/website/public-page'
export const dynamic = 'force-dynamic'
export async function generateMetadata() { return publicMetadata('calculator') }
export default function Page() { return <PublicPage pageKey="calculator" /> }

