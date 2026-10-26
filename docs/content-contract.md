# Slice 1 content and migration contract

The machine-readable baseline is `migration/source-inventory.json`. Run `node scripts/inventory.mjs --check` from this directory's parent to verify it. Regeneration is an explicit source-review operation; it does not import or publish anything.

## Routes and stable identities

Pages use fixed keys: home, about, contact, blog, services, calculator. Their route paths stay stable. Services and posts use unique validated slugs in separate route namespaces. Source IDs are independent of database IDs and cannot be edited in the owner dashboard. Repeated imports match source IDs and never silently overwrite owner edits. Projects are reusable homepage records; standalone work pages are not part of this release.

The inventory records ten existing routes, nine service summaries, four project mentions, five original articles, approved page sections, local images/icons, and SHA-256 fingerprints for content, styling, and calculator code. Missing service detail copy and SEO review are recorded explicitly. The inventory adds no prices, dates, claims, or content.

## Field ownership and structure

Pages: fixed key, main heading, introduction, typed ordered sections, image references, actions, metadata, draft status. Existing approved source strings are retained separately from the rich-text editing representation so import fidelity can be checked. Sections have immutable source IDs, editable unique section anchors, a template type, heading, body, and supported links. The original home section order is intro, services, work, process, FAQs, contact. Header/hero and required contact sections cannot be removed accidentally. Reorder rules are implemented before CMS content replaces live rendering.

Services: title, category, slug, summary, detailed rich text, benefits, process, FAQs, optional hero image, CTA, ordering, metadata, publication status. The original nine summaries import as drafts; detailed pages require reviewed detail copy before publication.

Posts: exact title, excerpt, manuscript, category and illustration kind; rich-text editing body, optional image, related records, metadata, publication status and an optional truthful publication date. Reading time is computed from content. No initial publication dates are inferred.

Projects: original title and body preserve personal, previous-employer, and client context; optional verified link/image; homepage order; draft status. Media: file, dimensions, description, caption, decorative flag, visibility and usage-specific description overrides. Files default private until made explicitly public.

Site settings: profile/contact/social fields, brand images, header/footer navigation, default metadata. Settings are versioned singleton content. Public rendering uses only the published settings; the raw settings API is authenticated. New values do not bypass preview/publication.

Links: label, kind (internal/external/section/contact), document reference or validated URL, optional fragment, new-tab choice, sponsored/nofollow options. Unsafe schemes and blank labels are rejected. Normal external links do not automatically become nofollow. No arbitrary HTML, scripts, raw robots rules, or JSON-LD entry is required from the owner.

SEO: title, description, image plus optional social overrides; generated canonical with advanced override; explicit indexing choice. Frontend metadata rendering, sitemap, structured data and redirects are not complete until Slice 5. Content fields remain accessible through Content, Links, SEO, and Publishing tabs with plain-language help.

## Permissions

| Operation | Anonymous visitor | Editor | Administrator |
| --- | --- | --- | --- |
| Read public content | Published records only | Published and drafts | Published and drafts |
| Edit content | No | Save drafts; revisions to published content require draft mode | Yes |
| Publish/unpublish/delete | No | No | Yes |
| Read or restore versions | No | Read versions; administrator performs restoration | Yes |
| Manage settings | No raw API access | Read; editing restricted to administrator initially | Edit/publish |
| Upload/read media | Explicitly public files only | Upload/manage descriptions, read private media | Manage visibility/delete |
| Manage users/roles | No public signup | Own account details/password only; no role changes | Manage users; protect final admin |
| Manage inquiries | Submit only through dedicated validated contact endpoint | No | Read/update/delete |
| Manage redirects | No | Read | Create/update/delete |

Collection access checks and before-change checks both protect publication state. Public server queries must explicitly honor access checks. A privileged local API import must deliberately identify itself and is never exposed as a public route. User creation is closed publicly; a local one-time bootstrap creates the first administrator without a public setup window.

## Migration rules and open inputs

Keep the Vite app and its approved sources runnable while developing the separate `cms/` application. Preserve all words and blog structures; retain original manuscript snapshots. Import with dry-run and reviewed difference output in Slice 4. Every initial content record is a draft. Preserve existing URLs and section targets, with redirects only when explicitly changed. No database import occurs in Slice 1.

Hardcoded copy in App.tsx/blog.tsx (hero, interface labels, CTA text, form feedback and navigation) needs explicit CMS fields or a documented application-owned reason. Calculator UI behavior, all arithmetic rules, module-memory persistence and print/download outputs stay application-owned; only surrounding content/metadata and links become editable. No visitor calculator inputs enter CMS storage.

Inputs still needed before launch: reviewed service detail copy, article publication decisions, production domain, hosting/storage/email provider choices, inquiry retention and final privacy wording. None block building the local content models.
