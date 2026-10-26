'use client'
import { useEffect, useState } from 'react'
import { useDocumentInfo, useFormModified } from '@payloadcms/ui'

const fieldLabel = (path: string) => ({ body: 'Content', detailsReviewed: 'Service detail review', heading: 'Main heading', 'meta.title': 'Search title', 'meta.description': 'Search description', 'meta.image': 'Sharing image', 'meta.canonicalURL': 'Canonical address', heroImage: 'Main image', image: 'Image', portrait: 'Portrait', avatar: 'Avatar', workspaceImage: 'Workspace image' } as Record<string,string>)[path] || path.replace(/sections\.(\d+)/g, (_, n) => `Page section ${Number(n) + 1}`).replace(/actions/g, 'Buttons').replace(/headerLinks/g, 'Header navigation').replace(/footerLinks/g, 'Footer navigation').replace(/\./g, ' → ')
export function PublishingChecks() {
  const { id, collectionSlug, globalSlug, lastUpdateTime } = useDocumentInfo()
  const modified = useFormModified()
  const [report, setReport] = useState<any>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [live, setLive] = useState('')
  async function load() {
    if (!id && !globalSlug) return
    setBusy(true); setReport(null); setError(''); setLive('')
    try {
      const query = new URLSearchParams({ collection: globalSlug || collectionSlug || '', ...(id ? { id: String(id) } : {}) })
      const response = await fetch('/api/publication-checks?' + query, { credentials: 'same-origin', cache: 'no-store' })
      if (!response.ok) throw new Error('Checks could not be loaded. Save your draft, then retry.')
      setReport(await response.json())
    } catch (error: any) { setError(error.message) } finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [id, collectionSlug, globalSlug, lastUpdateTime])
  async function checkPublished() {
    const path = report?.publishedPath
    if (!path?.startsWith('/') || path.startsWith('//')) return
    setBusy(true); setLive('')
    try {
      const response = await fetch(path, { cache: 'no-store', headers: { Accept: 'text/html' } })
      const document = new DOMParser().parseFromString(await response.text(), 'text/html')
      if (!response.ok) throw new Error(`Published address returned HTTP ${response.status}. Check publication and site settings, then retry.`)
      if (report.publishedTitle && document.title !== report.publishedTitle) throw new Error('The response title differs from the published record. Reload the checks, then retry the page check.')
      setLive(`Published page checked at ${new Date().toLocaleTimeString()}: HTTP ${response.status}. Reload an already-open website tab to see current content.`)
    } catch (error: any) { setLive(error.message) } finally { setBusy(false) }
  }
  const errors = report?.issues?.filter((item: any) => item.severity === 'error') || [], warnings = report?.issues?.filter((item: any) => item.severity === 'warning') || []
  function openField(path: string) {
    const tab = path.startsWith('meta.') ? 'SEO' : globalSlug ? /^(headerLinks|footerLinks|headerAction|footerText)/.test(path) ? 'Navigation' : /^(formHeading|submitLabel|acceptedMessage|budgetHelp)/.test(path) ? 'Contact form' : 'Profile and contact' : /^(actions|related)/.test(path) ? 'Links' : 'Content'
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.tabs-field__tab-button'))
    buttons.find(button => button.textContent === tab)?.click()
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const element = document.getElementById('field-' + path.replaceAll('.', '__')) || document.querySelector<HTMLElement>(`[data-field-path="${CSS.escape(path)}"]`) || document.getElementById('field-' + path.split('.')[0]) || document.querySelector<HTMLElement>(`[data-field-path="${CSS.escape(path.split('.')[0])}"]`)
      element?.scrollIntoView({ block: 'center' })
      const input = element?.matches('input,textarea,select') ? element : element?.querySelector<HTMLElement>('input,textarea,[contenteditable=true]')
      ;(input as HTMLElement | null)?.focus()
    }))
  }
  const issueLabel = (path: string) => <button type="button" onClick={() => openField(path)} style={{ background: 'none', color: 'inherit', border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontWeight: 600 }}>{fieldLabel(path)}</button>
  return <section style={{ padding: '1.25rem', border: '1px solid var(--theme-elevation-150)', borderRadius: 8, marginBottom: '1.5rem' }}>
    <h3 style={{ marginTop: 0 }}>{report?.kind === "media" ? "Image use" : "Publishing checks"}</h3><p>Checks use your saved draft. Save changes before checking again. Suggestions do not rewrite your content or promise search rankings.</p>
    {modified && <p role="status">You have unsaved changes. Save Draft to check those changes.</p>}
    <button type="button" onClick={load} disabled={busy || modified || (!id && !globalSlug)}>{busy ? 'Checking…' : 'Re-check saved draft'}</button>
    {error && <p role="alert">{error}</p>}
    {report && <><h4>Fix before publishing ({errors.length})</h4>{errors.length ? <ul>{errors.map((item: any, i: number) => <li key={i}>{issueLabel(item.field)}: {item.message}</li>)}</ul> : <p>No blocking issues found in the saved draft.</p>}<h4>Review suggestions ({warnings.length})</h4>{warnings.length > 0 && <ul>{warnings.map((item: any, i: number) => <li key={i}>{issueLabel(item.field)}: {item.message}</li>)}</ul>}
      {!['media','projects'].includes(report.kind) && <><h4>Effective SEO</h4><dl><dt>Search title</dt><dd>{report.effective.title}</dd><dt>Description</dt><dd>{report.effective.description || 'Not set'}</dd><dt>Canonical address</dt><dd style={{ overflowWrap: 'anywhere' }}>{report.effective.canonical}</dd><dt>Search visibility</dt><dd>{report.effective.indexingReason}</dd><dt>Sitemap</dt><dd>{report.effective.sitemapEligible ? 'Eligible after publication' : 'Excluded by indexing or canonical policy'}</dd></dl>
      <h4>Indicative sharing preview</h4><div style={{ padding: '1rem', border: '1px solid var(--theme-elevation-100)', borderRadius: 6 }}><strong>{report.effective.socialTitle}</strong><p>{report.effective.socialDescription || 'No sharing description set.'}</p><small>{report.effective.image ? 'A selected public sharing image will be included.' : 'No public sharing image selected.'} External services may cache an older preview.</small></div></>}
      {report.incoming?.length > 0 && <><h4>Published records linking here</h4><ul>{report.incoming.map((reference: any, i: number) => <li key={i}><a href={reference.editURL}>{reference.title}</a> — {fieldLabel(reference.field)}{reference.required ? ' (required; update before removing the target)' : ' (optional)'}</li>)}</ul></>}
      {!['media','projects'].includes(report.kind) && <><h4>Published response</h4><p>{report.refresh}</p>{report.publishedPath ? <><a href={report.publishedPath} target="_blank" rel="noopener noreferrer">Open published address</a>{' '}<button type="button" disabled={busy || modified} onClick={checkPublished}>Check published page / retry</button></> : <p>This saved record has no published website page yet.</p>}{live && <p role="status">{live}</p>}</>}
    </>}
  </section>
}



