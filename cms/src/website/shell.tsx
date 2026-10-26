import { ArrowUpRight, Globe2 } from 'lucide-react'
import { Header } from './header'
import { AnchorEffects, BackToTop, Link, WebsiteRuntime } from './runtime'
import { SocialLinks } from './contact-links'
import { mediaFor, profileFor, resolvedLink, type SiteData } from './content'
import { contentPath } from '../domain/contracts.mjs'
import { CMSImage } from './rich-text'
import { contactPrivacy } from '../domain/contact.mjs'

export function WebsiteShell({ site, children }: { site: SiteData; children: React.ReactNode }) {
  const settings = site.settings || {}, profile = profileFor(site)
  const links = (values: any[] = []) => values.flatMap(value => { const link = resolvedLink(site, value); return link ? [link] : [] })
  const navigation = links(settings.headerLinks), footer = links(settings.footerLinks), action = links(settings.headerAction)[0]
  const routeMap: Record<string, string> = {}
  if (site.preview) for (const [collection, docs] of [['pages', site.pages], ['posts', site.posts], ['services', site.services]] as const) for (const doc of docs) {
    const path = contentPath(collection, doc)
    if (path) routeMap[path.replace(/\/$/, '') || '/'] = `/preview?collection=${collection}&id=${doc.id}`
  }
  const formFields = ['formHeading', 'homeFormHeading', 'submitLabel', 'acceptedMessage', 'budgetHelp', 'formHelp', 'nameLabel', 'emailLabel', 'messageLabel', 'homeMessageLabel', 'budgetLabel', 'timelineLabel', 'messagePlaceholder']
  const form = Object.fromEntries(formFields.map(key => [key, settings[key]]))
  return <WebsiteRuntime profile={profile} contact={{ enabled: process.env.CONTACT_SUBMISSIONS_ENABLED === 'true', preview: site.preview, privacy: contactPrivacy() }} routeMap={routeMap} form={form}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {site.settings && <Header profile={profile} navigation={navigation} action={action} avatar={mediaFor(site, settings.avatar)?.url} preview={site.preview} />}
    <AnchorEffects /><main id="main-content">{children}</main>
    {site.settings && <footer className="site-footer container"><div className="footer-top"><Link className="footer-brand" to="/"><CMSImage site={site} value={settings.avatar} alt="" className="brand-portrait" sizes="36px" /><span className="footer-name">{profile.name}<span>{profile.role}</span></span></Link><nav aria-label="Footer navigation">{footer.map((link, i) => <Link key={i} to={link.href} target={link.target} rel={link.rel}>{link.label}</Link>)}</nav><SocialLinks profile={profile} calendly /></div><div className="footer-bottom"><p>{settings.footerText || `© ${new Date().getFullYear()} ${profile.name}`}</p><span><Globe2 size={12} />{settings.remoteLabel}</span><BackToTop /></div></footer>}
  </WebsiteRuntime>
}
