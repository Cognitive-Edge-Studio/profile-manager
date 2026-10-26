// Ported from the existing site; approved copy is unchanged.
import { Clock3 } from 'lucide-react'
import type { ArticleSummary } from './types'
export function Meta({ article }: { article: ArticleSummary }) {
  return <div className="journal-meta"><span>{article.category}</span><span className="reading-time"><Clock3 size={12} />{article.minutes} min read</span></div>
}
