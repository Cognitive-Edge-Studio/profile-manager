# AI services: persistent strategy and development context

Recorded: 2026-10-29 (Asia/Dhaka).

The user explicitly requested that this context be saved independently of the
chat, including if the chat is deleted. This file is the durable project record;
it is not a claim of account-wide conversational memory. Read it before work on
the AI service pages. Update it when the user changes the plan.

## Business and positioning

- This is one independent freelance developer, not an agency or a team.
- The user describes the developer as capable of building a complete product
  independently and solving a business problem. Specific AI expertise and project
  evidence still need to be established; do not invent them.
- Write client-facing copy in the first person: I / me / my.
- Prefer recognizable industry service terminology and concrete client problems.
- Scope engagements realistically for one developer. Do not imply enterprise-wide
  delivery capacity, staffing depth, continuous personal availability, or blanket
  compliance guarantees.
- Do not fabricate clients, case studies, certifications, results, testimonials,
  technologies used, prices, timelines, or US business locations.
- The user is interested in the practices of US AI development companies. That
  interest does not establish the freelancer's location or an exclusive US market.

## Target-buyer recommendation (not yet confirmed by the user)

The user asked which buyers a solo freelance developer can target. The current
strategic recommendation is to prioritize project fit over company size:

- For AI Integration specifically, prioritize founders/product or engineering
  leads at SaaS businesses and startups with an existing product, a defined AI
  feature need, accessible data/APIs, and a budget for implementation/operation.
- Secondary buyers: owners/operations leads at established small or midsize
  businesses with existing internal software; agencies/product studios seeking
  a specialist subcontractor for a bounded AI integration.
- Enterprise buyers remain possible for a scoped specialist engagement or pilot,
  with procurement and ongoing support requirements assessed individually.
- Idea-stage founders needing an entire first application fit the application/SaaS
  development offering more directly than an integration into existing software.
- Startup stage, company size, and SaaS business model are different dimensions
  and can overlap. Do not present them as strictly exclusive categories.
- This prioritization is professional judgment based on service fit, not a
  verified market-segmentation finding. Actual project evidence, referrals,
  reachable buyers, and sales results should determine final positioning.

Potential positioning for the first page: "I help SaaS founders and small product
teams add practical AI features to their existing applications." This remains
proposed copy until the user confirms the audience.

Supporting research: Upwork's 2026 skills report uses freelancer earnings with
US-origin demand and reports growth in AI Integration. It establishes a freelance
market example, not which segment is best for this developer:
https://investors.upwork.com/news-releases/news-release-details/upworks-demand-skills-2026-demand-top-ai-skills-more-doubles-ai

## Service tree

```text
AI Systems & Integration
|
+-- AI Integration Services
|   +-- Generative AI & LLM Integration
|   +-- RAG & Intelligent Search
|   +-- Conversational AI Integration
|   +-- Intelligent Document Processing
|   +-- Natural-Language Data Queries
|
+-- AI Workflow Automation
|   +-- Lead Qualification & CRM Automation
|   +-- Email & Inbox Automation
|   +-- Customer Support Workflow Automation
|   +-- Document Workflow Automation
|   +-- Content Workflow Automation
|   +-- Reporting & Summary Automation
|
+-- AI Agent Development
    +-- Custom AI Agent Development
    +-- Agent Tool & API Integration
    +-- Agent Harness Setup & Customization
    +-- Multi-Agent Systems & Orchestration
    +-- Agent Testing & Evaluation
```

The user explicitly requested inclusion of Multi-Agent Systems & Orchestration.
Do not silently remove it or revert it to an excluded offering. It still needs
honest scoping and evidence of capability.

Other existing service groups remain relevant:

- Application Development: Web Application Development, Mobile App Development,
  TV App Development, SaaS Development.
- Infrastructure & Operations: DevOps Services, MLOps Services.

## Boundaries: organize by the primary client deliverable

- AI Integration: add a bounded AI capability to existing software or data access.
- AI Workflow Automation: execute a repeatable business process with predefined
  orchestration, triggers, routing, and approvals across connected tools.
- AI Agent Development: build or improve agents that choose steps and tools
  within agreed boundaries to accomplish a task.
- MLOps: ongoing AI evaluation, production tracing/monitoring, version management,
  and performance/cost optimization.
- DevOps: application infrastructure, deployment pipelines, and operations.
- Application development: complete application builds; an AI feature can be a
  component without turning the AI Integration page into a general app-build page.

Shared technologies and implementation work are normal. Avoid repeating the same
sales pitch across pages or making rigid claims that capabilities cannot overlap.

Examples:

- An invoice extraction feature inside an app: AI Integration.
- Invoice intake, extraction, approval routing, and accounting updates as a
  repeatable process: AI Workflow Automation.
- An assistant that investigates a request and selects tools/actions dynamically:
  AI Agent Development.

Tool/API integration here means enabling agent tool use; generic AI API features
belong on the Integration page. Initial agent testing is part of development;
recurring production evaluation belongs under MLOps. Memory, task state, context,
execution loops, interruption recovery, and approval controls are harness
capabilities rather than additional top-level service pages. An evaluation
harness is distinct from an agent execution harness.

## Page architecture recommendation carried forward

The last recommendation was to launch three dedicated service pages, with AI
Systems & Integration initially a category section on the main Services page:

```text
/services/
  AI Systems & Integration [category section]
    /services/ai-integration/
    /services/ai-workflow-automation/
    /services/ai-agent-development/
```

These are proposed URLs, not confirmation of existing live routes. A historical
removed draft used `/services/ai-integration-services/`. Verify current CMS slugs,
live URLs, and any indexed URLs before selecting a final slug or adding redirects.

Keep the 16 subservices as sections within their respective pages initially.
A separate category overview or individual subservice page can be added when it
offers distinct buyer value, enough original content/evidence, and justified
demand. More pages alone do not guarantee better rankings. Different URL nesting
is not a prerequisite for a useful hierarchy.

Use a service-specific FAQ heading in sentence case. Follow the existing
**AI integration FAQs** pattern with **AI workflow automation FAQs** and
**AI agent development FAQs**.

Candidate page topics are AI integration services, AI workflow automation
services, and AI agent development services. No US keyword-volume, difficulty,
Search Console, or comprehensive search-result intent analysis has been performed.
Industry terms are recognizable, but exact combined headings are proposed copy,
not a universal standardized service taxonomy.

## First page: AI Integration Services

The AI Integration Services page is implemented at `/services/ai-integration/`.
Its website copy is maintained in
[`src/content/services/ai-integration.md`](../src/content/services/ai-integration.md).
The user deferred the real-project section; add project evidence when they are
ready. The page is linked from the homepage service card and included in the
production sitemap when indexing is enabled. Deployment is a separate step.

Before layout or implementation, establish:

1. Buyer and problem: who is hiring, what existing software they have, what
   specific capability they need, and the outcome that can be checked.
2. Offer and boundaries: which of the five subservices can actually be delivered;
   distinguish a feature integration from a workflow, agent, or whole app build.
3. Evidence: identify genuine relevant projects, demonstrations, screenshots,
   technical explanations, and results. Label demonstrations as demonstrations.
4. Search intent: inspect current US results for the main topic and close variants;
   choose one main intent for this page. Avoid claiming measured demand without data.
5. Delivery scope: document inputs/access required, deliverables, validation,
   deployment/handover, model/API costs, and the support arrangement.
6. Page outline: clear H1 and proposition, problems/use cases, the five subservices,
   proof, process, deliverables, relevant FAQs, and a contact action. Include details
   only when they help the buyer assess fit.
7. Conversion: select a clear primary action and an actually working contact path;
   explain what information the prospect should bring and what happens next.
8. Publication QA: readable mobile/desktop layout, working links and inquiry path,
   descriptive metadata, correct canonical, intended production indexing,
   sitemap eligibility, accurate structured data, and accessible page structure.

Before developing, the most useful concrete artifact is a short page brief
covering buyer, problem, scope, evidence, primary search intent, and contact action.
Do not invent unknown business facts to complete that brief.

## Next page: AI Workflow Automation

- Draft route: `/services/ai-workflow-automation/`. The page copy lives in
  [`src/content/services/ai-workflow-automation.md`](../src/content/services/ai-workflow-automation.md).
  The draft has noindex and is outside the published service list and sitemap.
- The Connected workflows diagram sits directly on the hero background and
  follows the AI Integration hero's light nodes and animated connections. It
  shows a website form, shared inbox, and invoice upload flowing through AI and
  business rules to lead assignment, email routing, and approval. The service
  cards use icons and written examples.
- Working H1: **AI Workflow Automation Services**. Open with what a client can
  hire Shibly to build: a repeatable process that connects the tools they already use.
- Put **What is AI workflow automation?** first in the FAQ. Explain how a trigger
  starts the workflow, AI handles steps such as reading an inquiry, and business
  rules route the work, including to a person for review when needed.
- Keep the six subservices in the service tree as sections on this page. For each,
  give an example with a trigger, connected tools, review point, and a result the
  client can verify. Cover testing, exception handling, and handover in the copy.
- Candidate featured example: a website inquiry starts a workflow that extracts lead
  details, applies qualification rules, and creates a HubSpot follow-up or review
  task. n8n and HubSpot are proposed demo tools. Describe it as an example until
  there is a working demo or a verified client project to show.
- The Google results reviewed on 2026-11-11 displayed Mountain View, CA. The main
  service query returned providers, guides, and software comparisons. DATAFOREST
  and Netrix Global were the closest service-page references in that snapshot.
  This supports a service page with a short definition and concrete examples.

## AI Agent Development service page

- The [page copy](../src/content/services/ai-agent-development.md) covers all five
  subservices. The homepage's AI Agent Development card links to
  `/services/ai-agent-development/`. The service page is marked noindex and is
  excluded from the sitemap.
- The page addresses SaaS teams with an existing product and a specific task
  that requires choosing between tools or actions. The support investigation
  scenario is an illustrative example. It sits below the hero, before the five
  service sections. Replace or supplement it with a labeled demo or verified
  project when there is evidence to show.
- The November 11, 2026 Valentin.app Google snapshot used US English and showed
  Mountain View, CA. The broad query led with guides from IBM and OpenAI.
  **AI Agent Development Services** returned provider pages such as N-iX and
  Rishabh Software. **Custom AI Agent Development Services** shared several
  results with it. The four other subservice queries leaned toward documentation,
  training, and tool comparisons. This supports one service page with all five
  sections. Search volume and ranking difficulty were not measured.

## Existing repository/CMS considerations

Repository documentation records that earlier generated Services content and nine
service drafts were removed at the owner's request; homepage summaries remain.
Do not restore those generated drafts automatically. Saved removal reports are
historical evidence, not a live database inventory.

The Services collection already supports the three categories, title, slug,
summary, rich-text body, reviewed-details flag, benefits, process, FAQs, image,
ordering, actions, and publishing/SEO fields. Review the current renderer before
assuming that every field is displayed as intended.

Relevant local references:

- `src/content/approved.json`: existing approved homepage/service summaries.
- `src/collections.ts`: CMS collection fields.
- `src/website/service-pages.tsx`: existing service renderer.
- `docs/seo-and-publishing.md`: publishing, SEO, environment/indexing behavior.
- `docs/content-editing.md`: owner editing workflow.
- `docs/service-page-removal.json`: historical removed content/routes.

The documented publication rules require reviewed nonempty service details.
Local/staging noindex is intentional; production indexing depends on environment
configuration. Check current behavior when implementing. Read the installed
Next.js guides required by AGENTS.md before code changes.

## Primary-source research retained from the discussion

Observed company structures illustrate practice; they do not prove SEO performance
or establish that every US provider follows the same architecture.

- Azumo: https://azumo.com/artificial-intelligence
  Broad AI overview with dedicated agent, RAG, generative AI, and MLOps pages.
- Coherent Solutions: https://www.coherentsolutions.com/artificial-intelligence
- Coherent agents: https://www.coherentsolutions.com/artificial-intelligence/agentic-ai
  Broad and specialist pages; agent capabilities are sections on a specialist page.
- Agent/workflow distinction:
  https://www.anthropic.com/research/building-effective-agents
- Harness terminology:
  https://www.langchain.com/blog/the-anatomy-of-an-agent-harness
- Helpful content:
  https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Internal links:
  https://developers.google.com/search/docs/crawling-indexing/links-crawlable

Refresh sources when making new time-sensitive claims. No ranking, demand, or
delivery guarantee follows from these examples.
