# Backend implementation plan

Status: Slices 1–6 are implemented locally. Real email activation and production deployment still require provider configuration and release verification. See [implementation progress](./implementation-progress.md) for evidence and remaining work. This plan is not a production deployment record. Only owner-finalized, documented public pages may be changed; Slice 6 uses the existing homepage and Contact page.

## Target outcome

Service-page scope update: generated pillar/detail pages were removed at the owner's request. Do not create or import service pages automatically. The owner will add finalized service content later. Keep the original homepage service cards within the existing homepage and link Services navigation to its section.

Manage website content, services, blog posts, projects, media, SEO, site settings, and contact inquiries from a private admin dashboard. Preserve the current public design and approved wording while replacing local content imports with CMS data.

Selected CMS: Payload. Proposed application stack: Next.js App Router, PostgreSQL, persistent object storage for uploads, and a server-side email provider. Confirm compatible package versions and hosting requirements when implementation starts. Provider selection and operating costs remain open decisions; no paid services are assumed to be authorized.

The seven slices below follow the previously proposed implementation order. Complete each slice's acceptance checks before moving to dependent work. Keep the existing Vite application runnable until the replacement passes staging verification.

The owner will use this dashboard without coding. The companion [Content and optimization controls plan](./content-and-optimization-plan.md) specifies each editing action, its required implementation, and its acceptance checks. It expands these same seven slices; it does not introduce a different implementation sequence.

## Existing baseline and constraints

- Public application: `src/App.tsx`, React Router, Tailwind, and Motion.
- Main content: `src/content/approved.json`; profile and contact links: `src/content/approved.ts`. Some display copy also lives directly in components and must be inventoried.
- Blog content: `src/content/blog.json`, with original manuscript snapshots and source notes under `content-reference/`.
- Services and selected work currently use homepage anchors. Standalone service pages are new functionality.
- Page and article metadata are mostly updated in browser effects. Only the calculator has a dedicated build-time prerender script.
- Contact submissions use an optional endpoint, otherwise opening an email draft.
- Calculator behavior is documented in `README.md` and covered by `scripts/mvp-budget.test.mjs`.
- Preserve approved copy, original blog titles, summaries, metadata, and manuscript wording. Import publication state conservatively: existing local previews do not establish publication dates or approval to publish.
- Preserve calculator calculations, unresolved-input handling, currency behavior, downloads, print output, and editable handoff into the contact form. Keep visitor calculator inputs out of CMS storage.

## Slice 1 — Define content models and migration contracts

**Outcome:** A documented schema and source-to-CMS mapping, ready for backend implementation.

**Work**

1. Inventory existing routes, text, images, links, metadata, and forms. Record current desktop/mobile reference screenshots and calculator behavior.
2. Define collections and singleton settings:

| Model | Main fields |
| --- | --- |
| Pages | Stable page key, title, slug where applicable, typed sections, SEO, draft/published state |
| Services | Title, unique slug, category, summary, body sections, benefits, process, FAQs, CTA, image, display order, SEO, publication state |
| Posts | Title, unique slug, exact excerpt/body, category, illustration kind or image, related posts, optional publication date, SEO, publication state |
| Projects | Title, description, project relationship/context, image, optional verified link, display order, publication state |
| Media | File, alt text, optional caption, dimensions/type |
| Site settings | Profile, contact details, social links, logo, navigation, footer, default SEO |
| Users | Identity and administrator/editor role |
| Inquiries | Name, email, message, optional budget/timeline, received time, workflow status, notification status |
| Redirects | Old path, destination, permanent/temporary type |

3. Define reusable SEO fields: title, description, social image, optional canonical override, indexing controls. Generate normal canonical URLs from the production domain and route.
4. Use a small set of typed content sections matching the existing design. Define which sections can be reordered, required sections, and allowed repetitions.
5. Define field validation, slug uniqueness/reserved paths, URL protocols, and deletion rules for referenced media/content.
6. Write the permissions matrix: public users read published public content only; editors manage content drafts; administrators publish and manage users/settings/inquiries. Enforce publish permissions through server-side rules.
7. Specify the owner-facing Content, Links, SEO, and Publishing tabs. Model link labels/destinations, page references, section anchors, heading hierarchy, image alt text/decorative status, social overrides, and guided structured-data inputs as described in the companion plan. Prefer simple choices with useful defaults over raw code fields.

**Deliverables:** Schema specification, route inventory, permissions matrix, import mapping, and explicit list of missing service copy/assets.

**Acceptance:** Every existing public content element has a destination or a documented reason to stay in code. Draft visibility, service URLs, and editorial ownership are unambiguous. No new service claims or publication dates are invented.

## Slice 2 — Set up Payload, PostgreSQL, and admin access

**Depends on:** Slice 1.

**Outcome:** A functioning local CMS with secure editing and repeatable database setup.

**Work**

1. Create the target Next.js/Payload application in a separate project directory while keeping the Vite app available as a reference. This establishes the backend host; public UI migration belongs to Slice 3.
2. Configure PostgreSQL, checked-in migrations, environment validation, and separate development/staging/production configuration.
3. Implement the content collections, singleton settings, validation, relationships, and media uploads from Slice 1.
4. Set up administrator bootstrap, login/logout, session handling, and editor permissions. Prevent public user registration or role escalation.
5. Enable content drafts and revision history; implement publish restrictions and protected preview access. Hide inquiries and users from public APIs.
6. Choose deployment/runtime and storage requirements early enough to avoid incompatible hosting choices. Use local media only for development and a persistent storage adapter for staging/production.
7. Document local setup and server-only secrets. Keep credentials out of client bundles and repository files.
8. Configure the SEO plugin, rich-text link controls, media fields, redirects, and readable help text. Group advanced canonical/indexing/link options separately. Store dashboard fields here; connect their public behavior in Slices 3–5.

**Deliverables:** Local `/admin`, database migrations, media configuration, role rules, environment example, and setup instructions.

**Acceptance:** An administrator can create, edit, preview, publish, and restore sample content. An editor cannot publish or manage roles. Anonymous requests cannot read drafts/inquiries or mutate protected content. A fresh database can be initialized from migrations, and data persists across application restarts.

## Slice 3 — Move the existing public design into Next.js

**Depends on:** Slice 2.

**Outcome:** The current website works in the target application with its existing appearance and interactions.

**Work**

1. Port fonts, styles, shared components, images, navigation, and layouts.
2. Recreate Home, About, Contact, Blog, article, calculator, and not-found routes, preserving existing URLs and anchors.
3. Use the existing local content through a temporary server-side adapter so the rendering migration can be checked independently of data import.
4. Render public page content on the server or during page generation. Isolate browser-only interactions into client components.
5. Port blog search/filter URL behavior, mobile navigation, animations, forms, calculator navigation state, printing, and downloads.
6. Keep one owner for route metadata; remove competing browser title/description effects as routes move over. Full CMS-driven SEO follows in Slice 5.
7. Build responsive image rendering, stable layout dimensions, appropriate image loading, accessible content/link/button rendering, and lean client bundles. Record baseline performance measurements on representative routes using documented conditions.

**Deliverables:** Equivalent Next.js public routes and a short record of intentional framework-related differences.

**Acceptance:** Direct visits, refreshes, internal links, and unknown URLs work. Public text appears in returned HTML. Desktop/tablet/mobile layouts match the baseline, keyboard navigation works, calculator regression checks pass, and calculator-to-contact handoff preserves the existing memory-only behavior.

## Slice 4 — Import existing content and connect the CMS

**Depends on:** Slice 3.

**Outcome:** Existing pages and articles are editable through the dashboard.

**Work**

1. Build a repeatable import with dry-run output and stable source identifiers. Re-running it must not duplicate content or overwrite later editorial changes without an explicit update mode.
2. Import approved page copy, profile/settings, service summaries, project content, blog manuscripts, metadata, and image references.
3. Preserve original manuscript snapshots and report import differences. Convert markdown to the chosen CMS format without losing headings, emphasis, lists, tables, or links.
4. Keep imported content in draft until reviewed; do not assign artificial publication dates. Use protected preview for comparison.
5. Replace public JSON imports and temporary adapters with shared CMS query functions that enforce published-only reads. Audit any privileged local API calls so they cannot bypass public access restrictions.
6. Add stable rendering of rich text and safe links, including handling deleted references and unavailable content. Define failure behavior without silently reverting to stale JSON.
7. Connect the owner's content actions: anchor-text editing, internal page selection, external links, section links, image descriptions, heading levels, button labels/destinations, navigation, related content, and approved section ordering. Check these actions in both preview and published rendering.

**Deliverables:** Import script/report, CMS-backed page rendering, and content parity checklist.

**Acceptance:** Imports are repeatable, approved wording and article structure match their sources, and no duplicate records appear. Dashboard edits appear in protected preview. Anonymous rendering excludes drafts and private fields. Public components no longer depend on legacy content files as their live source.

## Slice 5 — Build service pages and complete SEO/publishing

**Depends on:** Slice 4.

**Outcome:** Services can be published as searchable pages, with CMS-controlled metadata across the site.

**Work**

1. Build `/services/` and `/services/[slug]/` using the established design. Connect homepage service cards and navigation to the appropriate destinations.
2. Populate service details only from supplied or reviewed copy. Require essential content before publishing; keep unfinished services in draft.
3. Render CMS titles, descriptions, canonical URLs, social metadata, and appropriate structured data. Define site defaults and page overrides.
4. Generate a sitemap from published canonical routes and configure robots behavior. Protect previews and keep drafts out of public indexes and sitemaps.
5. Add redirect management for slug changes, block redirect loops/reserved-route collisions, and return correct HTTP not-found/redirect responses.
6. Connect publish, update, unpublish, and deletion events to cache invalidation or regeneration. Refresh affected pages, homepage cards, article lists, related content, and sitemap. Document refresh timing and retry failed refreshes.
7. Implement the metadata, social previews, internal link/fragment checks, indexing/canonical rules, structured-data templates, and publishing checks from the companion plan. Distinguish editable SEO values, computed diagnostics, and features requiring custom development.

**Deliverables:** Service routes, SEO fields wired to HTML, sitemap/robots output, redirect support, and publish refresh mechanism.

**Acceptance:** A reviewed service can be drafted, previewed, published, edited, and unpublished through the dashboard. Public content and metadata refresh within the documented interval. Unpublished pages disappear from public listings and sitemap. Old slugs redirect correctly, unknown slugs return HTTP 404, and page-specific metadata is present in the HTML response without browser JavaScript.

## Slice 6 — Deliver and manage contact inquiries

**Depends on:** Slice 5.

**Outcome:** Visitors can submit an inquiry reliably, and administrators can manage it privately.

**Work**

1. Implement a dedicated server-side submission endpoint for the existing form fields. Reject unexpected fields, oversized payloads, invalid email addresses, and invalid requests.
2. Add server-enforced rate limiting and spam controls suitable for the selected deployment; apply appropriate origin/CSRF protections.
3. Store accepted inquiries privately, then send an administrator notification with retryable delivery and visible notification status.
4. Add inquiry statuses such as new, read, and replied. Status tracking does not require building an email inbox or reply composer.
5. Prevent duplicate records/notifications on retries. Show success only after durable acceptance; distinguish acceptance from notification delivery. Preserve visitor input on failure.
6. Connect homepage and Contact forms, including the editable calculator summary. Keep provider keys server-side.
7. Define retention/deletion behavior and provide privacy wording based on the actual providers and stored data. Avoid logging message bodies or email addresses unnecessarily.
8. Let the owner edit form introductions, field labels/help text, submit-button text, booking links, and truthful confirmation copy while preserving required validation and delivery behavior. Keep delivery credentials and technical configuration server-side.

**Deliverables:** Submission endpoint, private inquiry list/detail view, email integration, and user-facing success/error behavior.

**Acceptance:** A valid submission produces one private inquiry and a notification attempt. Invalid/spam/rate-limited submissions are handled correctly. Anonymous users cannot list, read, update, or delete inquiries. Database failures do not show success; email failures remain visible and retryable after acceptance. Both forms and calculator handoff work end to end.

## Slice 7 — Verify, deploy, and hand over

**Depends on:** Slice 6 and resolved production configuration/content decisions.

**Outcome:** A verified production site, a working admin dashboard, and a recovery procedure.

**Work**

1. Provision staging with PostgreSQL, persistent uploads, email configuration, and server secrets. Keep staging access controlled and out of search indexes.
2. Run the final migration/import rehearsal, content comparison, role/access checks, responsive review, calculator regression checks, SEO checks, and inquiry delivery tests.
3. Configure production domain, HTTPS, canonical base URL, backups for database and uploads, error monitoring, and uptime checks.
4. Rehearse restoration and rollback, including compatibility between application versions and database migrations. Document migration order and content-edit handling during cutover.
5. Review publication state and dates, final service copy, navigation links, and actual privacy wording before making pages public.
6. Prepare a release checklist and a concrete staging review. Production cutover follows explicit deployment authorization; planning and local implementation do not change DNS or purchase services.
7. Deploy, verify critical routes/admin/forms against production, confirm sitemap and robots output, and submit the sitemap through the owner's search-console account when access is available.
8. Provide operating instructions: editing, drafts/previews, publishing, SEO, media, redirects, inquiries, account recovery, backups, and updates.
9. Complete the companion plan's owner walkthrough, link/metadata/status-code checks, mobile accessibility review, and performance comparison. Distinguish local/staging measurements from real-user data available only after launch. Add links to the owner's verified search-console property when access is available; embedded analytics reporting is separate scope.

**Deliverables:** Production deployment, verification record, restore/rollback guide, and editor handover guide.

**Acceptance:** The owner can log in, edit a service/page, preview it, publish it, see updated public content/SEO, and receive a contact inquiry. Uploads survive redeployment. A backup has been restored successfully in a safe environment. Production content is indexable as intended while admin, previews, and private data remain protected.

## Decisions to resolve during implementation

| Decision | Needed by | Working assumption |
| --- | --- | --- |
| Validate application-stack compatibility | Slice 2 | Payload selected; Next.js + PostgreSQL proposed |
| Hosting, database, uploads, email providers and budget | Slice 2 for compatibility; Slice 7 for production | Separate staging and production; persistent uploads |
| Production domain and canonical URL | Slice 5 | Configured per environment; no placeholder domain at launch |
| Editor accounts and publishing permissions | Slice 2 | One administrator; add editor accounts only as needed |
| Service detail copy and publication approval | Slice 5 | Existing summaries are preserved; incomplete pages stay drafts |
| Article publication status and dates | Slice 4 import; Slice 7 release | Draft until reviewed; no fabricated dates |
| Inquiry retention and notification recipient | Slice 6 | Private storage; recipient configured server-side |

## Scope boundary

This release covers content administration, publishing, SEO, media, redirects, and inquiries. Payments, customer accounts, CRM synchronization, multilingual content, an unrestricted visual page builder, analytics dashboards, and calculator pricing-rule changes require separate scope decisions.

Each slice should end with a short change summary, its verification evidence, and any unresolved dependencies. Estimate effort after Slice 1 and the hosting compatibility check; the current repository inspection does not establish a reliable delivery date or operating cost.
