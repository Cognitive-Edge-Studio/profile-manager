# Shibly Noman portfolio

The profile, projects, articles, and MVP calculator build into a static Next.js site. Its public content and images live in Git.

## Run locally

Install the dependencies and start Next.js.

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000/. Use these commands to check the export that a static host serves.

```powershell
npm run build
npm run verify:website
npm test
```

The build writes HTML and assets to `out/`. The verification command checks article links and bodies in the initial HTML, page metadata, canonical URLs, the sitemap, and local images.

## Edit the portfolio

The published profile, page sections, navigation, and projects are in `src/content/site.json`. Edit existing text in that file and keep page keys, section anchors, and linked IDs intact. The seven existing articles keep their rich-text JSON in `src/content/posts/`, preserving their tables, links, and images.

## Publish an article

Add a file such as `src/content/posts/launching-your-first-mvp.md`. The filename defines the permanent URL `/blog/launching-your-first-mvp/`. Use lowercase letters, numbers, and hyphens.

```markdown
---
title: Launching your first MVP
description: A practical checklist for getting your first release in front of users.
date: 2026-11-06
category: Planning an MVP
draft: true
---

Start with the smallest workflow you can test with a real user.

## Define the first workflow

Write down the steps a user needs to complete.
```

The title supplies the H1. Use `##` through `####` in the body. Markdown links, lists, quotes, code, tables, and images are supported. Put images in `public/images/blog/`, give them descriptive alt text, and refer to them by a path such as `/images/blog/workflow.webp`. Put inline Markdown images on their own line. For an optional article cover and social image, add `image` and `imageAlt` to the front matter.

Set `draft: false` or remove the draft key when the article is ready. Run the build and verification commands, then commit and push. A Git-connected Vercel project builds the new article when the change reaches its production branch. Keep the article filename stable after publishing.

## Deploy on Vercel

Use the Next.js preset and the repository root. In the Production environment, set `SITE_URL` to the final HTTPS origin with no path. Set `PUBLIC_INDEXING_ENABLED=true` after checking the deployment. Vercel previews stay noindex. See `.env.example` for both settings.

The home and contact pages offer email and booking links. The calculator runs in the browser and provides a summary visitors can copy into an email.

The migration uses an earlier published export for the profile pages, settings, and projects, and the seven published article snapshots from Git. The current local CMS contains draft records. The public domain was unreachable during migration, so compare the static preview with the live site before switching, including any redirects maintained there. The previous CMS implementation and snapshots are available in Git history.
