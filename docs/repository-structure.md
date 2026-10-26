# Repository consolidation

The Next.js/Payload application now occupies the repository root. There is one package manifest, lockfile, public asset directory, and application source tree. The former `cms/` prefix is removed from commands and paths.

Shared files retained from the original Vite application:

| Original file | Current file |
| --- | --- |
| `src/index.css` | `src/website/styles/base.css` |
| `src/design-system.css` | `src/website/styles/design-system.css` |
| `src/blog.css` | `src/website/styles/blog.css` |
| `src/mvp-calculator.css` | `src/website/styles/calculator.css` |
| `src/lib/mvp-budget.ts` | `src/lib/mvp-budget.ts` |
| `src/content/` | `src/content/` |
| `scripts/mvp-budget.test.mjs` | `tests/mvp-budget.test.mjs` |
| `scripts/sync-technology-icons.mjs` | `scripts/sync-technology-icons.mjs` |

Public assets were already identical in both applications and are retained once in `public/`. Original manuscripts, attribution, planning documents, and CMS verification evidence are retained. The Vite entrypoint, router, duplicate components, build configuration, manifest, and prerender script are removed. The CMS already provides the website components, routes, and server rendering.

Source inventory contract version 2 records the relocated styles and retained calculator/content sources. Before updating the baseline, original approved strings, article hashes, route definitions, source style/calculator hashes, and every public image hash were compared with version 1. Only the source-file paths, retired Vite entrypoint fingerprints, contract version, and explanatory constraint changed. Historical sourceSnapshot labels in imported records and older verification reports describe their original provenance and are not current file dependencies.

Local secrets, owner credentials, PostgreSQL data/backups, and uploaded files move with the application into ignored root directories. They are not part of the repository. Restart local processes from the root after relocation; old generated build artifacts must be rebuilt.

The retained icon generator declares its existing Simple Icons 16.35.0 dependency in the root package. Sharp is aligned to 0.35.5, the version already used by Next.js, to share one native image library with Payload. The previous two-version installation caused Windows image optimization to fall back to original JPEG files after Payload initialized. The HTTP verification detected this conflict during the refactor.

Production preparation remains separate: hosted PostgreSQL, persistent upload storage, production administrator/content initialization, environment configuration, and deployment verification are still required.

## Verification

- All 258 original CMS files are present at their root-relative locations.
- All 200 relative source imports checked stay within the repository and resolve.
- `npm test`: 28 unit tests passed, including the twelve calculator regressions.
- `npm run test:integration`: 34 tests passed against disposable local databases.
- `npm run verify:inventory`: original content, source styles, calculator logic, routes, and assets match their reviewed baseline.
- `npm run build`: production compilation and TypeScript checks passed.
- `npm run verify:content`: ten published routes, full manuscript comparison, metadata, filters, image optimization, admin preview access, draft isolation, and publish/edit/unpublish behavior passed in a disposable database.
- Icon generation, dependency/lockfile consistency, and an offline `npm ci --dry-run --ignore-scripts` passed.

Local PostgreSQL, the website on port 3000, and the existing inquiry worker were restarted from the root. Existing owner content remains in its previous publication state. The refactor does not deploy the site or publish drafts.
