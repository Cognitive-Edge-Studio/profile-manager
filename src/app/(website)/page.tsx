import { PublicPage, publicMetadata } from '@/website/public-page'
export const dynamic = 'force-dynamic'
export async function generateMetadata() { return publicMetadata('home') }
export default function Page() { return <PublicPage pageKey="home" /> }

