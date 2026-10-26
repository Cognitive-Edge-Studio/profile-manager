# Content and optimization controls plan

Status: Controls through Slice 6 are implemented locally. Sending-service activation and production operations remain release dependencies. No tracking or external production configuration has been changed. Work is restricted to the owner's finalized, documented public pages. See [implementation progress](./implementation-progress.md).

## Purpose and sequence

Extend the [backend implementation plan](./backend-implementation-plan.md) so the owner can manage content and practical optimization tasks in Payload without coding. This includes on-page SEO, links, images, navigation, calls to action, publishing, performance, and accessibility. Payload remains the selected CMS.

Use the same seven-slice sequence. Each control needs three parts: a usable dashboard field, correct public rendering, and a check proving that publishing applies the change. A stored value alone does not complete a feature.

## The owner's editing workspace

| Tab | Owner actions |
| --- | --- |
| Content | Edit headings, text, images, FAQs, button labels, and approved sections |
| Links | Edit clickable text, choose internal pages, enter external URLs, manage related content and section links |
| SEO | Edit search metadata and social previews; open advanced canonical/indexing options when needed |
| Publishing | Save a draft, preview desktop/mobile, review errors/warnings, publish, unpublish, or restore a version |

Use plain labels, short examples, and sensible defaults. A link button remains available in the rich-text toolbar; the Links tab handles structured links and a summary of links in the current document. Hide server configuration and raw schema/HTML/JSON from the everyday editing workflow. Hide irrelevant collections and options for each user role.

## Slice 1 — Specify every editing action

**Outcome:** The dashboard contract covers what the owner can control and what the application manages automatically.

| Capability | What the owner can do | Implementation required | Acceptance example |
| --- | --- | --- | --- |
| Search title/description | Edit values for each public page | Payload SEO plugin, defaults, frontend metadata rendering | A saved override appears in the published HTML |
| Social sharing | Choose a sharing image and optional separate title/description | SEO image plus custom override fields and Open Graph/social tags | A published page exposes the selected values in HTML; preview explains external caches may refresh later |
| URL slug | Change an eligible page's address | Unique normalized slug, reserved paths, redirect handling | Old address redirects to the new published address |
| Anchor text | Change the clickable words inside content | Rich-text link editor and renderer | Selected words render as a real link with the intended destination |
| Internal links | Select a page/service/article from a picker | Document relationships resolved to current public URLs | A linked page's slug change updates its resolved destination after refresh |
| External links | Enter a website address and choose new-tab behavior | URL validation, renderer, accessible indication where appropriate | The correct address and target behavior render |
| Advanced link attributes | Mark applicable links sponsored or nofollow | Additional link fields and correct rel rendering | Only the chosen attributes are emitted; external links are not all nofollow by default |
| Section anchors | Name a section and link directly to it | Unique stable section IDs and fragment validation | A link ending in #process reaches that visible section |
| Headings | Edit the page heading and content H2/H3 headings | Template-owned primary H1 and semantic rich-text headings | Heading structure remains valid without visual formatting tricks |
| Image descriptions | Add alt text/captions or mark an image decorative | Media defaults, usage-specific alt overrides, image renderer | Meaningful images have descriptions; decorative images render empty alt text |
| Buttons and CTAs | Change labels, destinations, and approved placement | Structured links and existing button variants | Contact and booking buttons lead to the selected valid destinations |
| Navigation/footer | Change labels, links, and order | Validated menu fields and shared rendering | Desktop/mobile menus and footer reflect published settings |
| Related content | Choose relevant services, projects, or articles | Relationships and published-only cards | Draft/deleted content does not create broken public cards |
| Canonical URL | Use the generated default or an advanced override | Canonical field, URL validation, frontend tag | Exactly one resolved canonical URL appears on a public page |
| Search visibility | Choose whether a published page should be offered to search engines | noindex output and sitemap filtering | A noindex page stays accessible but is excluded from the sitemap |
| Structured data | Edit truthful profile, author, service, and breadcrumb inputs | Developer-defined templates and safe JSON-LD rendering | Machine-readable facts match visible page content |
| Redirects | Choose an old path and replacement | Redirect collection/plugin plus actual frontend HTTP behavior | A permanent redirect responds with an appropriate HTTP redirect status |
| Site identity | Update contact/social details, branding, and default metadata | Shared settings and all dependent templates | Header/footer/contact details stay consistent |

**Acceptance:** Every row has an agreed field location, default, permission rule, rendering rule, and verification case. Capabilities remain limited to configured templates; new section types or functionality still require development.

## Slice 2 — Build an understandable dashboard

**Outcome:** The planned controls exist and are usable before migrating live content.

**Work**

1. Install/configure Payload's SEO plugin for pages, services, posts, and applicable globals. Add custom canonical, indexing, social override, and guided schema fields.
2. Configure rich-text internal/external links, anchor-text editing, headings, lists, and media. Add plain-language advanced link choices with short help text.
3. Create a reusable link model for buttons, menus, cards, and footers: label, destination kind, page reference or URL, optional fragment, and new-tab choice.
4. Provide media descriptions with usage-specific overrides, captions, and decorative-image choices. Define and enforce supported file types and upload limits; document the chosen limits in the editor.
5. Add reusable service/article templates, section reorder controls within the existing design, and reference-aware deletion/unpublish warnings.
6. Configure draft preview, revision restoration, and role-appropriate publishing controls.
7. Validate all relevant rules server-side as well as in the dashboard. Distinguish required-field errors from nonblocking editorial suggestions.

**Acceptance:** A nontechnical walkthrough can create a sample service, insert a link, set an image description, edit metadata, and preview it without raw code fields or command-line instructions.

## Slice 3 — Build the rendering, speed, and accessibility foundations

**Outcome:** The application renders content, links, and media correctly and preserves the existing user experience.

**Work**

1. Render meaningful public content and navigation links in HTML. Use real anchors with href values for navigation and buttons for actions.
2. Keep the page template responsible for its primary H1. Render supported body headings, lists, tables, links, and images semantically.
3. Generate responsive image sizes, reserve image dimensions to reduce layout movement, prioritize the main visible image appropriately, and lazy-load suitable offscreen images. Avoid loading every image with high priority.
4. Preserve local fonts where practical, limit unnecessary client JavaScript, and defer nonessential third-party integrations. Keep the calculator isolated from routes that do not use it.
5. Check keyboard operation, visible focus, form labels/errors, image alternatives, reduced motion, and mobile layout. Ensure newly added content can wrap without breaking the design.
6. Record comparable performance runs for Home, a service template, an article, and the calculator. Record build/environment, device/network settings, loading and layout stability evidence, and interactive behavior. Resolve material migration regressions before launch.

**Acceptance:** Links and content work without depending on post-load metadata effects. Responsive image and layout behavior are verified. Representative routes pass the specified keyboard/mobile checks, and calculator behavior remains intact. Staging results are described as lab measurements rather than real-user Core Web Vitals.

## Slice 4 — Connect real content and editing actions

**Outcome:** The controls change the actual website, including content outside article bodies.

**Work**

1. Import and compare existing anchor text, URLs, heading hierarchy, images, captions where present, buttons, and navigation with the approved source content.
2. Preserve existing wording during migration. New optimization suggestions are warnings or owner edits, never silent rewrites of approved text.
3. Resolve internal links from document IDs so ordinary slug changes do not require manual repair of every link. Handle legacy URL links explicitly during import.
4. Keep section IDs stable after heading-text edits. Detect duplicates and unresolved fragments, including links across pages.
5. Keep homepage service summaries and detail-page data connected to the same records while allowing explicit short summary fields. Keep profile/contact data in shared settings.
6. Provide an incoming-reference summary for affected records before deletion/unpublishing. Prevent accidental broken required navigation; remove optional unavailable cards according to the documented rule.

**Acceptance:** Editing a button label, an internal link, a section anchor, an image description, or a navigation entry changes the correct preview. Internal-link resolution survives a linked page's slug change. Existing blog manuscript wording and calculator handoff remain unchanged.

## Slice 5 — Complete SEO, link validation, and publishing checks

Implement the following sub-slices in order within backend Slice 5.

### 5A — Metadata and previews

Render titles, descriptions, canonical links, indexing instructions, and sharing metadata from defaults and page overrides. Provide indicative search/social previews without claiming to reproduce search-engine snippets exactly. Use length guidance as an editorial suggestion, not a universal character-limit publishing block.

**Done when:** An owner changes metadata in a draft, previews it, publishes, and sees the new values in the public HTML. Missing optional values use documented defaults.

### 5B — Links, anchors, and heading checks

Validate internal references, reserved paths, duplicate section IDs, missing fragment targets, blank link text, and allowed URL schemes. Reject unsafe script URLs. Support appropriate mailto/tel links in contact fields. Do not fetch arbitrary entered URLs from the server as part of basic validation; external availability checks are manual for this release. Warn about generic link wording or skipped heading levels without rewriting copy.

**Done when:** The owner can fix a broken internal link from a clear record-specific message. Published links have correct text/destinations/attributes, and section links reach their targets. Draft preview links do not disclose drafts to anonymous visitors.

### 5C — Search visibility, URL rules, and redirects

Generate the sitemap from published, indexable canonical routes. Generate normal canonical URLs and define a deliberate policy for blog search/filter parameters and trailing slashes. Wire redirects to HTTP responses, block loops/chains where practical, and exclude redirect sources and not-found routes from the sitemap. Create a redirect as part of a published slug change and refresh references/caches together.

A published page marked noindex remains crawlable so supported crawlers can see the instruction. Do not also block that page in robots.txt as the noindex mechanism. Authentication protects private drafts and admin data; indexing settings are not access controls. Keep staging access controlled and apply environment-specific indexing defaults.

**Done when:** Published noindex content is absent from the sitemap, its response includes the intended instruction, private previews require access, old slugs redirect, unknown URLs return HTTP 404, and the production domain is used consistently.

### 5D — Structured data and media output

Generate applicable profile/person, article, service, and breadcrumb data from truthful visible content. Choose supported templates during implementation and validate emitted JSON-LD. Do not ask the owner to write raw schema code or fabricate reviews, ratings, outcomes, dates, or credentials. Add structured data only where appropriate; special search displays are not promised.

Render descriptive image alternatives and suitable social-image dimensions/formats. Check that a selected image is publicly available after publishing and that changing it updates the relevant output.

**Done when:** Structured values match the page, validation errors are resolved, meaningful images have appropriate alternatives, and shared previews use the selected image.

### 5E — Publishing checks and refresh behavior

Provide a concise per-document readiness panel using checks implemented in this project. Payload's SEO plugin supplies metadata fields and snippet feedback; the broader checks below require custom work.

| Result | Examples | Behavior |
| --- | --- | --- |
| Fix before publishing | Missing required content, duplicate slug, invalid destination, unresolved required internal link, redirect loop | Prevent publication and link to the relevant field |
| Review suggestion | Generic anchor wording, unusual title length, repeated metadata, skipped heading level, oversized image | Explain the issue; allow an informed publishing decision |
| Information | Effective canonical, indexing choice, resolved metadata defaults, last successful page refresh | Show the effective setting/status without treating it as an SEO score |

An intentional noindex choice is informational, not automatically an error. Do not block a legitimate page solely because it has no image or a decorative image has empty alt text. Checks on inbound references must consider unpublishing and deletion, not only the current record.

Publishing and unpublishing refresh all affected public pages, navigation, listings, metadata, structured data, and sitemap within a documented interval. Surface refresh failures with a retry path; do not suggest a failed refresh is already live. Refresh status is a diagnostic, separate from draft/published state.

**Done when:** Known invalid sample records produce understandable checks, valid records can publish, and cached content is refreshed consistently after publish/update/unpublish/slug changes.

## Slice 6 — Optimize contact and conversion actions

**Outcome:** The owner can improve the contact experience while the application preserves reliable delivery.

**Work**

1. Expose contact introductions, button labels, booking destinations, and supported optional helper text in the CMS. Keep required consent/privacy wording aligned with the actual deployment.
2. Keep field names/types and required validation under application control so content edits cannot break submission handling.
3. Allow choosing a relevant service/contact destination for a CTA using the shared link picker. Preserve calculator-to-contact context.
4. Render accessible sending, accepted, validation-error, and delivery-error states. Confirmation text must describe actual durable acceptance, not promise that an email notification has arrived or a reply has been sent.
5. Document inquiry statuses and private notification-failure handling. Do not add advertising trackers, arbitrary script injection, or external CRM connections as part of these controls.

**Acceptance:** The owner can change CTA wording/booking links without code, each destination works, form errors remain understandable, submissions are retained once, and failures do not erase entered information or expose private inquiries.

## Slice 7 — Validate with the owner and prepare operations

**Outcome:** The owner demonstrates independent control, and the implementation has evidence for the behavior promised above.

**Owner walkthrough**

1. Edit homepage content and reorder an allowed section.
2. Create a service from its template and set its slug.
3. Insert an internal link using chosen anchor text, add an external link, and add a section link.
4. Upload an image, set its description, and choose a sharing image.
5. Edit title/description, inspect previews, and review advanced settings.
6. Fix an example validation error, preview desktop/mobile, and publish.
7. Change a published slug, check the old address, then restore a prior content version without creating a URL conflict.
8. Update a button/navigation link, submit an inquiry, and find it in the private dashboard.

**Technical verification**

- Inspect rendered HTML and response status codes for Home, services, articles, contact, calculator, redirects, noindex pages, and not-found pages.
- Check sitemap inclusion/exclusion, canonical consistency, robots behavior, metadata uniqueness where applicable, real link markup, fragments, image alternatives, and structured data.
- Verify draft isolation, editor permissions, publication refresh/retry behavior, mobile layouts, keyboard operation, and the established calculator tests.
- Compare representative performance measurements against Slice 3's baseline under the same conditions; record resolved issues and remaining limits. Use production field data for loading, interaction responsiveness, and layout stability when available; it may not exist at launch.
- Provide a short guide with screenshots and examples. Document who handles software updates, hosting, backups, and technical fixes.
- Verify the owner's search-console property and submit the sitemap when account access is available. Provide a link to that external report; do not imply the Payload dashboard already contains ranking/traffic data.

**Acceptance:** The owner completes the walkthrough without coding and can distinguish draft, published, refresh status, editorial suggestions, and technical issues requiring support. Verification evidence accompanies the release.

## Priority and scope

All controls and checks above belong to the initial implementation unless explicitly marked as dependent on account access or post-launch data. Search-console reporting stays in the external service. Live rank tracking, keyword research integrations, continuous external link crawling, AI-written optimization, advanced analytics dashboards, A/B testing, and recurring audit automations remain later options with separate scope, privacy, and cost decisions.

Normal content/SEO editing does not require development. New section types, integrations, schema templates, or application behavior do. This plan delivers the controls and correct implementation; search rankings and external preview refresh timing are not acceptance guarantees.

## Implementation references

- [Payload SEO plugin](https://payloadcms.com/docs/plugins/seo): default metadata fields, preview feedback, and custom extensions. Frontend metadata wiring is required.
- [Payload rich-text features](https://payloadcms.com/docs/rich-text/official-features): link, heading, media, and editor configuration.
- [Payload redirects plugin](https://payloadcms.com/docs/plugins/redirects): stored redirect rules require frontend HTTP integration.
- [Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): real link markup, descriptive anchor text, and appropriate link attributes.
- [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing): crawlers must be able to read a noindex instruction; robots.txt is not a private-content control.
- [Google Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals): loading, interaction responsiveness, and layout stability; distinguish lab checks from production field evidence.
