import { PublicPage, publicMetadata } from '@/website/public-page'
export async function generateMetadata() { return publicMetadata('blog') }
export default function Page() { return <PublicPage pageKey="blog" /> }

