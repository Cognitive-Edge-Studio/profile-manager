# Shibly Mohammad Noman

## MVP cost calculator

The local tool is at `/tools/mvp-cost-calculator/`. The cost article has a separate tool link, and the footer links to the calculator. Retained article text and metadata are unchanged.

This first version is a supplied-cost planner: visitors enter costs or effort hours and their own planning rate. There are no default service rates, feature-hour estimates, or automatic price claims. The imaginary example is clearly labelled throughout the results, contact summary, and download.

Scope choices feed an itemized build budget, a configurable operating period, and a smaller-release build comparison. Unknown and invalid amounts stay unresolved. Included items require a containing entered line. Shared work is counted once. All monetary inputs use a single selected currency; switching currencies clears amounts rather than converting them. Switching between costs and hours clears build figures. Amounts support up to two decimals.

Answers remain in module memory while navigating the SPA and clear on reload/close. Download produces a plain-text summary. Print / save PDF uses the browser print dialog and a report-only stylesheet. Discuss this scope passes an editable summary into the existing contact form using router state, without sending it. Calendly remains a separate route. No new analytics or network submission was added.

Run `npm run test:calculator` for the budgeting regression cases. `npm run build` type-checks, builds, and prerenders the calculator route with readable initial HTML and page-specific metadata. The build needs Node.js with TypeScript stripping support to run the test script (verified with Node 24). Prerendering uses the installed Vite and React packages and introduces no dependency.

Before public deployment, use the real production domain for canonical URLs and sitemap configuration. An automatic service-price estimator would additionally need Shibly's reviewed effort baselines, cost basis, and supported-scope rules. This implementation does not establish those inputs.

A local Vite website for Shibly Noman, freelance full-stack developer. Built with React, TypeScript, Tailwind CSS v4, reusable shadcn-style components, and Motion. Fonts are bundled locally.

## Run

```sh
npm install
npm run dev
```

`npm run build` type-checks and builds `dist/`. `npm run preview` serves the production build. Static hosting must fall back to `index.html` for the About, Contact, and Blog routes.

## Approved content

The three finalized documents from the website planning project were imported into `src/content/approved.json`. Unmodified source snapshots are in `content-reference/`:

- `homepage-copy.md`
- `about-page-content-plan.md`
- `contact-page-copy.md`

Public copy preserves the finalized wording. Editorial notes and frontend instructions are excluded from the rendered pages. The homepage follows the planned section order. Services are grouped into AI Systems & Integration, Application Development, and Infrastructure & Operations. Actual project mentions distinguish personal, previous-employer, and client work. They do not claim case-study outcomes or link to invented case studies.

Home, About, Contact, and Blog are implemented. The blog includes search, topic filters, and local article reading routes. Navigation to Services and Selected Work uses homepage section anchors while their standalone pages remain future work. Privacy is omitted until a policy based on the actual deployment exists.

## Contact

The email address, LinkedIn, GitHub, and Calendly URL come from the approved copy and wireframe. Name, email, and project description are required. Budget is optional. The homepage form also includes the planned optional timeline.

Without a backend, submission opens a prefilled draft addressed to `shibly.work@gmail.com`. The page clearly says the visitor must send it from their email application. It never displays the approved success confirmation as though a message was received.

To enable real delivery, copy `.env.example` to `.env.local` and set `VITE_CONTACT_ENDPOINT` to a JSON POST endpoint you control. The endpoint must return a successful HTTP status only after accepting the message. Only then is the approved submission confirmation displayed. Failed submissions keep the visitor's details. Credentials belong on the server, never in Vite environment variables.

## Artwork and portrait

The homepage hero uses the supplied portrait, `public/images/shibly-noman-full-stack-developer.jpg`. The header, footer, and favicon use the supplied close-up, `public/images/shibly-noman-avatar.jpg`. A bespoke workspace illustration remains on About. See `ASSETS.md` for asset details.

Both photographs were supplied by the user and copied unchanged. Set `VITE_PORTRAIT_URL` to use a supplied portrait in the About illustration slot as well.

## Verification

The production build and source-to-rendered-content checks pass. The Blog landing page was visually checked on desktop, 768px tablet, and 390px mobile viewports. Topic filtering, empty search results, resetting filters, and article navigation were verified in the browser.



## Recent interface updates

Technology badges include current brand marks stored locally, with icon version and source links in content-reference/technology-icon-sources.json. On Contact, the Calendly booking button is inside the form card alongside the send action; the separate left booking section has been removed. The About introduction uses a solid primary orange Contact me button.



## Blog

The blog landing page is at `/blog/`, linked in the desktop/mobile header and footer. Search and topic filters persist in URL parameters. Illustrations use local HTML/CSS. Blog code and the five retained manuscripts load separately from the main website. Article readers support headings, lists, tables, and related article links; research and SEO metadata are excluded. Reading times are calculated at 220 words per minute. Source references are in `content-reference/blog-source-notes.json`. This is a local preview; publication dates and published status are not asserted.


## Blog copy requirements

Use the original article H1 titles, At a glance summaries, metadata, and body wording from the saved manuscripts. Do not rewrite or shorten article titles or excerpts. This applies to article pages, featured articles, blog lists, and related cards. Original snapshots and hashes are recorded in `content-reference/blog-source-notes.json` and `content-reference/blog-copies/`. The requested numbered ongoing-cost list is retained as a formatting change. Decorative blog illustrations contain no authored slogans.

The homepage contact links now include the official Calendly icon beside GitHub and LinkedIn. The separate homepage booking block has been removed. The existing Contact form booking button retains its place and uses the same inline official icon.
