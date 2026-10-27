# SaveMySeat

Event invitations and RSVPs. Hosts create an event, upload an invitation, paste in guest emails and send invites; guests RSVP from a personal link; the host tracks everything from one table.

Live at [savemyseat.events](https://savemyseat.events).

## Stack

- **apps/web**: Next.js 16 (App Router, Server Actions), Tailwind v4, Outfit, Phosphor icons
- **packages/db**: Prisma 7 + Neon Postgres (`pg` driver with Vercel's `attachDatabasePool`)
- **Images**: Neon Object Storage, public `invitations` bucket (declared in `neon.ts`)
- **Auth**: better-auth magic links
- **Email**: Resend (invites, reminders, RSVP confirmations, sign-in links) + webhook for delivery status
- **Hosting**: Vercel

## Local development

```bash
pnpm install                 # also generates the Prisma client
neon env pull                # writes Neon vars into .env (see .env.example for the rest)
pnpm db:migrate              # apply migrations
pnpm db:seed                 # optional: demo event at /joseph
pnpm dev                     # http://localhost:3000
```

In development, sign-in links are also printed to the terminal, so you don't need to open your inbox.

## Environment variables

See [.env.example](.env.example). On Vercel, set all of them for Production (and Preview if you use it):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | From `neon env pull` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` | Neon Object Storage, from `neon env pull` |
| `APP_URL` | Public URL, no trailing slash, e.g. `https://savemyseat.events` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` | Resend API key with sending access |
| `EMAIL_FROM` | e.g. `SaveMySeat <invites@savemyseat.events>` (domain must be verified in Resend) |
| `RESEND_WEBHOOK_SECRET` | Signing secret of the Resend webhook below |

## Resend webhook

Endpoint: `https://savemyseat.events/api/webhooks/resend`
Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.failed`, `email.suppressed`.
Copy the signing secret (`whsec_…`) into `RESEND_WEBHOOK_SECRET`. For "Opened", turn on open tracking for the domain in Resend; opening the RSVP link also counts as opened.

## Database changes

```bash
# edit packages/db/prisma/schema.prisma, then:
pnpm db:migrate                                       # creates + applies a migration locally
pnpm db:deploy                                        # apply to production (uses DATABASE_URL_UNPOOLED)
```
