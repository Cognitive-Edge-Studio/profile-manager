import { ArrowLeft, Check } from 'lucide-react'
import { Link } from './runtime'
import { ArticleArt } from './components/article-art'
import { Meta } from './article-meta'
import { RelatedBlogs } from './related-blogs'
import { summaries, profileFor, referenceDoc, type SiteData } from './content'
import { RichText, CMSImage } from './rich-text'
import { Actions } from './cms-pages'
import { Breadcrumbs, RelatedContent } from './service-pages'
import { ArticleContents } from './article-contents'
import { articleContents } from '../domain/seo.mjs'
export function BlogArticle({ site, article }: { site: SiteData; article: any }) {
  const summary = summaries(site, [article])[0], profile = profileFor(site)
  const blog = site.pages.find(item => item.pageKey === 'blog')
  const sidebar = blog?.sections?.find((section: any) => section.sectionId === 'article-contact')
  const budget = blog?.sections?.find((section: any) => section.sectionId === 'budget-tool')
  const selected = article.related?.length ? article.related.flatMap((reference: any) => reference.relationTo === 'posts' ? [referenceDoc(site, reference)].filter(Boolean) : []) : site.posts
  const contents = articleContents(article.body)
  return <article className="journal-article container"><Breadcrumbs site={site} collection="posts" doc={article} /><Link className="text-link" to="/blog/"><ArrowLeft size={15} />Back to the journal</Link><header className="article-heading"><Meta article={summary} />{article.publishedAt && <p className="article-date">Published <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(article.publishedAt))}</time></p>}<h1>{article.title}</h1><div className="journal-author"><CMSImage site={site} value={site.settings?.avatar} alt="" sizes="36px" /><span>{profile.name}<small>{profile.role}</small></span></div></header>
    {article.illustrationKind === 'budget' && budget && <aside className="article-calculator-link" aria-label="MVP budget tool"><div><strong>{budget.heading}</strong><RichText site={site} data={budget.body} /></div><Actions site={site} values={budget.actions} /></aside>}
    {article.heroImage ? <CMSImage site={site} value={article.heroImage} /> : <ArticleArt kind={summary.kind} />}
    <div className="article-reading-layout article-reading-layout--toc">
      <div className="article-reading-rail"><div className="article-reading-rail__inner">
        <ArticleContents entries={contents} />
        {sidebar && <aside className="article-contact-rail" aria-label="Discuss your project"><div className="article-contact-card"><div className="article-contact-title">{sidebar.heading}</div><RichText site={site} data={sidebar.body} /><ul className="article-contact-services" aria-label="Services">{[...new Set(site.services.map(service => service.category))].map(category => <li key={category}><Check size={15} aria-hidden="true" /><span>{category}</span></li>)}</ul><Actions site={site} values={sidebar.actions} className="article-contact-actions" /></div></aside>}
      </div></div>
      <div className="journal-article-body"><RichText site={site} data={article.body} anchors /><Actions site={site} values={article.actions} /></div>
    </div><RelatedContent site={site} references={article.related?.filter((reference: any) => reference.relationTo !== "posts")} /><RelatedBlogs key={article.slug} currentSlug={article.slug} articles={summaries(site, selected)} /></article>
}


