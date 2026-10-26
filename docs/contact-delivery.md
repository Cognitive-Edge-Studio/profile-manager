# Contact inquiries — Slice 6

This slice updates only the finalized homepage and Contact page. No public pages or unreviewed copy pages were added. The original Vite source and calculator arithmetic are unchanged. Actual imported records remain drafts. A separate disposable website/database was used for submission tests.

## Owner workflow

Open **Administration → Inquiries**. Only administrators can read, update workflow status or delete inquiries. Editors and visitors cannot read them. Original submitted details are read-only. Use **new**, **read**, and **replied** to track your own follow-up; changing a status does not send a reply. Reply through your email application. Deleting an inquiry permanently removes the stored record.

The notification panel distinguishes storing the inquiry from notifying its owner. **Email service accepted** means the sending service accepted the request, not that an email reached the inbox. **Failed** leaves the inquiry available in the dashboard. **Retry notification** retries notification delivery without creating another inquiry. A request already accepted by the email service cannot be resent through that button. **Captured locally** sends nothing. **Needs delivery review** requires checking the provider before any manual resend.

Under **Site settings → Contact form**, edit the homepage form heading, labels, helper text, message example, button wording and optional next-step note. Required fields/types/lengths and acceptance confirmation remain code-controlled. On Contact, the Contact form section's heading takes priority over the global fallback heading. Page introduction and next-step copy remain in the finalized Pages records; booking links keep using the existing link controls. Saving/publishing settings refreshes form copy on the next request.

Saved draft previews show the existing design and allow trying text/calculator edits, but disable submission and do not request submission tokens. Test submission on a reviewed published staging copy. Without JavaScript, a direct email fallback remains available. On the published form, success appears only after database commit. Errors retain the visitor's inputs. Unchanged retries reuse a submission identity, including after a timeout. An accepted calculator inquiry clears its shared summary; calculator calculation rules remain unchanged.

## Local state and email setup

The two receiving addresses supplied by the owner are stored only in ignored `.env.local` as a comma-separated `CONTACT_NOTIFICATION_TO` list; they do not replace the website's public contact address. Real email is currently disabled. No provider credentials, paid services, sender domain or external delivery were configured. Receiving Gmail addresses are not sending-service credentials. The adapter validates every recipient, rejects malformed lists, removes duplicates, and retains the original recipient list for retries.

The implemented provider adapter is Resend. Before release, a developer must verify an authorized sender domain, configure the service, and set private server environment variables:

```dotenv
CONTACT_SUBMISSIONS_ENABLED=true
CONTACT_RETENTION_DAYS=180
CONTACT_NOTIFICATION_PROVIDER=resend
CONTACT_NOTIFICATION_TO=first-recipient@example.com,second-recipient@example.com
CONTACT_NOTIFICATION_FROM=a-verified-sender@your-domain.example
RESEND_API_KEY=your-private-key
CONTACT_WORKER_SECRET=a-private-random-value-of-at-least-32-characters
SITE_URL=https://your-approved-domain.example
```

Never paste API keys into content fields or use NEXT_PUBLIC variables for secrets. `disabled` stores accepted inquiries and records a configuration failure for notification. `capture` is allowed only with `CMS_ENV=local` or `test`; it records a local capture status and makes no outbound request. Production cannot use capture. Inquiry notifications contain only an authenticated dashboard link and record number, with no visitor name, email or message. No automatic visitor acknowledgement/reply is sent. Password-recovery email remains separately disabled pending Slice 7 setup.

Notification delivery needs an active worker. For this local long-running environment:

```powershell
npm run inquiries:work -- --watch
```

For a single maintenance run, omit `--watch`. It processes up to five notifications, deletes up to 100 expired inquiries and cleans expired rate/receipt data. It reports aggregate counts only. The dashboard shows its last completed run. Production must either run this worker reliably or schedule an authenticated **POST /api/contact/maintenance** with `Authorization: Bearer <CONTACT_WORKER_SECRET>`, normally every minute. The HTTP job is bounded to 60 seconds and returns counts, not inquiry content. Deployment scheduling, secrets and alerting still need verification in Slice 7.

## Acceptance, limits and retries

`GET /api/contact` issues a short-lived signed form token after a database-backed request limit. `POST /api/contact` requires an approved Origin, same-site browser context, application/json, valid signed token, a brief interaction interval, an empty honeypot and a strict body schema. It rejects unknown fields, oversized streamed bodies, control characters, invalid email, absent name and short/oversized message. The body limit is 32 KiB. Name, email, message, budget and timeline retain their established field limits. Budget and timeline remain optional. Both form source and site settings must be published before a new inquiry can be accepted. The endpoint returns no record identifier or private content.

The transaction takes a per-identity PostgreSQL lock, checks a keyed content digest, applies database-backed limits, inserts the private inquiry with its pending notification and records a receipt. Commit precedes HTTP acceptance. Concurrent identical retries create one record; changed content with the same identity returns 409. Deleted inquiries cannot be immediately recreated by a retry: a receipt containing keyed digests only is kept for seven days. A stored inquiry also retains its deduplication identity for its lifetime. No visitor form contents are persisted to browser storage.

Default limits are 300 token requests/site/hour, 50 accepted inquiries/site/hour, five/email/hour and three/token/hour. When a trusted forwarding header is explicitly configured, token requests are also limited to 60/network/hour and accepted inquiries to ten/network/hour. Raw IPs, user agents and emails are not stored in the rate table; rate identities are secret-keyed digests. Do not set `CONTACT_TRUSTED_IP_HEADER` until the hosting proxy is verified to overwrite that header. Visitor-supplied forwarding headers are ignored by default. These conservative small-site defaults must be reviewed against real traffic during release; additional CAPTCHA or edge controls can be added if actual abuse warrants them.

After acceptance, Next's `after` makes a best-effort immediate notification attempt. The pending row is the durable outbox; a process crash leaves it available to the worker. Database leases and SKIP LOCKED coordinate workers. The provider request is bounded to eight seconds. Retryable failures use 1 minute, 5 minutes, 15 minutes, 1 hour and 3 hour delays, then stop for owner review. Missing configuration and permanent rejections wait for correction/manual retry. The original sender/recipient/content is snapshotted before sending, so retries use the same envelope and provider idempotency key.

Resend retains idempotency keys for 24 hours. This application stops ambiguous retries after 23 hours from the first external attempt, leaving a margin and a visible review state. It cannot promise unlimited exactly-once delivery across provider outages or account/configuration changes. Provider acceptance is recorded separately from inbox delivery; bounce/webhook processing is not included. Delivery bookkeeping does not modify the workflow updatedAt timestamp, so notification retries do not invalidate an administrator's status edits.

## Retention and release boundaries

Local default retention is 180 days, configurable from 7–365 days. The inline notice explains private storage, scheduled deletion and notification content, and discourages sensitive information. The policy is a working local default to review before release. Each inquiry has its own deletion deadline. Admin deletion removes the record sooner; the scheduled worker removes expired records in bounded batches when running. A paused/broken worker delays cleanup, so verify its heartbeat. Existing backups have their own expiry; production backup/provider policies and final privacy wording must match actual hosting before launch. No public privacy page has been created.

Raw SQL is intentionally limited to the PostgreSQL contact tables and immutable inquiry/outbox fields. The public endpoint accepts no arbitrary collection, query or notification recipient. Private Payload access rules remain in force for all normal inquiry APIs. Auxiliary contact tables are created by the committed migration; do not use development schema push on this database. Contact storage is unavailable rather than reporting success when its transaction fails. No message bodies, addresses, provider response bodies or tokens are intentionally logged.

Evidence: [HTTP checks](slice6-http-checks.json), [browser checks](slice6-browser-checks.json), [local content state](slice6-local-state.json), and `screenshots/slice6/`. Run `npm test`, `npm run test:integration`, `npm run build`, `npm run verify:contact`; calculator regression tests remain in the parent app. Tests use uniquely named disposable databases guarded before writes. Provider transport tests stub outbound requests; no real email is sent.

Provider reference: [Resend idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys) and [send-email API](https://resend.com/docs/api-reference/emails/send-email). Next's installed Route Handler and after documentation was read before implementation.
