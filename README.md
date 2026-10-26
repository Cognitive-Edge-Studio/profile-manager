# Shibly Noman website and CMS

Owner-requested service-page removal: the generated Services pillar and nine service drafts are deleted. Five original Pages remain; Services is empty. Original service cards are editable in Home's Services section, and navigation points to `/#services`. The importer does not recreate standalone service pages. Empty CMS templates are retained for the owner's manual additions later. Evidence: `docs/service-page-removal.json` and `docs/service-page-removal-checks.json`.

This repository contains one self-contained Next.js/Payload application at its root. It serves the public website, private admin, and API together. The older Vite application has been removed; its shared styles, calculator logic, content sources, assets, and verification tools now live inside this application. No production site, DNS, email provider, or hosting account has been changed.

## Repository layout

- `src/app/`: website routes, admin, and API endpoints.
- `src/website/`: website components, runtime, and styles; `styles/` contains the shared design, blog, and calculator CSS.
- `src/lib/`: shared calculator arithmetic.
- `src/content/`: retained approved copy and icon mappings. Content import tools use the original copy; public pages read published CMS records.
- `src/migrations/`: database migrations.
- `public/`: website images, technology icons, and favicon.
- `migration/` and `content-reference/`: importer, reviewed source inventory, and original manuscripts.
- `scripts/` and `tests/`: local tools and unit, integration, and website verification.
- `docs/`: editing guides, planning history, and verification evidence.

Run all npm commands from the repository root. No parent-directory files or separate frontend installation are required. The structural change is documented in [the refactor notes](docs/repository-structure.md).

## What works now

- Private administrator sign-in and administrator/editor roles.
- Pages, services, articles, project mentions, images, site settings, redirects, and private inquiry records.
- A single Content / Links / SEO / Publishing tab bar on page/service/article editors.
- Rich-text editing, internal/external links, heading choices, image descriptions, and section anchors.
- Search titles/descriptions/images, optional social overrides, canonical/indexing fields, and the SEO plugin's indicative preview. Plugin length indicators are suggestions; they do not guarantee search appearance or ranking.
- Saving drafts, administrator publishing, revisions/restoration, and authenticated previews in the website design for saved pages/articles. Service previews include their detail design; project mentions remain homepage cards.
- Validated addresses/links, draft/private-data isolation, private-by-default image uploads, login throttling, closed public signup, and a guard against removing the final administrator.
- Initial PostgreSQL migration, checked-in generated Payload types/import map, and repeatable source-inventory checks.

Public routes read published Payload content: page sections, service summaries, projects, articles, navigation, buttons, images, titles, and descriptions. Draft edits appear only in protected previews. Imported records/images remain draft/private until reviewed; unavailable public pages return 404. See [the editing guide](docs/content-editing.md). Service index/detail templates, SEO policies, sitemap/robots, HTTP redirects and Publishing checks are connected. Public data refreshes on the next request. The existing homepage and Contact forms save inquiries privately with notification retry handling. Actual email activation needs sending-service configuration; deployment is Slice 7. No new public pages were added in Slice 6. See [contact delivery](docs/contact-delivery.md). See [SEO and publishing](docs/seo-and-publishing.md).

## Public design migration

Open <http://127.0.0.1:3000/admin/> to review imported drafts and use Preview. `src/website/content.ts` is the server-only entrypoint to published CMS queries. Live content does not import legacy JSON. Styles, calculator arithmetic, and technology-icon mappings are local to this repository. Full article manuscripts stay on the server; interactive lists receive summaries. Original article dates remain blank.

The migration uses the original styles and Google Sans stylesheet, with locally bundled Manrope as fallback. Copied image/icon files remain unchanged; responsive portraits use Next.js image optimization. Existing trailing-slash URLs remain valid. Local deployments and private previews remain noindex. Production indexing requires an explicit HTTPS SITE_URL and PUBLIC_INDEXING_ENABLED=true.

One existing tablet layout defect was corrected: between 561px and 800px, the Contact introduction and form now stack without overlap. Desktop and phone layouts retain the original arrangement. Both existing contact forms now save private inquiries through the application backend when enabled. Preview submission is disabled; production submission requires published source pages/settings. Without JavaScript the form is disabled and offers a direct email link. Calculator plans remain in memory, including the editable contact handoff; reloading clears them.

Browser comparisons and interaction evidence are recorded in `docs/slice3-browser-checks.json`, with screenshots in `docs/screenshots/slice3/`. Checks cover desktop, tablet, phone, blog filters, keyboard access, mobile navigation, and calculator download/print-report/contact/return behavior. No contact message was sent during verification.

## Local setup

Use a compatible Node runtime (`^22.23.4 || >=24.22.1`) for deployment. On Windows this project also installs its own optional Node 24.22.1 binary; the command launcher selects it automatically without changing the system Node installation. npm installation itself may show engine warnings if the system Node is older; the application commands use the local runtime.

From this directory:

```powershell
npm install
npm run setup:local
npm run db:local
```

Leave the database command running. In another terminal in this directory:

```powershell
npm run payload -- migrate
npm run bootstrap
npm run dev
```

Open <http://127.0.0.1:3000/admin/>. The one-time bootstrap stores the generated local sign-in details in `.local/owner-credentials.json`; open that private file locally. Passwords are not printed, and rerunning bootstrap retains the existing account. Do not commit, share, or deploy the local credentials file.

`setup:local` preserves existing configuration. PostgreSQL listens only on loopback at port 55432 and persists data in `.local/postgres`. This embedded PostgreSQL package is a development dependency, not the production database strategy. Stop the database/application commands with Ctrl+C. Uploaded files are local to `uploads/`; production persistent object storage is still required.

Local secrets live in the ignored `.env.local`. The example has no usable credentials. Keep the CMS URL consistent when sharing a local preview. Raw settings APIs require authentication. Public rendering uses a narrow projection of the published settings version.

## Verification

```powershell
npm test
npm run verify:inventory
npm run typecheck
npm run test:integration
npm run build
npm run verify:http
npm run verify:seo
npm run verify:contact
```

The CMS HTTP command requires the database, local owner account, and application at port 3000. It creates and removes one temporary service record; it does not edit approved content. Website verification checks ten routes, complete article wording/tables, initial metadata, real 404 responses, filter URLs, responsive images, and client bundle isolation. Its local timings are diagnostics, not real-user Core Web Vitals.

Integration tests create a uniquely named database on the loopback PostgreSQL server, apply the committed migration, verify access/publication rules and image privacy, then remove only that test database. The test runner exits explicitly because the Payload adapter retains PostgreSQL reconnect clients. No production database is accepted by the test script.

To run the production build locally after stopping the dev server:

```powershell
npm run start
```

`npm test` includes the twelve calculator regressions alongside the CMS unit tests. `npm run test:calculator` runs those cases alone. `npm run verify:inventory` checks retained source content, shared logic, styles, and assets against the reviewed baseline. Regenerate that baseline only after intentionally reviewing source changes. `npm run sync:icons` regenerates the technology icon assets and their source references.

## Administration and remaining deployment work

The initial administrator is created locally rather than through a public first-user setup page. New team members can be added by an administrator. Editors can save drafts and revise published content in draft mode, but cannot publish/unpublish, change roles, or access inquiries. Administrators manage global settings, redirects, and public media visibility. Search/social/canonical/indexing metadata and structured data render from CMS values. Required reference guards, reviewed service copy requirements and actual HTTP redirects are enforced on the server.

Email delivery is intentionally disabled rather than logging password-reset emails or tokens to the terminal. Inquiry notification delivery/retries are implemented but require a configured provider for real email. Account-recovery email and production bootstrap still need release setup. Software updates, backups/restoration, provider credentials, and production operations remain developer responsibilities.

Before deployment, select the production domain, supported hosting, PostgreSQL, persistent uploads, and email delivery. Run migrations separately; development schema push is disabled. Review actual privacy wording, publication state, service detail copy, and article publication dates before making content public. Never deploy `.local`, `.env.local`, or the development database.

## Content import and verification

From the repository root, run `npm run import:content` for a dry run, or `npm run import:content -- --apply` to create missing drafts. Stable source IDs cover records and images. Re-running retains existing records and later edits. Reports in docs/slice4-import-*.json identify differences. `--apply --update-source` explicitly replaces imported fields in draft revisions; it never publishes those revisions. Use that mode only after reviewing editorial changes. Import tools accept local loopback databases only.

`npm run verify:content` starts the production build on port 3002 against a uniquely named disposable UTF8 database. It checks all ten published routes and manuscript wording, then exercises draft/public isolation, edited headings/links/buttons/anchors, image descriptions, section ordering, navigation/footer changes, publishing, and unpublishing. It removes its database and uploaded fixtures. Local owner content is not used. A database-name guard runs before writes. `npm run test:integration` also checks repeat import behavior and retained editorial changes. Run `npm run build` first. The older `verify:website` command expects a reviewed, published content set; draft-only local data intentionally cannot pass its public-route expectations.

The Windows development database initially used WIN1252. The local data was copied and row counts verified in a UTF8 database so existing Unicode copy can be stored. The original database and private table/configuration backups remain in .local/backups. New local databases and test databases explicitly use UTF8. The local encoding repair script is scripts/upgrade-local-encoding.ts; never apply it to a hosted database.

During development, an early test loaded database configuration before selecting its disposable database. Its identified homepage/settings test changes were restored to drafts and its fixture account removed. Tests now assert their database name before mutation. No external site or account was changed.




