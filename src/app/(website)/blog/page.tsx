import { PublicPage, publicMetadata } from '@/website/public-page'
export const dynamic = 'force-dynamic'
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const params = await searchParams; return publicMetadata('blog', Boolean(params.q || params.topic)) }
export default function Page() { return <PublicPage pageKey="blog" /> }

