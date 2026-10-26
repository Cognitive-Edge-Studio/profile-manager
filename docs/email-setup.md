# Activate inquiry email delivery

Both owner-supplied recipient addresses have been saved privately in `.env.local`. Multiple-recipient delivery and stable retries pass local tests with a mocked email service. No real email has been sent. Sending is disabled until the sender and API key are configured.

1. Create your own account at [Resend](https://resend.com/).
2. In **Domains**, add a domain you own, preferably a sending subdomain such as `notifications.your-domain.com`. Add the exact DNS records Resend supplies in the DNS settings of your domain provider, then wait for Resend to show **Verified**. A Gmail address cannot be verified as your own sending domain. See [verified domains](https://resend.com/docs/dashboard/domains/introduction).
3. In **API Keys**, create a key for this website with **Sending access**, restricted to that verified domain. Save it privately: the key value is shown only when created. See [API key management](https://resend.com/docs/dashboard/api-keys/introduction). Do not paste the key into chat, CMS fields, or public code.
4. Set `RESEND_API_KEY` in the ignored local `.env.local` file and set `CONTACT_NOTIFICATION_FROM` to an address at the verified sending domain, for example `inquiries@notifications.your-domain.com`. Leave the configured recipient list in place. The developer can then enable `CONTACT_NOTIFICATION_PROVIDER=resend` and restart the website and notification worker.
5. Confirm the intended email contents before enabling delivery. The current implementation sends only a private inquiry dashboard link. Full visitor details stay in the CMS.
6. After setup, send an explicitly labelled test notification to both recipients and verify receipt in each inbox. Provider acceptance alone does not confirm inbox delivery. Existing failed notifications need an administrator's Retry action; previously prepared envelopes retain their original recipients to avoid duplicate delivery on retry.

The website currently uses local addresses. For a recipient on another computer, the dashboard link needs a deployed website address. Form submission is enabled only for published Home/Contact content and published site settings; private draft previews do not submit forms. No content is published as part of configuring delivery.
