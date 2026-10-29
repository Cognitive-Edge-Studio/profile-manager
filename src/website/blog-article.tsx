import { ArticleArt } from './components/article-art'
import { Meta } from './article-meta'
import { RelatedBlogs } from './related-blogs'
import { summaries, profileFor, referenceDoc, type SiteData } from './content'
import { RichText, CMSImage } from './rich-text'
import { Actions } from './cms-pages'
import { Breadcrumbs, RelatedContent } from './service-pages'
import { ArticleContents } from './article-contents'
import { ArticleReadingProgress } from './article-reading-progress'
import { articleContents } from '../domain/seo.mjs'
export function BlogArticle({ site, article }: { site: SiteData; article: any }) {
  const summary = summaries(site, [article])[0], profile = profileFor(site)
  const blog = site.pages.find(item => item.pageKey === 'blog')
  const sidebar = blog?.sections?.find((section: any) => section.sectionId === 'article-contact')
  const budget = blog?.sections?.find((section: any) => section.sectionId === 'budget-tool')
  const preferred = (article.related || []).flatMap((reference: any) => reference.relationTo === 'posts' ? [referenceDoc(site, reference)].filter(Boolean) : [])
  const selected = [...new Map([...preferred, ...site.posts].map(post => [post.slug, post])).values()]
  const contents = articleContents(article.body)
  return <article className="journal-article container blog-article"><ArticleReadingProgress /><Breadcrumbs site={site} collection="posts" doc={article} /><header className="article-heading"><Meta article={summary} />{article.publishedAt && <p className="article-date">Published <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(article.publishedAt))}</time></p>}<h1>{article.title}</h1><div className="journal-author"><CMSImage site={site} value={site.settings?.avatar} alt="" sizes="36px" /><span>{profile.name}<small>{profile.role}</small></span></div></header>
    {article.illustrationKind === 'budget' && budget && <aside className="article-calculator-link" aria-label="MVP budget tool"><div><strong>{budget.heading}</strong><RichText site={site} nofollowExternal data={budget.body} /></div><Actions site={site} nofollowExternal values={budget.actions} /></aside>}
    <div className="article-feature-image">{article.heroImage ? <CMSImage site={site} value={article.heroImage} /> : <ArticleArt kind={summary.kind} />}</div>
    <div className={`article-layout${sidebar ? ' article-layout--contact' : ''}`}>
      <div className={`article-reading-layout${contents.length ? ' article-reading-layout--contents' : ''}`}>
        {contents.length > 0 && <aside className="article-toc-rail" aria-label="Article navigation"><ArticleContents entries={contents} /></aside>}
        <div className="journal-article-body" id="article-content" tabIndex={-1}><RichText site={site} nofollowExternal data={article.body} anchors /><Actions site={site} nofollowExternal values={article.actions} /></div>
      </div>
      {sidebar && <aside className="article-contact-rail" aria-label="Discuss your project"><div className="article-contact-card"><div className="article-contact-title">{sidebar.heading}</div><RichText site={site} nofollowExternal data={sidebar.body} /><Actions site={site} nofollowExternal values={sidebar.actions} className="article-contact-actions" /></div></aside>}
    </div><RelatedContent site={site} references={article.related?.filter((reference: any) => reference.relationTo !== "posts")} /><RelatedBlogs key={article.slug} currentSlug={article.slug} articles={summaries(site, selected)} /></article>
}


