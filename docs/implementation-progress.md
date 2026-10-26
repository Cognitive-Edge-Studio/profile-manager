# Implementation progress

## Current checkpoint

Owner-requested change: the generated Services pillar and nine service page drafts were deleted. Five original page records remain. Original homepage service summaries are now editable inside Home's Services section, and navigation targets `/#services`. The Services collection is empty for future owner-authored pages. Imports no longer create standalone service pages. This supersedes the earlier Slice 5 content counts; its historical evidence is retained.

The Payload CMS and Next.js website are connected locally under `cms/`. The original parent Vite app remains runnable as a reference. No external deployment has occurred. Imported records remain drafts and images private until reviewed. Public pages read published CMS records only.

| Slice | Status | Evidence / next work |
| --- | --- | --- |
| 1 — Contracts and inventory | Implemented | Stable content/route contracts, permissions matrix, source fingerprints, missing-copy list, three contract checks |
| 2 — CMS foundation | Implemented locally | Models, PostgreSQL migration, owner bootstrap, roles, drafts, revisions, private content preview, media/privacy rules, metadata/link controls; ten passing database integration checks, HTTP verification, generated types, production build |
| 3 — Public design migration | Implemented locally | Ten routes, original styles/copy/assets, server-readable articles/metadata, responsive images, blog filters, navigation, calculator handoff; production build and HTTP/browser checks pass |
| 4 — Content import and connection | Implemented locally | Repeatable draft import with stable record/image IDs, protected design previews, published-only queries, safe rich text, editable sections/navigation/buttons/images, retained source snapshots |
| 5 — Services and SEO behavior | Implemented locally | Service index/detail templates, metadata/social/schema, sitemap/robots, transactional slug redirects, owner publishing checks and fresh public reads |
| 6 — Contact delivery | Implemented locally; real email disabled | Existing homepage/Contact forms, durable private storage, validation/spam limits, deduplication, notification outbox/retries, admin workflow and retention worker; sending-service setup remains required |
| 7 — Release and handover | Planned | Staging, owner walkthrough, production providers/domain, persistent uploads, backups/restoration, operational verification |

## What has been verified

- Inventory: three approved source pages, nine services, four project mentions, five articles, ten existing routes, and fifty image/icon files. Original copy, article metadata and publication-date uncertainty remain recorded.
- Unit/contract checks: exact baseline preservation, unsafe URLs/system-address rejection, and publishing-role decisions.
- Database integration: fresh migration; closed first-user signup; draft/version/private-data isolation; public field filtering; editor role restrictions; safe draft revisions; revision restoration; final-admin guard; server-side validation; private media access.
- HTTP: owner sign-in, denial of anonymous private API access, draft isolation, authenticated content preview, administrator publishing, and cleanup of the temporary record.
- Browser: owner login, dashboard collections, service content/link controls, and a single SEO tab with metadata, social, indexing, and canonical fields.
- Existing Vite application: production build and all twelve calculator regression cases pass.
- Migrated Next.js website: all ten existing URLs return 200, missing pages/articles return HTTP 404, and titles/descriptions are present in initial HTML. All five article manuscripts retain every word in order and their tables. Fifty copied assets match the source checksums; full manuscripts are excluded from client JavaScript bundles.
- Responsive comparisons: six representative routes at 1280px, 768px, and 390px. Original desktop/phone geometry is preserved. The existing Contact overlap at tablet widths is fixed in the migrated stylesheet only.
- Browser interactions: mobile menu, keyboard skip link, article carousel, blog topic/search/reset URLs, calculator example/download/print report, editable contact summary, return-to-plan state, and clearing on reload. No inquiry was submitted. The production homepage loads without browser warnings/errors.
- Repeated after migration: production build, three contract checks, ten database integration checks, and CMS HTTP verification all pass. Evidence: `cms/docs/slice3-browser-checks.json`, `cms/docs/slice3-http-checks.json`, and `cms/docs/screenshots/slice3/`.

## Scope of the checkpoint

The CMS editor, backend, and website are usable locally at port 3000. Public content reads Payload through an explicit published projection; no legacy JSON fallback remains. Five original pages, nine summaries in the Home Services section, four project mentions, five full articles, site settings, and three images remain drafts/private records. The standalone Services collection is empty after the requested removal. Use the dashboard's Preview for saved drafts. Unpublished pages, articles and services return HTTP 404. Metadata, canonical/social output, structured data, sitemap, robots and redirects are connected. Local deployments remain noindex; production indexing requires an explicit opt-in and HTTPS SITE_URL.

The calculator uses the original calculation module and keeps visitor inputs in browser memory, including across page-shell navigation. The finalized homepage and Contact forms now use the same private inquiry backend. A JavaScript-disabled form offers a direct email fallback. The build still uses parent styles, calculator arithmetic, and technology-icon assets. Calculator tool explanations, decorative art, and form validation remain code.

Slice 4 evidence is in `cms/docs/slice4-import-dry-run.json`, `cms/docs/slice4-http-parity.json`, and `cms/docs/slice4-publishing-checks.json`. Import conversion verifies every visible manuscript word in order, with editable lists/tables/links. Repeat imports retain IDs, editorial changes, and update times. Query tests cover private fields, draft revisions, unavailable references, and settings isolation. HTTP fixture tests cover the full draft-preview-publish-unpublish cycle without publishing imported owner content. See `cms/docs/content-editing.md` for the owner workflow.

Final Slice 4 checks pass: production build, three contracts, seventeen database tests, twelve calculator cases, CMS HTTP checks, and the disposable published-site lifecycle. Browser evidence in `cms/docs/slice4-browser-checks.json` covers eighteen desktop/tablet/phone checks without horizontal overflow, mobile navigation/filtering, and calculator-to-contact/return/reload behavior. `cms/docs/slice4-local-import-state.json` confirms unique imported records, all twenty-three collection records in draft, settings in draft, and all three images private. No contact message was sent. Screenshots are in `cms/docs/screenshots/slice4/`.

The Windows local database was copied into UTF8 and all table row counts verified; the original and private snapshots/configuration remain retained. One early test selected local configuration too soon; its identified test changes were restored and fixture account removed. Disposable database guards now run before test writes. This did not affect an external website.

The local owner credentials are in `cms/.local/owner-credentials.json` and are ignored. Email is disabled until its provider is configured. Production hosting, persistent upload storage, account-recovery delivery, backups and deployment remain unfinished. Service details and real article publication decisions are still content inputs before release.

## Slice 5 checkpoint

Service pages use reviewed CMS body, benefits, process, FAQs, images, actions and related content. All nine actual service summaries remain drafts with no invented detail claims. Publication requires nonempty detail copy and the review checkbox. The Services index reuses the approved existing introduction; source-default navigation now selects that page. Original Vite source files remain unchanged.

SEO defaults and manual overrides render in initial HTML. Canonical address remains the field label and auto-generation buttons remain removed. Social images use the actual generated dimensions. Safe JSON-LD uses visible Person, Article, Service and Breadcrumb facts; imported articles have no inferred dates. Sitemap excludes drafts, noindex, redirected sources and alternate canonicals. Production noindex pages remain crawlable; local robots disallows crawling.

Published slug changes create transactional permanent redirects; successive renames point directly to the final address and restoring an older slug works. Required published references guard unpublish/deletion/fragment changes; optional unavailable cards disappear. Publishing checks show saved-draft errors, suggestions, effective SEO, incoming records and a live-response check/retry. Public rendering, navigation, metadata and sitemap use fresh dynamic reads with no persistent output cache. Reload an open tab after publishing. Third-party social preview caches are outside this mechanism.

Verification: production build; nine unit/contract checks; twenty-four database integration checks; twelve calculator regressions; disposable published-content HTTP lifecycle; production-mode SEO/redirect HTTP checks. See `cms/docs/slice5-http-checks.json`, `cms/docs/slice5-browser-checks.json`, `cms/docs/slice5-local-import-state.json` and `cms/docs/screenshots/slice5/`. The fixture uses a separate database and example.test canonical origin, served only over loopback; actual imported content was not published. Owner steps and operational limits are in `cms/docs/content-editing.md` and `cms/docs/seo-and-publishing.md`.

## Slice 6 checkpoint

Scope follows the owner's instruction: no new public pages; only the finalized homepage and Contact form were connected. Their layout and calculator arithmetic remain intact. Inline form instructions, existing Site settings and private Inquiries controls were extended. Required validation and acceptance copy stay application-controlled; headings, labels, helper text, placeholders, CTA wording and next-step notes remain editable.

The dedicated JSON endpoint validates origin, signed short-lived token, honeypot, body size and strict fields. A PostgreSQL transaction applies keyed rate limits and deduplication before storing one private inquiry plus its notification outbox state. Success requires commit. Retryable failures preserve visitor input, including edited calculator summaries. Anonymous users and content editors cannot read inquiries; administrators track new/read/replied without sending a reply. Original submitted details and delivery bookkeeping are protected against ordinary edits.

Notification work uses leases, a snapshotted envelope, provider idempotency, bounded retries and an owner retry control. Ambiguous old attempts stop for review. A custom worker/secret-authenticated maintenance endpoint also applies scheduled retention. The local default is 180 days and needs policy review before launch. Notifications contain only a private dashboard link, not visitor message/contact details. The requested recipient is set privately; the displayed website email is unchanged. Resend integration is prepared, but no sender verification/API key or external email delivery has been configured. Real email remains disabled. Account-recovery delivery still needs separate setup.

Checks cover strict invalid requests, concurrent/repeated retries, role/privacy rules, actual HTTP storage failures, notification failure/capture/provider retries, retention, mutable owner form copy and browser submission from both existing forms. The calculator handoff remains editable; failed submissions retain it and successful submissions clear the shared summary. Responsive checks cover 1280/768/390 widths with no horizontal overflow. Evidence and owner/developer instructions are in `cms/docs/contact-delivery.md` and the Slice 6 JSON/screenshot reports. All actual imported content remains draft/private; testing used separate disposable databases and no real email. Production providers, worker scheduling, storage, backups and final owner release review remain Slice 7.

